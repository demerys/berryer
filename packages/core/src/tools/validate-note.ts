import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PisteHttpClient } from "../http.js";
import { log } from "../logger.js";

type RefType = "KALITEXT" | "LEGIARTI" | "LEGITEXT" | "JURITEXT" | "JORFTEXT" | "BOI";

interface RefMatch {
  type: RefType;
  id: string;
}

interface ValidationResult {
  id: string;
  type: RefType;
  exists: boolean;
  title?: string;
  scope?: string;
  url: string;
  error?: string;
}

const ID_PATTERNS: Array<[RefType, RegExp]> = [
  ["KALITEXT", /KALITEXT\d{8,14}/g],
  ["LEGIARTI", /LEGIARTI\d{8,14}/g],
  ["LEGITEXT", /LEGITEXT\d{8,14}/g],
  ["JURITEXT", /JURITEXT\d{8,14}/g],
  ["JORFTEXT", /JORFTEXT\d{8,14}/g],
  ["BOI", /\bBOI-[A-Z]{2,5}(?:-[A-Z0-9]{1,5}){1,6}\b/g],
];

function extractReferences(note: string): RefMatch[] {
  const matches: RefMatch[] = [];
  const seen = new Set<string>();
  for (const [type, regex] of ID_PATTERNS) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(note)) !== null) {
      const id = m[0];
      const key = `${type}:${id}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({ type, id });
      }
    }
  }
  return matches;
}

function urlFor(ref: RefMatch): string {
  switch (ref.type) {
    case "KALITEXT":
      return `https://www.legifrance.gouv.fr/conv_coll/id/${ref.id}/`;
    case "LEGITEXT":
      return `https://www.legifrance.gouv.fr/loda/id/${ref.id}/`;
    case "JORFTEXT":
      return `https://www.legifrance.gouv.fr/jorf/id/${ref.id}/`;
    case "LEGIARTI":
      return `https://www.legifrance.gouv.fr/codes/article_lc/${ref.id}/`;
    case "JURITEXT":
      return `https://www.legifrance.gouv.fr/juri/id/${ref.id}/`;
    case "BOI":
      return `https://www.legifrance.gouv.fr/circulaire/id/${ref.id}/`;
  }
}

function pickString(...candidates: unknown[]): string | undefined {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) return c.trim();
  }
  return undefined;
}

function extractTitle(raw: any, type: RefType): string | undefined {
  if (type === "JURITEXT") {
    return pickString(raw?.text?.titre, raw?.text?.titreLong, raw?.titre);
  }
  return pickString(
    raw?.title,
    raw?.titre,
    raw?.titreLong,
    raw?.text?.titre,
    raw?.text?.titreLong,
    raw?.article?.titre,
  );
}

function extractScope(raw: any, type: RefType): string | undefined {
  if (type === "KALITEXT") {
    return pickString(
      raw?.contexte?.text?.titre,
      raw?.contexte?.text?.titreLong,
      raw?.contexte?.titre,
      raw?.cidTexte,
      raw?.parent?.titre,
    );
  }
  if (type === "JURITEXT") {
    const j = pickString(raw?.text?.juridiction);
    const formation = pickString(raw?.text?.formation);
    return [j, formation].filter(Boolean).join(" · ") || undefined;
  }
  if (type === "LEGIARTI" || type === "LEGITEXT") {
    return pickString(raw?.context?.titreTxt?.titre, raw?.article?.context?.titreTxt?.titre);
  }
  return undefined;
}

async function validateRef(ref: RefMatch, http: PisteHttpClient): Promise<ValidationResult> {
  const url = urlFor(ref);
  let path: string;
  let body: Record<string, string>;
  switch (ref.type) {
    case "KALITEXT":
    case "LEGITEXT":
    case "JORFTEXT":
      path = "/consult/lawDecree";
      body = { textId: ref.id };
      break;
    case "LEGIARTI":
      path = "/consult/getArticle";
      body = { id: ref.id };
      break;
    case "JURITEXT":
      path = "/consult/juri";
      body = { textId: ref.id };
      break;
    case "BOI":
      path = "/consult/jorfPart";
      body = { searchedString: ref.id };
      break;
  }

  try {
    const raw: any = await http.post(path, body);
    if (!raw || (typeof raw === "object" && Object.keys(raw).length === 0)) {
      return { id: ref.id, type: ref.type, exists: false, url, error: "réponse vide" };
    }
    if (ref.type === "JURITEXT" && !raw?.text) {
      return { id: ref.id, type: ref.type, exists: false, url, error: "décision introuvable" };
    }
    return {
      id: ref.id,
      type: ref.type,
      exists: true,
      title: extractTitle(raw, ref.type),
      scope: extractScope(raw, ref.type),
      url,
    };
  } catch (err: any) {
    const msg = err?.message ? String(err.message) : String(err);
    return { id: ref.id, type: ref.type, exists: false, url, error: msg.slice(0, 240) };
  }
}

