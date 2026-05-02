import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PisteHttpClient } from "../http.js";
import { GetArticleResponseSchema } from "../schemas.js";
import { summarizeArticle, formatArticleAsMarkdown } from "../format.js";
import { resolveLegitext, listKnownCodes } from "../codes-legitext.js";
import { log } from "../logger.js";

export function registerGetArticle(server: McpServer, http: PisteHttpClient) {
  server.registerTool(
    "legifrance_get_article",
    {
      title: "Article d'un code (Légifrance)",
      description: [
        "Récupère le texte intégral d'un article d'un code français (Code civil, Code pénal, CGI, etc.).",
        "Deux modes d'invocation :",
        "1. Par identifiant LEGIARTI : passer `articleId` (ex. `LEGIARTI000006417707`).",
        "2. Par code et numéro : passer `code` (nom usuel ex. `Code civil`, ou un LEGITEXT directement) + `num` (ex. `1240`).",
        `Codes connus : ${listKnownCodes().slice(0, 12).join(", ")}…`,
        "Retourne : numéro, texte, état (VIGUEUR/ABROGE/MODIFIE…), dates, lien Légifrance.",
      ].join("\n"),
      inputSchema: {
        articleId: z.string().optional().describe("Identifiant LEGIARTI… de l'article."),
        code: z.string().optional().describe("Nom usuel du code (ex. 'Code civil') ou identifiant LEGITEXT…"),
        num: z.string().optional().describe("Numéro de l'article (ex. '1240', 'L. 421-1')."),
      },
    },
    async (args) => {
      if (!args.articleId && !(args.code && args.num)) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Erreur : il faut fournir soit `articleId` (LEGIARTI…), soit le couple `code` + `num`.",
            },
          ],
        };
      }

      let raw: unknown;
      if (args.articleId) {
        raw = await http.post("/consult/getArticle", { id: args.articleId });
      } else {
        const legitext = resolveLegitext(args.code!);
        if (!legitext) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Code "${args.code}" non reconnu. Codes connus : ${listKnownCodes().join(", ")}. Vous pouvez aussi passer un identifiant LEGITEXT directement.`,
              },
            ],
          };
        }
        raw = await http.post("/consult/getArticleWithIdAndNum", { id: legitext, num: args.num });
      }

      const parsed = GetArticleResponseSchema.safeParse(raw);
      if (!parsed.success) {
        log.warn("get-article: response shape unexpected", { issues: parsed.error.issues.slice(0, 5) });
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

      const article = parsed.data.article;
      if (!article) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Article introuvable. Vérifiez l'identifiant ou le couple code/num (Légifrance/PISTE).",
            },
          ],
        };
      }

      const summary = summarizeArticle(article);
      return {
        content: [{ type: "text", text: formatArticleAsMarkdown(summary) }],
      };
    },
  );
}
