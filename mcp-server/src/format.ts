import type { Article } from "./schemas.js";

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

function legifranceArticleUrl(id: string | undefined): string | undefined {
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
  return {
    id: article.id ?? "",
    numero: article.num,
    titre: article.sectionParentTitre,
    texte,
    etat: article.etat,
    dateDebut: article.dateDebut,
    dateFin: article.dateFin,
    version: article.versionArticle,
    codeId: article.cidTexte ?? article.idTexte,
    lienLegifrance: legifranceArticleUrl(article.id),
  };
}

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
  if (s.dateDebut) meta.push(`En vigueur depuis le ${s.dateDebut.slice(0, 10)}`);
  if (s.dateFin && s.dateFin !== "2999-01-01") meta.push(`Fin de vigueur : ${s.dateFin.slice(0, 10)}`);
  if (s.version) meta.push(`Version ${s.version}`);
  if (s.id) meta.push(`Identifiant : \`${s.id}\``);
  if (s.lienLegifrance) meta.push(`[Voir sur Légifrance](${s.lienLegifrance})`);
  if (meta.length > 0) lines.push(meta.join(" · "));
  return lines.join("\n");
}
