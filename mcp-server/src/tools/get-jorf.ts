import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PisteHttpClient } from "../http.js";
import { ConsultJorfResponseSchema } from "../schemas.js";
import { log } from "../logger.js";

export function registerGetJorf(server: McpServer, http: PisteHttpClient) {
  server.registerTool(
    "legifrance_get_jorf",
    {
      title: "Texte du Journal officiel (JORF)",
      description:
        "Récupère un texte du Journal officiel par son identifiant JORFTEXT. Retourne titre, nature, date, NOR, résumé, notice, et structure (sections + articles).",
      inputSchema: {
        textCid: z.string().describe("Identifiant JORFTEXT du texte (chronical ID)."),
      },
    },
    async (args) => {
      const raw = await http.post("/consult/jorf", { textCid: args.textCid });
      const parsed = ConsultJorfResponseSchema.safeParse(raw);
      if (!parsed.success) {
        log.warn("get-jorf: response shape unexpected", { issues: parsed.error.issues.slice(0, 3) });
        return {
          isError: true,
          content: [{ type: "text", text: `Réponse Légifrance inattendue : ${parsed.error.message.slice(0, 300)}` }],
        };
      }
      const d = parsed.data;
      const lines: string[] = [];
      lines.push(`# ${d.title ?? "(sans titre)"}`);
      const meta: string[] = [];
      if (d.nature) meta.push(d.nature);
      if (d.dateTexte) meta.push(d.dateTexte.slice(0, 10));
      if (d.textNumber) meta.push(`Texte n° ${d.textNumber}`);
      if (d.nor) meta.push(`NOR : ${d.nor}`);
      if (meta.length) lines.push(`_${meta.join(" · ")}_\n`);
      if (d.resume) lines.push(d.resume + "\n");
      if (d.notice) lines.push("## Notice\n" + d.notice + "\n");

      const articleCount = (d.articles ?? []).length;
      const sectionCount = (d.sections ?? []).length;
      lines.push(`Structure : ${sectionCount} section(s), ${articleCount} article(s) racine.`);
      lines.push(`\nIdentifiant : \`${args.textCid}\` · [Légifrance](https://www.legifrance.gouv.fr/jorf/id/${args.textCid})`);

      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );
}
