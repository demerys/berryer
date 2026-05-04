import { describe, it, expect } from "vitest";
import { resolveLegitext } from "../src/codes-legitext.js";

describe("codes-legitext", () => {
  it("résout 'Code civil' (case-insensitive)", () => {
    expect(resolveLegitext("Code civil")).toBe("LEGITEXT000006070721");
    expect(resolveLegitext("CODE CIVIL")).toBe("LEGITEXT000006070721");
    expect(resolveLegitext("  code civil  ")).toBe("LEGITEXT000006070721");
  });

  it("résout l'alias 'CGI'", () => {
    expect(resolveLegitext("CGI")).toBe("LEGITEXT000006069577");
    expect(resolveLegitext("Code général des impôts")).toBe("LEGITEXT000006069577");
  });

  it("accepte un LEGITEXT direct", () => {
    expect(resolveLegitext("LEGITEXT000006070721")).toBe("LEGITEXT000006070721");
    expect(resolveLegitext("legitext000006070721")).toBe("LEGITEXT000006070721");
  });

  it("retourne undefined pour un nom inconnu", () => {
    expect(resolveLegitext("Code des chevaliers de la table ronde")).toBeUndefined();
  });
});
