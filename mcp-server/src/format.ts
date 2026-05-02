import type { Article, SearchResponse, SearchResult } from "./schemas.js";

/**
 * Normalise une date Légifrance (timestamp epoch ms en number,
 * ou chaîne ISO, ou null/undefined) en chaîne `YYYY-MM-DD`.
 */
export function normalizeLegiDate(d: number | string | null | undefined): string | undefined {
  if (d === null || d === undefined) return undefined;
  if (typeof d === "number") {
    if (!Number.isFinite(d)) return undefined;
    return new Date(d).toISOString().slice(0, 10);
  }
  // String — accept "YYYY-MM-DD", "YYYY-MM-DDT…", or epoch as string.
  if (/^\d+$/.test(d)) {
    const n = Number(d);
    return new Date(n).toISOString().slice(0, 10);
  }
  return d.slice(0, 10);
}

/**
 * Mapper compact pour un Article Légifrance.
 * Objectif : extraire ce qui est utile au lecteur (Claude / utilisateur final)
 * sans saturer le contexte avec les ~30 champs bruts du Swagger.
 */
export interface ArticleSummary {
  id: string;
  numero: string | undefined;
  titre: string | undefined;
  texte: string;
  etat: string | undefined;
  dateDebut: string | undefined;
  dateFin: string | undefined;
  version: string | undefined;
  codeId: string | undefined;
  lienLegifrance: string | undefined;
}

const LEGIFRANCE_BASE = "https://www.legifrance.gouv.fr";

function legifranceArticleUrl(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  if (id.startsWith("LEGIARTI")) {
    return `${LEGIFRANCE_BASE}/codes/article_lc/${id}/`;
  }
  if (id.startsWith("KALIARTI")) {
    return `${LEGIFRANCE_BASE}/conv_coll/article/${id}/`;
  }
  return undefined;
}

/** Strip simple HTML to plain text (best-effort). Used as fallback. */
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function summarizeArticle(article: Article): ArticleSummary {
  const texte = article.texte ?? (article.texteHtml ? htmlToText(article.texteHtml) : "");
  // Le contexte hiérarchique (context.titreTxt) porte le titre du texte parent
  // (ex. "Code pénal"). On l'utilise comme "titre" si sectionParentTitre manque.
  const parentTexte = article.context?.titreTxt?.[0]?.titre;
  const titre = article.sectionParentTitre ?? parentTexte ?? undefined;
  // codeId : on cherche le LEGITEXT du texte parent dans context.titreTxt[].cid.
  const parentCid = article.context?.titreTxt?.[0]?.cid;
  return {
    id: article.id ?? "",
    numero: article.num ?? undefined,
    titre,
    texte,
    etat: article.etat ?? undefined,
    dateDebut: normalizeLegiDate(article.dateDebut),
    dateFin: normalizeLegiDate(article.dateFin),
    version: article.versionArticle ?? undefined,
    codeId: article.cidTexte ?? article.idTexte ?? parentCid ?? undefined,
    lienLegifrance: legifranceArticleUrl(article.id),
  };
}

/* ------------------------------------------------------------------ */
/*  Search results                                                    */
/* ------------------------------------------------------------------ */

export interface SearchHit {
  id: string | undefined;
  cid: string | undefined;
  titre: string | undefined;
  nature: string | undefined;
  etat: string | undefined;
  date: string | undefined;
  num: string | undefined;
  extraits: string[];
  lien: string | undefined;
}

function legifranceLinkForId(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  if (id.startsWith("LEGITEXT")) return `${LEGIFRANCE_BASE}/codes/texte_lc/${id}/`;
  if (id.startsWith("LEGIARTI")) return `${LEGIFRANCE_BASE}/codes/article_lc/${id}/`;
  if (id.startsWith("JORFTEXT")) return `${LEGIFRANCE_BASE}/jorf/id/${id}`;
  if (id.startsWith("JORFARTI")) return `${LEGIFRANCE_BASE}/jorf/article_jo/${id}`;
  if (id.startsWith("JURITEXT")) return `${LEGIFRANCE_BASE}/juri/id/${id}`;
  if (id.startsWith("CETATEXT")) return `${LEGIFRANCE_BASE}/ceta/id/${id}`;
  if (id.startsWith("CONSTEXT")) return `${LEGIFRANCE_BASE}/cons/id/${id}`;
  if (id.startsWith("BOI")) return `${LEGIFRANCE_BASE}/circulaire/id/${id}`;
  if (id.startsWith("KALI")) return `${LEGIFRANCE_BASE}/conv_coll/id/${id}/`;
  return undefined;
}

