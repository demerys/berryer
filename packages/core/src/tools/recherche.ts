import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PisteHttpClient } from "../http.js";
import { FOND_VALUES, SearchResponseSchema } from "../schemas.js";
import { buildSearchRequest, SearchInputError } from "../search-builder.js";
import { summarizeSearchResponse, formatSearchResultsAsMarkdown } from "../format.js";
import { resolveLegitext } from "../codes-legitext.js";
import { log } from "../logger.js";

export function registerRecherche(server: McpServer, http: PisteHttpClient) {
  server.registerTool(
    "legifrance_recherche",
    {
      title: "Recherche unifiée Légifrance + BOFiP",
      description: [
        "Recherche dans les bases juridiques françaises via Légifrance. Le paramètre `fond` détermine le périmètre :",
        "- `CODE_DATE` (codes en vigueur à une date), `CODE_ETAT` (codes par état) — *requièrent le paramètre* `code` (ex. `Code civil`)",
        "- `LODA_DATE` / `LODA_ETAT` (lois, décrets, ordonnances, arrêtés)",
        "- `JORF` (Journal officiel), `JURI` (jurisprudence judiciaire), `CETAT` (jurisprudence administrative)",
        "- `CIRC` (**circulaires & BOFiP** — doctrine fiscale)",
        "- `CONSTIT` (Conseil constitutionnel), `KALI` (conventions collectives), `ACCO` (accords d'entreprise)",
        "- `ALL` (tous fonds confondus — pratique pour une recherche large)",
        "Retourne les résultats avec titre, identifiant, état (VIGUEUR/ABROGE…), date, extraits du texte, et lien Légifrance.",
      ].join("\n"),
      inputSchema: {
        query: z.string().min(1).describe("Termes à rechercher (mots-clés ou expression)."),
        fond: z.enum(FOND_VALUES).default("ALL").describe("Périmètre de recherche."),
        code: z
          .string()
          .optional()
          .describe(
            "Nom du code (ex. 'Code civil') — *obligatoire* pour fond=CODE_DATE ou CODE_ETAT. Ignoré pour les autres fonds.",
          ),
        dateVersion: z
          .string()
          .optional()
          .describe("Date de version (yyyy-mm-dd) pour fond=CODE_DATE. Par défaut : aujourd'hui."),
        pageSize: z.number().int().min(1).max(50).default(10).describe("Nombre de résultats (max 50)."),
        pageNumber: z.number().int().min(1).default(1),
        typeRecherche: z
          .enum(["UN_DES_MOTS", "EXACTE", "TOUS_LES_MOTS_DANS_UN_CHAMP"])
          .default("UN_DES_MOTS")
          .describe("Mode de match — UN_DES_MOTS (OR), TOUS_LES_MOTS_DANS_UN_CHAMP (AND), EXACTE (expression)."),
        dateDebut: z.string().optional().describe("Date de début (yyyy-mm-dd) pour filtrer par date de signature/publication/décision."),
        dateFin: z.string().optional().describe("Date de fin (yyyy-mm-dd)."),
        nature: z
          .array(z.string())
          .optional()
          .describe("Filtre nature (ex. ['LOI', 'ORDONNANCE', 'DECRET', 'ARRETE']). Surtout pour LODA/JORF."),
      },
    },
    async (args) => {
      // Si le user passe un LEGITEXT comme `code`, on le résout en nom canonique
      // (les fonds CODE_* attendent le nom littéral, pas l'identifiant).
      let resolvedCode = args.code;
      if (resolvedCode && /^LEGITEXT\d+$/i.test(resolvedCode.trim())) {
        // Reverse lookup : on cherche le nom usuel correspondant.
        // Si on n'a pas de match, on laisse passer tel quel (l'API rejettera proprement).
        const upper = resolvedCode.trim().toUpperCase();
        for (const [name, id] of Object.entries(
          (await import("../codes-legitext.js")).COMMON_CODES_LEGITEXT,
        )) {
          if (id === upper) {
            // Capitaliser la première lettre pour l'affichage
            resolvedCode = name.charAt(0).toUpperCase() + name.slice(1);
            break;
          }
        }
      }
      // No-op statement pour éviter le warning unused-variable sur l'import.
      void resolveLegitext;

      let body: ReturnType<typeof buildSearchRequest>;
      try {
        body = buildSearchRequest({
          query: args.query,
          fond: args.fond,
          pageNumber: args.pageNumber,
          pageSize: args.pageSize,
          typeRecherche: args.typeRecherche,
          dateDebut: args.dateDebut,
          dateFin: args.dateFin,
          nature: args.nature,
          code: resolvedCode,
          dateVersion: args.dateVersion,
        });
      } catch (err) {
        if (err instanceof SearchInputError) {
          return {
            isError: true,
            content: [{ type: "text", text: err.message }],
          };
        }
        throw err;
      }

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
