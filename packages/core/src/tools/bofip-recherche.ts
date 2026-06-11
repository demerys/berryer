import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BofipClient, odsqlString } from "../bofip.js";
import { BofipRecordsResponseSchema } from "../schemas.js";
import { log } from "../logger.js";

const SERIES = [
  "IR", "IS", "BIC", "BNC", "BA", "TVA", "RPPM", "RFPI", "RSA", "ENR",
  "PAT", "IF", "CF", "CTX", "INT", "ANNX", "SJ", "REC", "TFP", "DJC", "TCA",
] as const;

export function registerBofipRecherche(server: McpServer, bofip: BofipClient) {
  server.registerTool(
    "bofip_recherche",
    {
      title: "Recherche dans le BOFiP (doctrine fiscale en vigueur)",
      description: [
        "Recherche plein texte dans le BOFiP-Impôts (Bulletin officiel des finances publiques — doctrine administrative fiscale) **en vigueur**, via l'open data DGFiP (data.economie.gouv.fr). Ne nécessite PAS de credentials PISTE.",
        "Retourne pour chaque fiche : identifiant BOI-…, titre, série/division, date de début de validité, permalien officiel.",
        "Filtre optionnel `serie` (ex. `IS`, `TVA`, `INT` pour l'international, `CF` pour le contrôle fiscal, `ENR` pour l'enregistrement).",
        "Pour le texte intégral d'une fiche identifiée, utilisez ensuite `bofip_get_document`.",
      ].join("\n"),
      inputSchema: {
        query: z.string().min(2).describe("Termes de recherche (ex. 'régime des sociétés mères', 'convention fiscale Italie', 'autoliquidation TVA')."),
        serie: z
          .string()
          .optional()
          .describe(`Série BOFiP pour restreindre (ex. ${SERIES.slice(0, 8).join(", ")}…).`),
        limit: z.number().int().min(1).max(20).optional().describe("Nombre de résultats (défaut 10, max 20)."),
      },
    },
    async (args) => {
      const whereParts = [`search(${odsqlString(args.query)})`];
      if (args.serie) whereParts.push(`serie=${odsqlString(args.serie.toUpperCase())}`);

      const raw = await bofip.records("bofip-vigueur", {
        where: whereParts.join(" AND "),
        select: "titre,serie,division,identifiant_juridique,debut_de_validite,permalien,type",
        limit: String(args.limit ?? 10),
      });
      const parsed = BofipRecordsResponseSchema.safeParse(raw);
      if (!parsed.success) {
        log.warn("bofip-recherche: response shape unexpected", { issues: parsed.error.issues.slice(0, 3) });
        return {
          isError: true,
          content: [{ type: "text", text: `Réponse open data BOFiP inattendue : ${parsed.error.message.slice(0, 300)}` }],
        };
      }

      const { total_count, results } = parsed.data;
      if (total_count === 0 || results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `Aucune fiche BOFiP en vigueur ne correspond à "${args.query}"${args.serie ? ` (série ${args.serie})` : ""}. Essayez des termes plus larges ou sans filtre de série.`,
            },
          ],
        };
      }

      const lines: string[] = [];
      lines.push(`**${total_count} fiche(s) BOFiP en vigueur** pour "${args.query}"${args.serie ? ` (série ${args.serie})` : ""} (top ${results.length}) :`);
      lines.push("");
      results.forEach((r, i) => {
        lines.push(`${i + 1}. **${r.titre ?? "(sans titre)"}**`);
        lines.push(`   \`${r.identifiant_juridique ?? "?"}\` · en vigueur depuis ${r.debut_de_validite ?? "?"}${r.type && r.type !== "Contenu" ? ` · ${r.type}` : ""}`);
        if (r.permalien) lines.push(`   [BOFiP](${r.permalien})`);
        lines.push("");
      });
      lines.push("_Texte intégral d'une fiche : `bofip_get_document` avec l'identifiant BOI-…_");

      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );
}
