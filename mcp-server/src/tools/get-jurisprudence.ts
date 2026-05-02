import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PisteHttpClient } from "../http.js";
import { ConsultJuriResponseSchema } from "../schemas.js";
import { log } from "../logger.js";

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function registerGetJurisprudence(server: McpServer, http: PisteHttpClient) {
  server.registerTool(
    "legifrance_get_jurisprudence",
    {
      title: "Décision de jurisprudence (Cass, CE, CA…)",
      description:
        "Récupère le texte intégral d'une décision de jurisprudence par son identifiant JURITEXT (Cour de cassation, cours d'appel, tribunaux). Retourne juridiction, formation, date, numéro, sommaire, attendus et dispositif.",
      inputSchema: {
        textId: z.string().describe("Identifiant JURITEXT de la décision."),
      },
    },
    async (args) => {
      const raw = await http.post("/consult/juri", { textId: args.textId });
      const parsed = ConsultJuriResponseSchema.safeParse(raw);
      if (!parsed.success) {
        log.warn("get-juri: response shape unexpected", { issues: parsed.error.issues.slice(0, 3) });
        return {
          isError: true,
          content: [{ type: "text", text: `Réponse Légifrance inattendue : ${parsed.error.message.slice(0, 300)}` }],
        };
      }
      const t = parsed.data.text;
      if (!t) {
        return {
          isError: true,
          content: [{ type: "text", text: "Décision introuvable (Légifrance/PISTE)." }],
        };
      }
      const lines: string[] = [];
      lines.push(`# ${t.titre ?? t.titreLong ?? "(décision sans titre)"}`);
      const meta: string[] = [];
      if (t.juridiction) meta.push(t.juridiction);
      if (t.formation) meta.push(t.formation);
      if (t.dateTexte) meta.push(t.dateTexte.slice(0, 10));
      if (t.numero) meta.push(`n° ${t.numero}`);
      if (t.solution) meta.push(t.solution);
      if (meta.length) lines.push(`_${meta.join(" · ")}_\n`);
      if (t.sommaire) {
        lines.push("## Sommaire");
        lines.push(htmlToText(t.sommaire));
        lines.push("");
      }
      if (t.texteHtml) {
        const txt = htmlToText(t.texteHtml);
        lines.push("## Texte");
        lines.push(txt.length > 4000 ? txt.slice(0, 4000) + "\n…(tronqué)" : txt);
        lines.push("");
      }
      lines.push(`Identifiant : \`${args.textId}\` · [Légifrance](https://www.legifrance.gouv.fr/juri/id/${args.textId})`);

      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );
}
