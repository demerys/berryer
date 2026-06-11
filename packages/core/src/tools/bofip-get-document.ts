import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BofipClient, odsqlString, normalizeBoiId } from "../bofip.js";
import { BofipRecordsResponseSchema, type BofipRecord } from "../schemas.js";
import { log } from "../logger.js";

const MAX_CONTENT_CHARS = 6000;

async function lookupById(bofip: BofipClient, dataset: string, id: string) {
  const raw = await bofip.records(dataset, {
    where: `identifiant_juridique=${odsqlString(id)}`,
    select: "titre,serie,division,identifiant_juridique,debut_de_validite,permalien,type,contenu",
    // L'historique peut contenir plusieurs versions du même identifiant —
    // on prend la plus récente.
    order_by: "debut_de_validite DESC",
    limit: "1",
  });
  return BofipRecordsResponseSchema.safeParse(raw);
}

function formatRecord(r: BofipRecord): string {
  const lines: string[] = [];
  lines.push(`# ${r.titre ?? "(sans titre)"}`);
  const meta: string[] = [];
  meta.push("**En vigueur**");
  if (r.debut_de_validite) meta.push(`Début de validité : ${r.debut_de_validite}`);
  if (r.serie) meta.push(`Série : ${r.serie}${r.division ? `-${r.division}` : ""}`);
  lines.push(`_${meta.join(" · ")}_\n`);

  if (r.contenu) {
    const text = r.contenu.replace(/\s+\n/g, "\n").trim();
    lines.push("## Texte");
    lines.push(
      text.length > MAX_CONTENT_CHARS
        ? text.slice(0, MAX_CONTENT_CHARS) + "\n…(tronqué — utilisez le permalien pour le texte intégral)"
        : text,
    );
    lines.push("");
  }
  lines.push(`Identifiant : \`${r.identifiant_juridique ?? "?"}\`${r.permalien ? ` · [BOFiP](${r.permalien})` : ""}`);
  return lines.join("\n");
}

export function registerBofipGetDocument(server: McpServer, bofip: BofipClient) {
  server.registerTool(
    "bofip_get_document",
    {
      title: "Fiche BOFiP (texte intégral)",
      description: [
        "Récupère le texte intégral d'une fiche BOFiP-Impôts (doctrine administrative fiscale) **en vigueur** par son identifiant `BOI-…` (ex. `BOI-IS-BASE-10-10-10-10`, `BOI-INT-CVB-ITA`, rescrits `BOI-RES-…` inclus), via l'open data DGFiP. Ne nécessite PAS de credentials PISTE.",
        "L'open data n'expose que la doctrine en vigueur : une fiche abrogée est signalée introuvable (à vérifier manuellement sur bofip.impots.gouv.fr).",
        "Retourne : titre, série, date de début de validité, texte intégral, permalien officiel bofip.impots.gouv.fr.",
        "Pour trouver l'identifiant d'une fiche : `bofip_recherche`.",
      ].join("\n"),
      inputSchema: {
        id: z
          .string()
          .regex(/^\s*BOI-/i, "L'identifiant doit commencer par BOI-")
          .describe("Identifiant de la fiche (`BOI-…`). Un suffixe de version `-YYYYMMDD` est toléré et ignoré."),
      },
    },
    async (args) => {
      const id = normalizeBoiId(args.id.toUpperCase());

      const vigueur = await lookupById(bofip, "bofip-vigueur", id);
      if (!vigueur.success) {
        log.warn("bofip-get-document: response shape unexpected", { issues: vigueur.error.issues.slice(0, 3) });
        return {
          isError: true,
          content: [{ type: "text", text: `Réponse open data BOFiP inattendue : ${vigueur.error.message.slice(0, 300)}` }],
        };
      }
      if (vigueur.data.results.length > 0) {
        return { content: [{ type: "text", text: formatRecord(vigueur.data.results[0]!) }] };
      }

      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Fiche BOFiP introuvable dans la doctrine EN VIGUEUR (id "${id}"). Soit l'identifiant est erroné/forgé, soit la fiche est abrogée (l'open data DGFiP n'expose pas l'historique par fiche — vérification manuelle sur bofip.impots.gouv.fr). Retrouvez la bonne fiche via bofip_recherche ; ne citez pas cette référence sans l'avoir retrouvée.`,
          },
        ],
      };
    },
  );
}
