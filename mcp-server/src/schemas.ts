import { z } from "zod";

/**
 * Schémas Zod pour les réponses Légifrance.
 *
 * Stratégie : on type uniquement les champs qu'on consomme dans `format.ts`.
 * `.passthrough()` est utilisé pour ne pas casser quand l'API ajoute/renomme
 * des champs (l'API Légifrance est mouvante). Un changement de structure
 * sera détecté par les tests fixtures (capturés via `scripts/capture-fixture.sh`).
 */

/**
 * Date issue de l'API Légifrance — soit un timestamp epoch en ms (number),
 * soit une chaîne ISO. La plupart des endpoints renvoient des numbers, mais
 * certains champs / certains fonds renvoient des strings.
 */
export const LegiDateSchema = z.union([z.number(), z.string()]).nullable().optional();

/** Sous-ensemble du schéma `Article` (Swagger Légifrance). */
export const ArticleSchema = z
  .object({
    id: z.string().nullable().optional(),
    cid: z.string().nullable().optional(),
    num: z.string().nullable().optional(),
    texte: z.string().nullable().optional(),
    texteHtml: z.string().nullable().optional(),
    nature: z.string().nullable().optional(),
    etat: z.string().nullable().optional(),
    dateDebut: LegiDateSchema,
    dateFin: LegiDateSchema,
    versionArticle: z.string().nullable().optional(),
    sectionParentTitre: z.string().nullable().optional(),
    idTexte: z.string().nullable().optional(),
    cidTexte: z.string().nullable().optional(),
    nota: z.string().nullable().optional(),
    notaHtml: z.string().nullable().optional(),
    /** Contexte hiérarchique (titresTM, titreTxt). Présent dans /consult/getArticle. */
    context: z
      .object({
        titreTxt: z
          .array(
            z
              .object({
                titre: z.string().nullable().optional(),
                cid: z.string().nullable().optional(),
                id: z.string().nullable().optional(),
              })
              .passthrough(),
          )
          .nullable()
          .optional(),
        titresTM: z
          .array(
            z
              .object({
                titre: z.string().nullable().optional(),
                cid: z.string().nullable().optional(),
                id: z.string().nullable().optional(),
              })
              .passthrough(),
          )
          .nullable()
          .optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
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
    title: z.string().nullable().optional(),
    id: z.string().nullable().optional(),
    cid: z.string().nullable().optional(),
    legalStatus: z.string().nullable().optional(),
    nature: z.string().nullable().optional(),
    startDate: LegiDateSchema,
    endDate: LegiDateSchema,
  })
  .passthrough();

export const SearchExtractSchema = z
  .object({
    id: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    num: z.string().nullable().optional(),
    values: z.array(z.string()).nullable().optional(),
    legalStatus: z.string().nullable().optional(),
    dateVersion: LegiDateSchema,
  })
  .passthrough();

export const SearchSectionSchema = z
  .object({
    id: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    dateVersion: LegiDateSchema,
    legalStatus: z.string().nullable().optional(),
    extracts: z.array(SearchExtractSchema).nullable().optional(),
  })
  .passthrough();

export const SearchResultSchema = z
  .object({
    titles: z.array(SearchTitleSchema).nullable().optional(),
    sections: z.array(SearchSectionSchema).nullable().optional(),
    nor: z.string().nullable().optional(),
    etat: z.string().nullable().optional(),
    nature: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    date: LegiDateSchema,
    dateSignature: LegiDateSchema,
    datePublication: LegiDateSchema,
    num: z.string().nullable().optional(),
    reference: z.string().nullable().optional(),
    text: z.string().nullable().optional(),
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
    id: z.string().nullable().optional(),
    cid: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    titreLong: z.string().nullable().optional(),
    nature: z.string().nullable().optional(),
    etat: z.string().nullable().optional(),
    dateDebut: LegiDateSchema,
    dateFin: LegiDateSchema,
    dateParution: LegiDateSchema,
    eli: z.string().nullable().optional(),
    nor: z.string().nullable().optional(),
    resume: z.string().nullable().optional(),
    articles: z.array(ConsultArticleStub).nullable().optional(),
    sections: z.array(ConsultSectionStub).nullable().optional(),
    executionTime: z.number().optional(),
  })
  .passthrough();

export type ConsultTextResponse = z.infer<typeof ConsultTextResponseSchema>;

/** Réponse /consult/jorf. */
export const ConsultJorfResponseSchema = z
  .object({
    id: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    textNumber: z.string().nullable().optional(),
    nature: z.string().nullable().optional(),
    dateTexte: LegiDateSchema,
    resume: z.string().nullable().optional(),
    notice: z.string().nullable().optional(),
    nor: z.string().nullable().optional(),
    articles: z.array(ConsultArticleStub).nullable().optional(),
    sections: z.array(ConsultSectionStub).nullable().optional(),
  })
  .passthrough();

export type ConsultJorfResponse = z.infer<typeof ConsultJorfResponseSchema>;

/** Sous-schéma /consult/juri (texte d'une décision judiciaire). */
const TexteSimpleSchema = z
  .object({
    id: z.string().nullable().optional(),
    cid: z.string().nullable().optional(),
    titre: z.string().nullable().optional(),
    titreLong: z.string().nullable().optional(),
    nature: z.string().nullable().optional(),
    etat: z.string().nullable().optional(),
    dateTexte: LegiDateSchema,
    dateDebut: LegiDateSchema,
    texteHtml: z.string().nullable().optional(),
    visas: z.string().nullable().optional(),
    notice: z.string().nullable().optional(),
    juridiction: z.string().nullable().optional(),
    formation: z.string().nullable().optional(),
    numero: z.string().nullable().optional(),
    solution: z.string().nullable().optional(),
    sommaire: z.string().nullable().optional(),
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
    id: z.string().nullable().optional(),
    titre: z.string().nullable().optional(),
    nor: z.string().nullable().optional(),
    etat: z.string().nullable().optional(),
    dateOpposabilite: LegiDateSchema,
    dateSignature: LegiDateSchema,
    dateTexte: LegiDateSchema,
    resume: z.string().nullable().optional(),
    motsCles: z.array(z.string()).nullable().optional(),
    ministeresDeposants: z.array(z.string()).nullable().optional(),
    texteHtml: z.string().nullable().optional(),
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
    id: z.string().nullable().optional(),
    label: z.string().nullable().optional(),
    nature: z.string().nullable().optional(),
    origin: z.string().nullable().optional(),
    dateVersion: LegiDateSchema,
    appellations: z.array(z.string()).nullable().optional(),
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