export function summarizeSearchResult(result: SearchResult): SearchHit {
  const firstTitle = result.titles?.[0];
  const id = firstTitle?.id ?? firstTitle?.cid ?? undefined;
  const extraits: string[] = [];
  if (result.sections) {
    for (const section of result.sections) {
      if (!section.extracts) continue;
      for (const extract of section.extracts) {
        if (extract.values) {
          for (const v of extract.values) {
            if (extraits.length < 3) extraits.push(v);
          }
        }
      }
    }
  }
  return {
    id: id ?? undefined,
    cid: firstTitle?.cid ?? undefined,
    titre: firstTitle?.title ?? undefined,
    nature: result.nature ?? firstTitle?.nature ?? undefined,
    etat: result.etat ?? firstTitle?.legalStatus ?? undefined,
    date: normalizeLegiDate(result.dateSignature ?? result.datePublication ?? firstTitle?.startDate),
    num: result.num ?? undefined,
    extraits,
    lien: legifranceLinkForId(id),
  };
}

export function summarizeSearchResponse(resp: SearchResponse): {
  total: number;
  hits: SearchHit[];
} {
  return {
    total: resp.totalResultNumber ?? 0,
    hits: (resp.results ?? []).map(summarizeSearchResult),
  };
}

export function formatSearchResultsAsMarkdown(
  total: number,
  hits: SearchHit[],
  fond: string,
  query: string,
): string {
  if (hits.length === 0) {
    return `**Aucun résultat** pour "${query}" sur le fond ${fond}.`;
  }
  const lines: string[] = [];
  lines.push(`**${total} résultat(s)** pour "${query}" sur le fond ${fond} (top ${hits.length}) :`);
  lines.push("");
  hits.forEach((h, i) => {
    const head = h.titre ?? "(sans titre)";
    const num = h.num ? `n° ${h.num}` : "";
    const meta: string[] = [];
    if (h.nature) meta.push(h.nature);
    if (h.etat) meta.push(h.etat);
    if (h.date) meta.push(h.date);
    lines.push(`${i + 1}. **${head}** ${num}`.trim());
    if (meta.length > 0) lines.push(`   _${meta.join(" · ")}_`);
    if (h.id) lines.push(`   \`${h.id}\``);
    for (const ex of h.extraits.slice(0, 2)) {
      lines.push(`   > ${ex.replace(/\s+/g, " ").slice(0, 200)}${ex.length > 200 ? "…" : ""}`);
    }
    if (h.lien) lines.push(`   [Voir](${h.lien})`);
    lines.push("");
  });
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Article (Markdown)                                                */
/* ------------------------------------------------------------------ */

/** Format the article summary as Markdown for display in Claude tool output. */
export function formatArticleAsMarkdown(s: ArticleSummary): string {
  const lines: string[] = [];
  const head = s.numero ? `**Article ${s.numero}**` : "**Article**";
  const stateNote = s.etat ? ` _(${s.etat})_` : "";
  lines.push(`${head}${stateNote}`);
  if (s.titre) lines.push(`> ${s.titre}`);
  lines.push("");
  lines.push(s.texte || "_(texte vide)_");
  lines.push("");
  const meta: string[] = [];
  if (s.dateDebut) meta.push(`En vigueur depuis le ${s.dateDebut}`);
  if (s.dateFin && s.dateFin !== "2999-01-01" && !s.dateFin.startsWith("3000-")) {
    meta.push(`Fin de vigueur : ${s.dateFin}`);
  }
  if (s.version) meta.push(`Version ${s.version}`);
  if (s.id) meta.push(`Identifiant : \`${s.id}\``);
  if (s.lienLegifrance) meta.push(`[Voir sur Légifrance](${s.lienLegifrance})`);
  if (meta.length > 0) lines.push(meta.join(" · "));
  return lines.join("\n");
}
