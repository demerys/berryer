import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BofipRecordsResponseSchema } from "../src/schemas.js";
import { odsqlString, normalizeBoiId } from "../src/bofip.js";

const fixtureDir = resolve(__dirname, "fixtures");

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(resolve(fixtureDir, `${name}.json`), "utf-8"));
}

describe("bofip — schémas (fixtures réelles open data DGFiP)", () => {
  it("parse une réponse réelle de recherche plein texte (bofip-vigueur)", () => {
    const raw = loadFixture("bofip-search-real");
    const parsed = BofipRecordsResponseSchema.parse(raw);
    expect(parsed.total_count).toBeGreaterThan(0);
    expect(parsed.results.length).toBeGreaterThan(0);
    const first = parsed.results[0]!;
    expect(first.identifiant_juridique).toMatch(/^BOI-/);
    expect(first.titre).toBeTruthy();
    expect(first.permalien).toContain("bofip.impots.gouv.fr");
  });

  it("parse une réponse réelle de lookup par identifiant (BOI-INT-CVB-ITA)", () => {
    const raw = loadFixture("bofip-doc-real");
    const parsed = BofipRecordsResponseSchema.parse(raw);
    expect(parsed.total_count).toBe(1);
    const rec = parsed.results[0]!;
    expect(rec.identifiant_juridique).toBe("BOI-INT-CVB-ITA");
    expect(rec.serie).toBe("INT");
    expect(rec.division).toBe("CVB");
    expect(rec.titre).toContain("Italie");
    expect(rec.contenu).toBeTruthy();
  });
});

describe("bofip — helpers", () => {
  it("odsqlString quote et neutralise les guillemets", () => {
    expect(odsqlString("régime des sociétés mères")).toBe('"régime des sociétés mères"');
    expect(odsqlString('a"b\\c')).toBe('"a b c"');
  });

  it("normalizeBoiId retire le suffixe de version -YYYYMMDD", () => {
    expect(normalizeBoiId("BOI-INT-CVB-ITA-20120912")).toBe("BOI-INT-CVB-ITA");
    expect(normalizeBoiId("BOI-IS-BASE-10-10-10-10")).toBe("BOI-IS-BASE-10-10-10-10");
    expect(normalizeBoiId(" BOI-TVA-CHAMP-20-50 ")).toBe("BOI-TVA-CHAMP-20-50");
  });

  it("normalizeBoiId ne confond pas un segment numérique court avec une version", () => {
    // les segments de plan BOFiP font 2-3 chiffres, jamais 8
    expect(normalizeBoiId("BOI-IS-BASE-10-10")).toBe("BOI-IS-BASE-10-10");
  });
});
