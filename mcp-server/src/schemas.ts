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

/* ------------------------------------------------------------------ */
/*  Consult — tolérant (passthrough) pour absorber la richesse des    */
/*  réponses Légifrance sans tout typer.                              */
/* ------------------------------------------------------------------ */

const ConsultArticleStub = z
  .object({
    id: z.string().optional(),
    cid: z.string().optional(),
    num: z.string().optional(),
    intOrdre: z.number().optional(),
  })
  .passthrough();

const ConsultSectionStub: z.ZodType<{ id?: string; title?: string }> = z.lazy(() =>
  z
    .object({
      id: z.string().optional(),
      cid: z.string().optional(),
      title: z.string().optional(),
      etat: z.string().optional(),
      articles: z.array(ConsultArticleStub).optional(),
      sections: z.array(ConsultSectionStub).optional(),
    })
    .passthrough(),
);

/** Réponse /consult/code et /consult/lawDecree (LODA). */
export const ConsultTextResponseSchema = z
  .object({
    id: z.string().optional(),
    cid: z.string().optional(),
    title: z.string().optional(),
    titreLong: z.string().optional(),
    nature: z.string().optional(),
    etat: z.string().optional(),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
    dateParution: z.string().optional(),
    eli: z.string().optional(),
    nor: z.string().optional(),
    resume: z.string().optional(),
    articles: z.array(ConsultArticleStub).optional(),
    sections: z.array(ConsultSectionStub).optional(),
    executionTime: z.number().optional(),
  })
  .passthrough();

export type ConsultTextResponse = z.infer<typeof ConsultTextResponseSchema>;

/** Réponse /consult/jorf. */
export const ConsultJorfResponseSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    textNumber: z.string().optional(),
    nature: z.string().optional(),
    dateTexte: z.string().optional(),
    resume: z.string().optional(),
    notice: z.string().optional(),
    nor: z.string().optional(),
    articles: z.array(ConsultArticleStub).optional(),
    sections: z.array(ConsultSectionStub).optional(),
  })
  .passthrough();

export type ConsultJorfResponse = z.infer<typeof ConsultJorfResponseSchema>;

/** Sous-schéma /consult/juri (texte d'une décision judiciaire). */
const TexteSimpleSchema = z
  .object({
    id: z.string().optional(),
    cid: z.string().optional(),
    titre: z.string().optional(),
    titreLong: z.string().optional(),
    nature: z.string().optional(),
    etat: z.string().optional(),
    dateTexte: z.string().optional(),
    dateDebut: z.string().optional(),
    texteHtml: z.string().optional(),
    visas: z.string().optional(),
    notice: z.string().optional(),
    juridiction: z.string().optional(),
    formation: z.string().optional(),
    numero: z.string().optional(),
    solution: z.string().optional(),
    sommaire: z.string().optional(),
  })
  .passthrough();

export const ConsultJuriResponseSchema = z
  .object({
    text: TexteSimpleSchema.nullable().optional(),
    executionTime: z.number().optional(),
    dereferenced: z.boolean().optional(),
  })
  .passthrough();

export type ConsultJuriResponse = z.infer<typeof ConsultJuriResponseSchema>;

/** Sous-schéma /consult/circulaire (BOFiP). */
const CirculaireSchema = z
  .object({
    id: z.string().optional(),
    titre: z.string().optional(),
    nor: z.string().optional(),
    etat: z.string().optional(),
    dateOpposabilite: z.string().optional(),
    dateSignature: z.string().optional(),
    dateTexte: z.string().optional(),
    resume: z.string().optional(),
    motsCles: z.array(z.string()).optional(),
    ministeresDeposants: z.array(z.string()).optional(),
    texteHtml: z.string().optional(),
  })
  .passthrough();

export const ConsultCirculaireResponseSchema = z
  .object({
    circulaire: CirculaireSchema.nullable().optional(),
    executionTime: z.number().optional(),
    dereferenced: z.boolean().optional(),
  })
  .passthrough();

export type ConsultCirculaireResponse = z.infer<typeof ConsultCirculaireResponseSchema>;

/* ------------------------------------------------------------------ */
/*  Suggest                                                           */
/* ------------------------------------------------------------------ */

export const SUGGEST_SUPPLIES = [
  "ALL",
  "ALL_SUGGEST",
  "LODA_LIST",
  "CODE_LIST",
  "CODE_RELEASE_DATE",
  "JURI",
  "CETAT",
  "JORF",
  "CIRC",
  "ACCO",
  "KALI",
  "CONSTIT",
  "CNIL",
  "ARTICLE",
] as const;

export const SuggestValueSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().optional(),
    nature: z.string().optional(),
    origin: z.string().optional(),
    dateVersion: z.string().optional(),
    appellations: z.array(z.string()).optional(),
  })
  .passthrough();

export const SuggestResponseSchema = z
  .object({
    totalResultNumber: z.number().optional(),
    executionTime: z.number().optional(),
    /** results: { [supply]: { [id]: SuggestValue } } — Map of Map. */
    results: z.record(z.string(), z.record(z.string(), SuggestValueSchema)).optional(),
  })
  .passthrough();

export type SuggestResponse = z.infer<typeof SuggestResponseSchema>;
