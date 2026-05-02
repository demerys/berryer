import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PisteHttpClient } from "../http.js";
import { SUGGEST_SUPPLIES, SuggestResponseSchema } from "../schemas.js";
import { log } from "../logger.js";

export function registerSuggest(server: McpServer, http: PisteHttpClient) {
  server.registerTool(
    "legifrance_suggest",
    {
      title: "Autocomplete / suggestions Légifrance",
      description:
        "Autocomplete cross-fond. Saisissez un début de texte (titre, mot-clé) et obtenez des suggestions structurées (textes, sections, articles) avec leurs identifiants. Utile pour résoudre un nom usuel en LEGITEXT/JURITEXT/etc. avant un appel `get_*`.",
      inputSchema: {
        query: z.string().min(2).describe("Texte à autocompléter (≥ 2 caractères)."),
        supplies: z
          .array(z.enum(SUGGEST_SUPPLIES))
          .default(["ALL"])
          .describe("Fonds à interroger pour les suggestions."),
      },
    },
    async (args) => {
      const body = {
        searchText: args.query,
        supplies: args.supplies,
        documentsDits: false,
      };
      const raw = await http.post("/suggest", body);
      const parsed = SuggestResponseSchema.safeParse(raw);
      if (!parsed.success) {
        log.warn("suggest: response shape unexpected", { issues: parsed.error.issues.slice(0, 3) });
        return {
          isError: true,
          content: [{ type: "text", text: `Réponse Légifrance inattendue : ${parsed.error.message.slice(0, 300)}` }],
        };
      }
      const data = parsed.data;
      const lines: string[] = [];
      lines.push(`**${data.totalResultNumber ?? 0} suggestion(s)** pour "${args.query}" :`);
      lines.push("");

      const groups = data.results ?? {};
      let totalShown = 0;
      for (const [supply, items] of Object.entries(groups)) {
        const entries = Object.entries(items);
        if (entries.length === 0) continue;
        lines.push(`### ${supply}`);
        for (const [id, value] of entries.slice(0, 5)) {
          const label = value.label ?? "(sans titre)";
          const meta = [value.nature, value.dateVersion?.slice(0, 10)].filter(Boolean).join(" · ");
          lines.push(`- **${label}** ${meta ? `_(${meta})_` : ""}`);
          lines.push(`  \`${id}\``);
          totalShown += 1;
        }
        lines.push("");
      }
      if (totalShown === 0) {
        lines.push("_(aucune suggestion)_");
      }
      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );
}
