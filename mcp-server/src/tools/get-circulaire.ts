import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PisteHttpClient } from "../http.js";
import { ConsultCirculaireResponseSchema } from "../schemas.js";
import { normalizeLegiDate } from "../format.js";
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
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function registerGetCirculaire(server: McpServer, http: PisteHttpClient) {
  server.registerTool(
    "legifrance_get_circulaire",
    {
      title: "Circulaire ou fiche BOFiP",
      description:
        "Récupère une circulaire administrative ou une fiche BOFiP (doctrine fiscale) par son identifiant. Pour les BOFiP, utilisez l'identifiant `BOI-…` (ex. `BOI-IS-BASE-30-30-20-20`). Retourne titre, ministère, état, dates, mots-clés, et le texte intégral.",
      inputSchema: {
        id: z
          .string()
          .describe("Identifiant de la circulaire (numéro) ou de la fiche BOFiP (`BOI-…`)."),
      },
    },
    async (args) => {
      const raw = await http.post("/consult/circulaire", { id: args.id });
      const parsed = ConsultCirculaireResponseSchema.safeParse(raw);
      if (!parsed.success) {
        log.warn("get-circulaire: response shape unexpected", { issues: parsed.error.issues.slice(0, 3) });
        return {
          isError: true,
          content: [{ type: "text", text: `Réponse Légifrance inattendue : ${parsed.error.message.slice(0, 300)}` }],
        };
      }
      const c = parsed.data.circulaire;
      if (!c) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Document introuvable (id "${args.id}"). Pour un BOFiP, vérifiez le format BOI-… (Légifrance/PISTE).`,
            },
          ],
        };
      }
      const lines: string[] = [];
      lines.push(`# ${c.titre ?? "(sans titre)"}`);
      const meta: string[] = [];
      if (c.etat) meta.push(`État : ${c.etat}`);
      const dateOpp = normalizeLegiDate(c.dateOpposabilite);
      const dateSign = normalizeLegiDate(c.dateSignature);
      if (dateOpp) meta.push(`Opposable depuis ${dateOpp}`);
      if (dateSign) meta.push(`Signée le ${dateSign}`);
      if (c.nor) meta.push(`NOR : ${c.nor}`);
      if (c.ministeresDeposants && c.ministeresDeposants.length) {
        meta.push(`Ministère(s) : ${c.ministeresDeposants.join(", ")}`);
      }
      if (meta.length) lines.push(`_${meta.join(" · ")}_\n`);

      if (c.motsCles && c.motsCles.length) {
        lines.push(`**Mots-clés :** ${c.motsCles.join(", ")}\n`);
      }
      if (c.resume) lines.push("## Résumé\n" + c.resume + "\n");
      if (c.texteHtml) {
        const text = htmlToText(c.texteHtml);
        lines.push("## Texte");
        lines.push(text.length > 6000 ? text.slice(0, 6000) + "\n…(tronqué — utilisez le lien Légifrance pour le texte intégral)" : text);
        lines.push("");
      }
      lines.push(`Identifiant : \`${args.id}\` · [Légifrance](https://www.legifrance.gouv.fr/circulaire/id/${args.id})`);

      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );
}
