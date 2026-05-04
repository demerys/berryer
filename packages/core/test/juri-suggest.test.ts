import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ConsultJuriResponseSchema, SuggestResponseSchema } from "../src/schemas.js";

const fixtureDir = resolve(__dirname, "fixtures");
const load = (name: string) =>
  JSON.parse(readFileSync(resolve(fixtureDir, `${name}.json`), "utf-8"));

describe("ConsultJuriResponse — fixture réelle PISTE", () => {
  it("parse une décision Cass où sommaire est un Array<{abstrats, resumePrincipal, autreResume}>", () => {
    const raw = load("juri-real");
    const parsed = ConsultJuriResponseSchema.parse(raw);
    expect(parsed.text).toBeTruthy();
    const t = parsed.text!;
    expect(t.juridiction).toBe("Cour de cassation");
    expect(t.solution).toBe("Cassation");
    expect(Array.isArray(t.sommaire)).toBe(true);
    if (Array.isArray(t.sommaire)) {
      expect(t.sommaire.length).toBeGreaterThan(0);
      expect(t.sommaire[0]!.abstrats).toContain("articles 2224 du code civil");
    }
  });
});

describe("SuggestResponse — fixture réelle PISTE", () => {
  it("parse un retour où results est un Array<SuggestValue> (pas un Map<supply, Map<id, ...>>)", () => {
    const raw = load("suggest-real");
    const parsed = SuggestResponseSchema.parse(raw);
    expect(Array.isArray(parsed.results)).toBe(true);
    const arr = parsed.results as Array<{ id?: string | null; label?: string | null }>;
    expect(arr.length).toBeGreaterThan(0);
    expect(arr[0]!.id).toBeTruthy();
    expect(arr[0]!.label).toBeTruthy();
  });
});
