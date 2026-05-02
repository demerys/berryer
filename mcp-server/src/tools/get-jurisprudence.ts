import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PisteHttpClient } from "../http.js";
import { ConsultJuriResponseSchema } from "../schemas.js";
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
      const dateTexte = normalizeLegiDate(t.dateTexte);
      if (dateTexte) meta.push(dateTexte);
      const numeroAffaire = Array.isArray(t.numeroAffaire)
        ? t.numeroAffaire.join(", ")
        : t.numeroAffaire;
      const numero = t.numero ?? numeroAffaire;
      if (numero) meta.push(`n° ${numero}`);
      if (t.solution) meta.push(t.solution);
      if (t.publicationRecueil) meta.push(t.publicationRecueil);
      if (meta.length) lines.push(`_${meta.join(" · ")}_\n`);

      // Sommaire : peut être string OU array d'objets {abstrats, resumePrincipal, autreResume}
      if (t.sommaire) {
        lines.push("## Sommaire");
        if (typeof t.sommaire === "string") {
          lines.push(htmlToText(t.sommaire));
          lines.push("");
        } else if (Array.isArray(t.sommaire)) {
          for (const item of t.sommaire) {
            if (item.abstrats) {
              lines.push(`> ${htmlToText(item.abstrats)}`);
              lines.push("");
            }
            if (item.resumePrincipal) {
              lines.push(`**Titre principal :** ${htmlToText(item.resumePrincipal)}`);
            }
            if (item.autreResume) {
              lines.push(`**Autre titre :** ${htmlToText(item.autreResume)}`);
            }
            lines.push("");
          }
        }
      }
      if (t.texteHtml) {
        const txt = htmlToText(t.texteHtml);
        lines.push("## Texte");
        lines.push(txt.length > 4000 ? txt.slice(0, 4000) + "\n…(tronqué)" : txt);
        lines.push("");
      }
      if (t.ecli) lines.push(`ECLI : \`${t.ecli}\``);
      lines.push(`Identifiant : \`${args.textId}\` · [Légifrance](https://www.legifrance.gouv.fr/juri/id/${args.textId})`);

      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );
}
