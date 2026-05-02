import { z } from "zod";

/**
 * Schémas Zod pour les réponses Légifrance.
 *
 * Stratégie : on type uniquement les champs qu'on consomme dans `format.ts`.
 * `.passthrough()` est utilisé pour ne pas casser quand l'API ajoute/renomme
 * des champs (l'API Légifrance est mouvante). Un changement de structure
 * sera détecté par les tests fixtures (capturés via `scripts/capture-fixture.sh`).
 */

/** Sous-ensemble du schéma `Article` (Swagger Légifrance). */
export const ArticleSchema = z
  .object({
    id: z.string().optional(),
    cid: z.string().optional(),
    num: z.string().optional(),
    texte: z.string().optional(),
    texteHtml: z.string().optional(),
    nature: z.string().optional(),
    etat: z.string().optional(),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
    versionArticle: z.string().optional(),
    sectionParentTitre: z.string().optional(),
    idTexte: z.string().optional(),
    cidTexte: z.string().optional(),
    nota: z.string().optional(),
    notaHtml: z.string().optional(),
  })
  .passthrough();

export type Article = z.infer<typeof ArticleSchema>;

export const GetArticleResponseSchema = z
  .object({
    article: ArticleSchema.nullable().optional(),
    executionTime: z.number().optional(),
    dereferenced: z.boolean().optional(),
  })
  .passthrough();

export type GetArticleResponse = z.infer<typeof GetArticleResponseSchema>;
