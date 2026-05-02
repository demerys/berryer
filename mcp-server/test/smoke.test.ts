import { describe, it, expect } from "vitest";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const SERVER = resolve(__dirname, "../dist/index.js");

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

function sendAndCollect(messages: object[], timeoutMs = 5000): Promise<JsonRpcResponse[]> {
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
          // ignore parse errors (log lines, etc.)
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
      reject(new Error(`timeout, got ${responses.length}/${messages.length}: ${JSON.stringify(responses)}`));
    }, timeoutMs);
    proc.on("exit", () => clearTimeout(timer));

    for (const m of messages) {
      proc.stdin.write(JSON.stringify(m) + "\n");
    }
  });
}

describe("berryer mcp server — smoke", () => {
  it("expose les tools attendus via tools/list", async () => {
    const init = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "smoke-test", version: "0.0.0" },
      },
    };
    const list = { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} };
    const responses = await sendAndCollect([init, list]);
    expect(responses).toHaveLength(2);
    const listResp = responses[1]!;
    expect(listResp.error).toBeUndefined();
    const result = listResp.result as { tools: { name: string }[] };
    const names = result.tools.map((t) => t.name);
    const expected = [
      "piste_status",
      "piste_cache_clear",
      "legifrance_recherche",
      "legifrance_get_article",
      "legifrance_get_code",
      "legifrance_get_loda",
      "legifrance_get_jurisprudence",
      "legifrance_get_jorf",
      "legifrance_get_circulaire",
      "legifrance_suggest",
    ];
    for (const name of expected) {
      expect(names, `tool ${name} missing`).toContain(name);
    }
  });

  it("appelle piste_status et reçoit un JSON valide", async () => {
    const init = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "smoke-test", version: "0.0.0" },
      },
    };
    const call = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "piste_status", arguments: {} },
    };
    const responses = await sendAndCollect([init, call]);
    const callResp = responses[1]!;
    expect(callResp.error).toBeUndefined();
    const result = callResp.result as { content: { type: string; text: string }[] };
    expect(result.content[0]!.type).toBe("text");
    const status = JSON.parse(result.content[0]!.text) as { env: string };
    expect(status.env).toMatch(/production|sandbox/);
  });
});
