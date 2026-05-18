import { describe, it, expect } from "vitest";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

// Tests de régression anti-hallucination : on appelle le tool `validate_note`
// via le vrai serveur MCP (stdio) avec des notes contenant des KALITEXT
// pièges (vrai/inventé/autre branche) et on vérifie que le tool catch bien
// chaque cas.
//
// Ces tests font de VRAIS appels à l'API Légifrance PISTE — ils ne tournent
// donc que si PISTE_CLIENT_ID et PISTE_CLIENT_SECRET sont en env (sinon ils
// sont skipped via describe.skipIf). En CI, configurer ces variables.

const SERVER = resolve(__dirname, "../../../plugins/berryer/mcp-server/dist/index.js");
const HAS_CREDS = Boolean(process.env.PISTE_CLIENT_ID && process.env.PISTE_CLIENT_SECRET);

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

function sendAndCollect(messages: object[], timeoutMs = 30000): Promise<JsonRpcResponse[]> {
  return new Promise((resolveFn, reject) => {
    const proc = spawn("node", [SERVER], {
      env: { ...process.env, LOG_LEVEL: "error" },
      stdio: ["pipe", "pipe", "pipe"],
    });
    const responses: JsonRpcResponse[] = [];
    let buffer = "";
    proc.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          responses.push(JSON.parse(line) as JsonRpcResponse);
        } catch {
          // ignore (log lines etc.)
        }
      }
      if (responses.length >= messages.length) {
        proc.kill();
        resolveFn(responses);
      }
    });
    proc.on("error", reject);
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error(`timeout, got ${responses.length}/${messages.length}`));
    }, timeoutMs);
    proc.on("exit", () => clearTimeout(timer));
    for (const m of messages) proc.stdin.write(JSON.stringify(m) + "\n");
  });
}

async function callValidateNote(note: string): Promise<string> {
  const init = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "anti-hallu-test", version: "0.0.0" },
    },
  };
  const call = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: { name: "validate_note", arguments: { note } },
  };
  const responses = await sendAndCollect([init, call], 30000);
  const callResp = responses[1]!;
  if (callResp.error) {
    throw new Error(`validate_note error: ${callResp.error.message}`);
  }
  const result = callResp.result as { content: { type: string; text: string }[] };
  return result.content[0]!.text;
}

describe.skipIf(!HAS_CREDS)("anti-hallucination — validate_note (live PISTE)", () => {
  it("retourne un message clair quand la note ne contient aucun identifiant", async () => {
    const note = "# Note basique\n\nVoir art. L. 1234-9 du Code du travail pour l'indemnité légale de licenciement.";
    const text = await callValidateNote(note);
    expect(text).toContain("Aucun identifiant Légifrance détecté");
  }, 30000);

  it("confirme un vrai KALITEXT coiffure (IDCC 2596) avec son titre exact", async () => {
    // KALITEXT000018563760 = CCN coiffure et professions connexes du 10 juillet 2006
    const note = "# Note CCN coiffure\n\nLa CCN applicable est celle du 10 juillet 2006 (KALITEXT000018563760), IDCC 2596.";
    const text = await callValidateNote(note);
    expect(text).toContain("KALITEXT000018563760");
    expect(text).toContain("✓ Références confirmées");
    // Le titre réel doit contenir "coiffure" — c'est ce qui rattrape le piège des branches
    expect(text.toLowerCase()).toContain("coiffure");
  }, 30000);

  it("révèle qu'un KALITEXT du bricolage est cité (à tort) dans une note coiffure", async () => {
    // KALITEXT000051909640 = Avenant salaires CCN bricolage IDCC 1606, PAS coiffure.
    // C'est exactement le piège que le LLM est tombé pendant le test du 18 mai 2026.
    const note = "# Note CCN coiffure\n\nAvenant salaires coiffure du 31 mars 2025 (KALITEXT000051909640), étendu.";
    const text = await callValidateNote(note);
    expect(text).toContain("KALITEXT000051909640");
    expect(text).toContain("✓ Références confirmées");
    // Le titre réel doit révéler "bricolage" — c'est la détection du piège des branches
    expect(text.toLowerCase()).toContain("bricolage");
  }, 30000);

  it("marque comme non vérifiable un KALITEXT inventé", async () => {
    // KALITEXT à 14 chiffres avec un suffixe improbable
    const note = "# Test\n\nVoir KALITEXT000099999999 du 1er janvier 2030.";
    const text = await callValidateNote(note);
    expect(text).toContain("KALITEXT000099999999");
    expect(text).toContain("⚠️ Références non vérifiables");
  }, 30000);

  it("traite plusieurs KALITEXT dans la même note en parallèle", async () => {
    const note = [
      "# Note mixte",
      "",
      "Sources :",
      "- CCN coiffure : KALITEXT000018563760",
      "- Avenant supposé coiffure : KALITEXT000051909640 (en réalité bricolage)",
      "- Avenant n° 41 coiffure : KALITEXT000038014476",
    ].join("\n");
    const text = await callValidateNote(note);
    expect(text).toContain("KALITEXT000018563760");
    expect(text).toContain("KALITEXT000051909640");
    expect(text).toContain("KALITEXT000038014476");
    // Au moins 3 références traitées
    expect(text).toMatch(/3\s*\/\s*3/);
  }, 60000);
});

// Tests purement unitaires (sans réseau) sur l'extraction de patterns.
// Important même sans creds PISTE : valide la regex.
describe("anti-hallucination — extraction de patterns (unit)", () => {
  it("la regex KALITEXT capture bien un ID standard", () => {
    const note = "Voir KALITEXT000018563760 pour la CCN.";
    const match = note.match(/KALITEXT\d{8,14}/);
    expect(match?.[0]).toBe("KALITEXT000018563760");
  });

  it("la regex JURITEXT capture bien un ID standard", () => {
    const note = "Cf. Cass. soc., 8 octobre 2025, JURITEXT000048123456.";
    const match = note.match(/JURITEXT\d{8,14}/);
    expect(match?.[0]).toBe("JURITEXT000048123456");
  });

  it("la regex BOI capture un BOI-... bien formé", () => {
    const note = "Cf. BOI-IS-BASE-30-30-20-20 sur le régime mère-fille.";
    const match = note.match(/\bBOI-[A-Z]{2,5}(?:-[A-Z0-9]{1,5}){1,6}\b/);
    expect(match?.[0]).toBe("BOI-IS-BASE-30-30-20-20");
  });

  it("la regex JORFTEXT capture bien un ID standard", () => {
    const note = "JORFTEXT000052053437 (arrêté du 24 juin 2025).";
    const match = note.match(/JORFTEXT\d{8,14}/);
    expect(match?.[0]).toBe("JORFTEXT000052053437");
  });
});
