import type { Fond } from "./schemas.js";

/**
 * Construit le body SearchRequestDTO complet à partir d'inputs simples.
 * L'API Légifrance attend une structure profonde (champs > criteres) mais
 * pour 99% des cas un free-text "ALL champ + UN_DES_MOTS" suffit.
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
}

interface FiltreDTO {
  facette: string;
  valeurs?: string[];
  dates?: { start: string; end: string };
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
      return "DATE_DECISION";
    case "JORF":
      return "DATE_PUBLICATION";
    case "CIRC":
      return "DATE_SIGNATURE";
    default:
      return "DATE_SIGNATURE";
  }
}

/** Le sort par défaut dépend du fond. PERTINENCE marche partout sauf rares cas. */
function defaultSortForFond(fond: Fond): string {
  switch (fond) {
    case "JURI":
    case "JORF":
    case "CIRC":
      return "SIGNATURE_DATE_DESC";
    case "ALL":
      return "PERTINENCE";
    default:
      return "PERTINENCE";
  }
}

export function buildSearchRequest(input: BuildSearchInput): SearchRequestDTO {
  const filtres: FiltreDTO[] = [];

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
          typeChamp: "ALL",
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
