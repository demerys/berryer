import type { Fond } from "./schemas.js";

/**
 * Construit le body SearchRequestDTO complet à partir d'inputs simples.
 * L'API Légifrance attend une structure profonde (champs > criteres) mais
 * pour 99% des cas un free-text "ALL champ + UN_DES_MOTS" suffit.
 *
 * Cas particulier : CODE_DATE et CODE_ETAT *exigent* un filtre NOM_CODE
 * (CODE_DATE) ou TEXT_NOM_CODE (CODE_ETAT) ciblant un code précis.
 * CODE_DATE exige en plus un filtre DATE_VERSION.
 */
export interface BuildSearchInput {
  query: string;
  fond: Fond;
  pageNumber?: number;
  pageSize?: number;
  /** Type de recherche par défaut (UN_DES_MOTS = OR sur les mots). */
  typeRecherche?: "UN_DES_MOTS" | "EXACTE" | "TOUS_LES_MOTS_DANS_UN_CHAMP";
  /** Filtre date début (yyyy-mm-dd). */
  dateDebut?: string;
  /** Filtre date fin (yyyy-mm-dd). */
  dateFin?: string;
  /** Filtre nature (LOI, ORDONNANCE, DECRET, ARRETE…). Spécifique à LODA/JORF. */
  nature?: string[];
  /** Sort key (ex. PERTINENCE, SIGNATURE_DATE_DESC). */
  sort?: string;
  /** Nom du code (obligatoire pour CODE_DATE/CODE_ETAT). Ex. "Code civil". */
  code?: string;
  /** Date de version pour CODE_DATE (yyyy-mm-dd). Par défaut : aujourd'hui. */
  dateVersion?: string;
}

/** Erreur levée si l'input est incompatible avec le fond demandé. */
export class SearchInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SearchInputError";
  }
}

interface FiltreDTO {
  facette: string;
  valeurs?: string[];
  dates?: { start: string; end: string };
  singleDate?: string;
}

interface CritereDTO {
  valeur: string;
  operateur: "ET" | "OU";
  typeRecherche: string;
}

interface ChampDTO {
  typeChamp: string;
  operateur: "ET" | "OU";
  criteres: CritereDTO[];
}

interface SearchRequestDTO {
  fond: Fond;
  recherche: {
    champs: ChampDTO[];
    operateur: "ET" | "OU";
    filtres?: FiltreDTO[];
    pageNumber: number;
    pageSize: number;
    sort: string;
    typePagination: "DEFAUT" | "ARTICLE";
  };
}

/** La facette qui porte les dates dépend du fond. */
function dateFacetForFond(fond: Fond): string {
  switch (fond) {
    case "JURI":
    case "CETAT":
    case "CONSTIT":
      return "DATE_DECISION";
    case "JORF":
      return "DATE_PUBLICATION";
    case "CIRC":
      return "DATE_SIGNATURE";
    default:
      return "DATE_SIGNATURE";
  }
}

/** Le sort par défaut dépend du fond. */
function defaultSortForFond(fond: Fond): string {
  switch (fond) {
    case "JORF":
      return "PUBLICATION_DATE_DESC";
    case "JURI":
    case "CETAT":
    case "LODA_DATE":
    case "LODA_ETAT":
    case "CIRC":
      return "SIGNATURE_DATE_DESC";
    default:
      return "PERTINENCE";
  }
}

/** typeChamp par défaut : ARTICLE pour les fonds CODE (recommandé par DILA), ALL ailleurs. */
function defaultTypeChampForFond(fond: Fond): string {
  switch (fond) {
    case "CODE_DATE":
    case "CODE_ETAT":
      return "ARTICLE";
    default:
      return "ALL";
  }
}

export function buildSearchRequest(input: BuildSearchInput): SearchRequestDTO {
  const filtres: FiltreDTO[] = [];

  // Cas particulier : les fonds CODE_* exigent un filtre nom-de-code.
  if (input.fond === "CODE_DATE" || input.fond === "CODE_ETAT") {
    if (!input.code) {
      throw new SearchInputError(
        `Le fond ${input.fond} exige un nom de code (paramètre 'code', ex. "Code civil"). Pour une recherche cross-codes, utilisez fond="ALL".`,
      );
    }
    filtres.push({
      facette: input.fond === "CODE_DATE" ? "NOM_CODE" : "TEXT_NOM_CODE",
      valeurs: [input.code],
    });
    if (input.fond === "CODE_DATE") {
      filtres.push({
        facette: "DATE_VERSION",
        singleDate: input.dateVersion ?? new Date().toISOString().slice(0, 10),
      });
    }
  }

  if (input.dateDebut || input.dateFin) {
    filtres.push({
      facette: dateFacetForFond(input.fond),
      dates: {
        start: input.dateDebut ?? "1789-01-01",
        end: input.dateFin ?? "2999-12-31",
      },
    });
  }

  if (input.nature && input.nature.length > 0) {
    filtres.push({
      facette: "NATURE",
      valeurs: input.nature,
    });
  }

  return {
    fond: input.fond,
    recherche: {
      champs: [
        {
          typeChamp: defaultTypeChampForFond(input.fond),
          operateur: "ET",
          criteres: [
            {
              valeur: input.query,
              operateur: "ET",
              typeRecherche: input.typeRecherche ?? "UN_DES_MOTS",
            },
          ],
        },
      ],
      operateur: "ET",
      filtres: filtres.length > 0 ? filtres : undefined,
      pageNumber: input.pageNumber ?? 1,
      pageSize: input.pageSize ?? 10,
      sort: input.sort ?? defaultSortForFond(input.fond),
      typePagination: "DEFAUT",
    },
  };
}
