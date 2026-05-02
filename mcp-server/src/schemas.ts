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

/* ------------------------------------------------------------------ */
/*  Search                                                            */
/* ------------------------------------------------------------------ */

export const FOND_VALUES = [
  "ALL",
  "CODE_DATE",
  "CODE_ETAT",
  "LODA_DATE",
  "LODA_ETAT",
  "JORF",
  "JURI",
  "CETAT",
  "CIRC",
  "CONSTIT",
  "KALI",
  "ACCO",
  "JUFI",
  "CNIL",
] as const;
export type Fond = (typeof FOND_VALUES)[number];

export const SearchTitleSchema = z
  .object({
    title: z.string().optional(),
    id: z.string().optional(),
    cid: z.string().optional(),
    legalStatus: z.string().optional(),
    nature: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .passthrough();

export const SearchExtractSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    num: z.string().optional(),
    values: z.array(z.string()).optional(),
    legalStatus: z.string().optional(),
    dateVersion: z.string().optional(),
  })
  .passthrough();

export const SearchSectionSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    dateVersion: z.string().optional(),
    legalStatus: z.string().optional(),
    extracts: z.array(SearchExtractSchema).optional(),
  })
  .passthrough();

export const SearchResultSchema = z
  .object({
    titles: z.array(SearchTitleSchema).optional(),
    sections: z.array(SearchSectionSchema).optional(),
    nor: z.string().optional(),
    etat: z.string().optional(),
    nature: z.string().optional(),
    type: z.string().optional(),
    date: z.string().optional(),
    dateSignature: z.string().optional(),
    datePublication: z.string().optional(),
    num: z.string().optional(),
    reference: z.string().optional(),
    text: z.string().optional(),
  })
  .passthrough();

export const SearchResponseSchema = z
  .object({
    totalResultNumber: z.number().optional(),
    totalArticleResultNumber: z.number().optional(),
    results: z.array(SearchResultSchema).optional(),
    executionTime: z.number().optional(),
    typePagination: z.string().optional(),
  })
  .passthrough();

export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
