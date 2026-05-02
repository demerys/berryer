import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GetArticleResponseSchema } from "../src/schemas.js";
import { summarizeArticle, formatArticleAsMarkdown } from "../src/format.js";

const fixtureDir = resolve(__dirname, "fixtures");

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(resolve(fixtureDir, `${name}.json`), "utf-8"));
}

describe("format — Article mapper", () => {
  it("parse la fixture article et extrait les champs clés", () => {
    const raw = loadFixture("article-synthetic");
    const parsed = GetArticleResponseSchema.parse(raw);
    expect(parsed.article).toBeDefined();
    const summary = summarizeArticle(parsed.article!);

    expect(summary.id).toBe("LEGIARTI000006417707");
    expect(summary.numero).toBe("1240");
    expect(summary.etat).toBe("VIGUEUR");
    expect(summary.codeId).toBe("LEGITEXT000006070721");
    expect(summary.texte).toContain("dommage");
    expect(summary.lienLegifrance).toBe(
      "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006417707/",
    );
  });

  it("rend en Markdown avec en-tête, texte et métadonnées", () => {
    const raw = loadFixture("article-synthetic");
    const parsed = GetArticleResponseSchema.parse(raw);
    const md = formatArticleAsMarkdown(summarizeArticle(parsed.article!));

    expect(md).toContain("**Article 1240**");
    expect(md).toContain("VIGUEUR");
    expect(md).toContain("Sous-titre II");
    expect(md).toContain("Identifiant : `LEGIARTI000006417707`");
    expect(md).toContain("[Voir sur Légifrance]");
  });

  it("fallback HTML→texte si `texte` absent", () => {
    const fakeArticle = {
      article: {
        id: "LEGIARTI000000000000",
        num: "1",
        texteHtml: "<p>Premier paragraphe.</p><p>Second.</p>",
        etat: "VIGUEUR",
      },
    };
    const parsed = GetArticleResponseSchema.parse(fakeArticle);
    const summary = summarizeArticle(parsed.article!);
    expect(summary.texte).toContain("Premier paragraphe.");
    expect(summary.texte).toContain("Second.");
    expect(summary.texte).not.toContain("<p>");
  });

  it("article null → la réponse parse mais summarize n'est pas appelé", () => {
    const parsed = GetArticleResponseSchema.parse({ article: null });
    expect(parsed.article).toBeNull();
  });

  it("fixture RÉELLE article 1240 Code civil (capture PISTE prod)", () => {
    const raw = loadFixture("article-1240-code-civil-byNum");
    const parsed = GetArticleResponseSchema.parse(raw);
    const summary = summarizeArticle(parsed.article!);
    expect(summary.numero).toBe("1240");
    expect(summary.etat).toBe("VIGUEUR");
    expect(summary.dateDebut).toBe("2016-10-01");
    expect(summary.texte).toContain("Tout fait quelconque de l'homme");
    expect(summary.lienLegifrance).toMatch(/LEGIARTI\d+/);
  });

  it("fixture RÉELLE article 222-33 ancien Code pénal (dates en epoch ms)", () => {
    const raw = loadFixture("article-1240-code-civil-real");
    const parsed = GetArticleResponseSchema.parse(raw);
    const summary = summarizeArticle(parsed.article!);
    expect(summary.numero).toBe("222-33");
    expect(summary.etat).toBe("MODIFIE");
    // dateDebut épochs ms = 898128000000 → 1998-06-18
    expect(summary.dateDebut).toBe("1998-06-18");
    expect(summary.dateFin).toBe("2002-01-01");
  });
});
