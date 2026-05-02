import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PisteHttpClient } from "../http.js";
import { ConsultTextResponseSchema } from "../schemas.js";
import { log } from "../logger.js";

export function registerGetLoda(server: McpServer, http: PisteHttpClient) {
  server.registerTool(
    "legifrance_get_loda",
    {
      title: "Texte LODA (loi, décret, ordonnance, arrêté)",
      description: [
        "Récupère un texte du fonds LODA (Lois, Ordonnances, Décrets, Arrêtés) par son identifiant LEGITEXT.",
        "Retourne titre, nature, état (VIGUEUR/ABROGE…), dates clés, résumé et liste d'articles racine.",
        "Pour le contenu d'un article précis, utilisez `legifrance_get_article`.",
      ].join("\n"),
      inputSchema: {
        textId: z
          .string()
          .describe("Identifiant LEGITEXT du texte (ex. `LEGITEXT000006069577` pour le CGI)."),
        date: z
          .string()
          .optional()
          .describe("Date de consultation yyyy-MM-dd. Par défaut : aujourd'hui."),
      },
    },
    async (args) => {
      const date = args.date ?? new Date().toISOString().slice(0, 10);
      const raw = await http.post("/consult/lawDecree", { textId: args.textId, date });
      const parsed = ConsultTextResponseSchema.safeParse(raw);
      if (!parsed.success) {
        log.warn("get-loda: response shape unexpected", { issues: parsed.error.issues.slice(0, 3) });
        return {
          isError: true,
          content: [{ type: "text", text: `Réponse Légifrance inattendue : ${parsed.error.message.slice(0, 300)}` }],
        };
      }
      const d = parsed.data;
      const lines: string[] = [];
      lines.push(`# ${d.title ?? d.titreLong ?? "(sans titre)"}`);
      const meta: string[] = [];
      if (d.nature) meta.push(d.nature);
      if (d.etat) meta.push(d.etat);
      if (d.dateDebut) meta.push(`En vigueur depuis ${d.dateDebut.slice(0, 10)}`);
      if (d.dateFin && d.dateFin !== "2999-01-01") meta.push(`Fin : ${d.dateFin.slice(0, 10)}`);
      if (d.nor) meta.push(`NOR : ${d.nor}`);
      if (d.eli) meta.push(`ELI : ${d.eli}`);
      if (meta.length) lines.push(`_${meta.join(" · ")}_\n`);
      if (d.resume) lines.push(d.resume + "\n");

      const articleCount = (d.articles ?? []).length;
      const sectionCount = (d.sections ?? []).length;
      lines.push(`Structure : ${sectionCount} section(s), ${articleCount} article(s) racine.`);
      lines.push(`\nIdentifiant : \`${args.textId}\` · [Légifrance](https://www.legifrance.gouv.fr/loda/id/${args.textId}/)`);

      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );
}