export function registerValidateNote(server: McpServer, http: PisteHttpClient) {
  server.registerTool(
    "validate_note",
    {
      title: "Valider toutes les références Légifrance citées dans une note",
      description: [
        "Extrait par regex tous les identifiants Légifrance (KALITEXT, LEGIARTI, LEGITEXT, JURITEXT, JORFTEXT, BOI-) cités dans une note, et vérifie pour chacun (a) son existence côté Légifrance, (b) son titre exact, (c) son champ d'application réel (branche pour KALI, juridiction pour JURI, code parent pour LEGIARTI).",
        "À APPELER OBLIGATOIREMENT en fin de production de note ou de consultation, avant restitution à l'utilisateur. C'est le seul garde-fou non-LLM contre les hallucinations résiduelles : identifiants forgés (IDs qui n'existent pas) ET identifiants vrais mais rattachés à une autre branche que celle annoncée (« piège des branches » : un KALITEXT du bricolage cité dans une note coiffure passe la vérif d'existence mais reste une hallucination).",
        "Retourne un rapport markdown avec verdict par référence. Si une référence est invalide ou mal attribuée, l'agent doit la retirer ou la marquer « à confirmer » avant restitution finale.",
      ].join("\n"),
      inputSchema: {
        note: z
          .string()
          .min(1)
          .describe("Texte complet de la note à valider, en markdown. Tu y passes la note finale telle que tu l'enverrais au lecteur."),
      },
    },
    async (args) => {
      const refs = extractReferences(args.note);
      if (refs.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "Aucun identifiant Légifrance détecté (KALITEXT/LEGIARTI/LEGITEXT/JURITEXT/JORFTEXT/BOI-). Si ta note contient des citations sans aucun de ces IDs, le format imposé (cf. skill geny) n'est pas respecté — chaque date d'acte juridique doit être suivie de son identifiant entre parenthèses. Réécris la note avec les IDs, ou marque explicitement les références non vérifiées « à confirmer ».",
            },
          ],
        };
      }

      log.info("validate-note: checking refs", { count: refs.length });

      const results = await Promise.all(refs.map((r) => validateRef(r, http)));
      const ok = results.filter((r) => r.exists);
      const ko = results.filter((r) => !r.exists);

      const lines: string[] = [];
      lines.push(`# Validation de ${results.length} référence(s) Légifrance citée(s)`);
      lines.push("");
      lines.push(
        `**Synthèse** : ${ok.length}/${results.length} référence(s) trouvée(s) côté Légifrance, ${ko.length} échec(s) de vérification.`,
      );
      lines.push("");

      if (ko.length > 0) {
        lines.push("## ⚠️ Références non vérifiables");
        lines.push("");
        for (const r of ko) {
          lines.push(`- \`${r.id}\` (${r.type}) — **${r.error ?? "vérification impossible"}**`);
          lines.push(`  - URL tentée : ${r.url}`);
        }
        lines.push("");
        lines.push(
          "**Action requise** : pour CHAQUE référence ci-dessus, soit tu la récupères maintenant via le bon `legifrance_get_*` tool (et tu mets à jour ta note avec le titre exact), soit tu la retires de ta note et tu la remplaces par « à confirmer (référence non vérifiée) ». **Une référence non vérifiée ne doit jamais être livrée au lecteur.**",
        );
        lines.push("");
        lines.push(
          "Si toutes les vérifications échouent (HTTP 400, 503…), c'est probablement un hoquet PISTE temporaire : retente dans 30 secondes ou ajoute un disclaimer fort en tête de note.",
        );
        lines.push("");
      }

      if (ok.length > 0) {
        lines.push("## ✓ Références confirmées existantes");
        lines.push("");
        for (const r of ok) {
          lines.push(`- \`${r.id}\` (${r.type})`);
          if (r.title) lines.push(`  - Titre réel : **${r.title}**`);
          if (r.scope) lines.push(`  - Rattachement / contexte : ${r.scope}`);
          lines.push(`  - URL : ${r.url}`);
        }
        lines.push("");
        lines.push(
          "**Action requise — piège des branches** : pour CHAQUE KALITEXT confirmé ci-dessus, vérifie que le titre réel correspond bien à la branche (CCN/IDCC) que tu annonces dans ta note. Idem pour les LEGIARTI : le code parent réel doit correspondre au code annoncé. Un identifiant valide mais mal attribué (avenant du bricolage cité dans une note coiffure) reste une hallucination et discrédite ta note.",
        );
        lines.push("");
        lines.push(
          "Si un titre réel ne correspond pas à ce que tu annonçais, tu DOIS : retirer la référence, ou la remplacer par la bonne référence (relance `legifrance_recherche` ciblée sur la bonne branche), ou marquer explicitement « à confirmer ».",
        );
        lines.push("");
      }

      lines.push("---");
      lines.push(
        "*Ce tool vérifie l'existence et le rattachement des identifiants. Il ne vérifie pas que tu as cité le bon identifiant pour répondre à la question initiale. Le cross-check sémantique final reste à ta charge.*",
      );

      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );
}
