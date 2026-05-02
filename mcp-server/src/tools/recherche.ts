import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PisteHttpClient } from "../http.js";
import { FOND_VALUES, SearchResponseSchema } from "../schemas.js";
import { buildSearchRequest } from "../search-builder.js";
import { summarizeSearchResponse, formatSearchResultsAsMarkdown } from "../format.js";
import { log } from "../logger.js";

export function registerRecherche(server: McpServer, http: PisteHttpClient) {
  server.registerTool(
    "legifrance_recherche",
    {
      title: "Recherche unifiée Légifrance + BOFiP",
      description: [
        "Recherche dans les bases juridiques françaises via Légifrance. Le paramètre `fond` détermine le périmètre :",
        "- `CODE_DATE` (codes en vigueur), `CODE_ETAT` (codes par état)",
        "- `LODA_DATE` / `LODA_ETAT` (lois, décrets, ordonnances, arrêtés)",
        "- `JORF` (Journal officiel), `JURI` (jurisprudence judiciaire), `CETAT` (jurisprudence administrative)",
        "- `CIRC` (**circulaires & BOFiP** — doctrine fiscale)",
        "- `CONSTIT` (Conseil constitutionnel), `KALI` (conventions collectives), `ACCO` (accords d'entreprise)",
        "- `ALL` (tous fonds confondus)",
        "Retourne les résultats avec titre, identifiant, état (VIGUEUR/ABROGE…), date, extraits du texte, et lien Légifrance.",
      ].join("\n"),
      inputSchema: {
        query: z.string().min(1).describe("Termes à rechercher (mots-clés ou expression)."),
        fond: z.enum(FOND_VALUES).default("CODE_DATE").describe("Périmètre de recherche."),
        pageSize: z.number().int().min(1).max(50).default(10).describe("Nombre de résultats (max 50)."),
        pageNumber: z.number().int().min(1).default(1),
        typeRecherche: z
          .enum(["UN_DES_MOTS", "EXACTE", "TOUS_LES_MOTS_DANS_UN_CHAMP"])
          .default("UN_DES_MOTS")
          .describe("Mode de match — UN_DES_MOTS (OR), TOUS_LES_MOTS_DANS_UN_CHAMP (AND), EXACTE (expression)."),
        dateDebut: z.string().optional().describe("Date de début (yyyy-mm-dd) pour filtrer par date de signature/publication."),
        dateFin: z.string().optional().describe("Date de fin (yyyy-mm-dd)."),
        nature: z
          .array(z.string())
          .optional()
          .describe("Filtre nature (ex. ['LOI', 'ORDONNANCE', 'DECRET', 'ARRETE']). Surtout pour LODA/JORF."),
      },
    },
    async (args) => {
      const body = buildSearchRequest({
        query: args.query,
        fond: args.fond,
        pageNumber: args.pageNumber,
        pageSize: args.pageSize,
        typeRecherche: args.typeRecherche,
        dateDebut: args.dateDebut,
        dateFin: args.dateFin,
        nature: args.nature,
      });

      const raw = await http.post("/search", body);
      const parsed = SearchResponseSchema.safeParse(raw);
      if (!parsed.success) {
        log.warn("recherche: response shape unexpected", { issues: parsed.error.issues.slice(0, 5) });
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Réponse Légifrance inattendue. Détail : ${parsed.error.message.slice(0, 300)}`,
            },
          ],
        };
      }

      const { total, hits } = summarizeSearchResponse(parsed.data);
      return {
        content: [
          {
            type: "text",
            text: formatSearchResultsAsMarkdown(total, hits, args.fond, args.query),
          },
        ],
      };
    },
  );
}
