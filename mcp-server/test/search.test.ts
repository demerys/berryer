import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SearchResponseSchema } from "../src/schemas.js";
import { summarizeSearchResponse, formatSearchResultsAsMarkdown } from "../src/format.js";
import { buildSearchRequest } from "../src/search-builder.js";

const fixtureDir = resolve(__dirname, "fixtures");
const load = (name: string) =>
  JSON.parse(readFileSync(resolve(fixtureDir, `${name}.json`), "utf-8"));

describe("search-builder — construction du SearchRequestDTO", () => {
  it("requête ALL simple sans filtres", () => {
    const body = buildSearchRequest({ query: "responsabilité", fond: "ALL" });
    expect(body.fond).toBe("ALL");
    expect(body.recherche.champs[0]!.typeChamp).toBe("ALL");
    expect(body.recherche.champs[0]!.criteres[0]!.valeur).toBe("responsabilité");
    expect(body.recherche.champs[0]!.criteres[0]!.typeRecherche).toBe("UN_DES_MOTS");
    expect(body.recherche.pageSize).toBe(10);
    expect(body.recherche.pageNumber).toBe(1);
    expect(body.recherche.filtres).toBeUndefined();
    expect(body.recherche.sort).toBe("PERTINENCE");
  });

  it("CODE_DATE injecte NOM_CODE + DATE_VERSION (singleDate par défaut aujourd'hui)", () => {
    const body = buildSearchRequest({
      query: "responsabilité",
      fond: "CODE_DATE",
      code: "Code civil",
    });
    expect(body.recherche.champs[0]!.typeChamp).toBe("ARTICLE");
    expect(body.recherche.filtres).toHaveLength(2);
    expect(body.recherche.filtres![0]).toEqual({ facette: "NOM_CODE", valeurs: ["Code civil"] });
    expect(body.recherche.filtres![1]!.facette).toBe("DATE_VERSION");
    expect(body.recherche.filtres![1]!.singleDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("CODE_ETAT injecte TEXT_NOM_CODE (pas DATE_VERSION)", () => {
    const body = buildSearchRequest({
      query: "outrage",
      fond: "CODE_ETAT",
      code: "Code pénal",
    });
    expect(body.recherche.filtres).toEqual([{ facette: "TEXT_NOM_CODE", valeurs: ["Code pénal"] }]);
  });

  it("CODE_DATE sans `code` lève SearchInputError", () => {
    expect(() =>
      buildSearchRequest({ query: "x", fond: "CODE_DATE" }),
    ).toThrowError(/exige un nom de code/);
  });

  it("ajoute un filtre date sur la facette appropriée selon le fond", () => {
    const juriBody = buildSearchRequest({
      query: "préjudice",
      fond: "JURI",
      dateDebut: "2023-01-01",
      dateFin: "2023-12-31",
    });
    expect(juriBody.recherche.filtres).toEqual([
      { facette: "DATE_DECISION", dates: { start: "2023-01-01", end: "2023-12-31" } },
    ]);
    expect(juriBody.recherche.sort).toBe("SIGNATURE_DATE_DESC");

    const jorfBody = buildSearchRequest({ query: "x", fond: "JORF", dateDebut: "2025-01-01" });
    expect(jorfBody.recherche.filtres![0]!.facette).toBe("DATE_PUBLICATION");
    expect(jorfBody.recherche.sort).toBe("PUBLICATION_DATE_DESC");
  });

  it("ajoute un filtre nature", () => {
    const body = buildSearchRequest({
      query: "x",
      fond: "LODA_DATE",
      nature: ["LOI", "ORDONNANCE"],
    });
    expect(body.recherche.filtres).toEqual([{ facette: "NATURE", valeurs: ["LOI", "ORDONNANCE"] }]);
    expect(body.recherche.sort).toBe("SIGNATURE_DATE_DESC");
  });
});

describe("format — Search response mapper", () => {
  it("mapper sur fixture CODE", () => {
    const raw = load("search-code-synthetic");
    const parsed = SearchResponseSchema.parse(raw);
    const { total, hits } = summarizeSearchResponse(parsed);
    expect(total).toBe(137);
    expect(hits).toHaveLength(1);
    expect(hits[0]!.titre).toBe("Code civil");
    expect(hits[0]!.id).toBe("LEGITEXT000006070721");
    expect(hits[0]!.etat).toBe("VIGUEUR");
    expect(hits[0]!.extraits).toHaveLength(2);
    expect(hits[0]!.extraits[0]!).toContain("Tout fait quelconque");
    expect(hits[0]!.lien).toBe("https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006070721/");
  });

  it("mapper sur fixture CIRC (BOFiP)", () => {
    const raw = load("search-circ-synthetic");
    const parsed = SearchResponseSchema.parse(raw);
    const { total, hits } = summarizeSearchResponse(parsed);
    expect(total).toBe(18);
    expect(hits[0]!.id).toBe("BOI-BNC-DECLA-10");
    expect(hits[0]!.titre).toContain("micro-BNC");
    expect(hits[0]!.lien).toBe("https://www.legifrance.gouv.fr/circulaire/id/BOI-BNC-DECLA-10");
    expect(hits[0]!.extraits[0]!).toContain("micro-BNC");
  });

  it("rend Markdown lisible (en-tête, extraits, lien)", () => {
    const raw = load("search-code-synthetic");
    const parsed = SearchResponseSchema.parse(raw);
    const { total, hits } = summarizeSearchResponse(parsed);
    const md = formatSearchResultsAsMarkdown(total, hits, "CODE_DATE", "responsabilité");
    expect(md).toContain("**137 résultat(s)**");
    expect(md).toContain("**Code civil**");
    expect(md).toContain("LEGITEXT000006070721");
    expect(md).toContain("[Voir]");
  });

  it("rend message vide si zéro résultat", () => {
    const md = formatSearchResultsAsMarkdown(0, [], "CODE_DATE", "xyzxyz");
    expect(md).toContain("Aucun résultat");
  });
});

describe("format — Search response sur fixtures RÉELLES PISTE", () => {
  it("CODE_DATE Code civil + 'responsabilité' — fixture réelle parse + mappe", () => {
    const raw = load("search-code-real");
    const parsed = SearchResponseSchema.parse(raw);
    const { total, hits } = summarizeSearchResponse(parsed);
    expect(total).toBeGreaterThan(0);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.titre).toBe("Code civil");
    expect(hits[0]!.id).toMatch(/^LEGITEXT/);
    expect(hits[0]!.extraits.length).toBeGreaterThan(0);
  });

  it("CIRC 'micro-BNC' — fixture réelle parse + mappe", () => {
    const raw = load("search-circ-real");
    const parsed = SearchResponseSchema.parse(raw);
    const { total, hits } = summarizeSearchResponse(parsed);
    expect(total).toBeGreaterThan(0);
    expect(hits.length).toBeGreaterThan(0);
    // Au moins un résultat a un titre
    expect(hits.some((h) => h.titre)).toBe(true);
  });

  it("JURI 'préjudice moral' — fixture réelle parse + mappe", () => {
    const raw = load("search-juri-real");
    const parsed = SearchResponseSchema.parse(raw);
    const { total, hits } = summarizeSearchResponse(parsed);
    expect(total).toBeGreaterThan(100_000); // ~146k résultats au moment de la capture
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.id).toMatch(/^JURITEXT/);
  });
});
