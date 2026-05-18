import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PisteHttpClient } from "../http.js";
import { log } from "../logger.js";

type RefType = "KALITEXT" | "LEGIARTI" | "LEGITEXT" | "JURITEXT" | "JORFTEXT" | "BOI";

interface RefMatch {
  type: RefType;
  id: string;
}

interface ValidationResult {
  id: string;
  type: RefType;
  exists: boolean;
  title?: string;
  /** Court extrait du champ d'application affichable au lecteur. */
  scope?: string;
  /** Concaténation plus large utilisée pour le cross-check sémantique (jamais affichée). */
  fullSearchable?: string;
  url: string;
  error?: string;
}

const ID_PATTERNS: Array<[RefType, RegExp]> = [
  ["KALITEXT", /KALITEXT\d{8,14}/g],
  ["LEGIARTI", /LEGIARTI\d{8,14}/g],
  ["LEGITEXT", /LEGITEXT\d{8,14}/g],
  ["JURITEXT", /JURITEXT\d{8,14}/g],
  ["JORFTEXT", /JORFTEXT\d{8,14}/g],
  ["BOI", /\bBOI-[A-Z]{2,5}(?:-[A-Z0-9]{1,5}){1,6}\b/g],
];

function extractReferences(note: string): RefMatch[] {
  const matches: RefMatch[] = [];
  const seen = new Set<string>();
  for (const [type, regex] of ID_PATTERNS) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(note)) !== null) {
      const id = m[0];
      const key = `${type}:${id}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({ type, id });
      }
    }
  }
  return matches;
}

function urlFor(ref: RefMatch): string {
  switch (ref.type) {
    case "KALITEXT":
      return `https://www.legifrance.gouv.fr/conv_coll/id/${ref.id}/`;
    case "LEGITEXT":
      return `https://www.legifrance.gouv.fr/loda/id/${ref.id}/`;
    case "JORFTEXT":
      return `https://www.legifrance.gouv.fr/jorf/id/${ref.id}/`;
    case "LEGIARTI":
      return `https://www.legifrance.gouv.fr/codes/article_lc/${ref.id}/`;
    case "JURITEXT":
      return `https://www.legifrance.gouv.fr/juri/id/${ref.id}/`;
    case "BOI":
      return `https://www.legifrance.gouv.fr/circulaire/id/${ref.id}/`;
  }
}

function pickString(...candidates: unknown[]): string | undefined {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) return c.trim();
  }
  return undefined;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface ExpectedContext {
  branche?: string;
  idcc?: string;
  code?: string;
  juridiction?: string;
}

type ContextMatch = "match" | "mismatch" | "n/a";

interface CrossCheckResult {
  status: ContextMatch;
  /** Mots-clés du contexte attendu qui ont été (ou pas) trouvés. */
  expectedKeywords: string[];
  /** Phrase explicative pour le rapport ("expected 'coiffure', found 'bricolage'"). */
  detail?: string;
}

/**
 * Vérifie si une référence Légifrance correspond bien au contexte annoncé
 * dans la note. C'est le verrou anti "piège des branches" : un KALITEXT
 * d'une CCN voisine (bricolage) cité dans une note coiffure passe la
 * vérification d'existence mais doit être détecté ici.
 */
function crossCheckContext(result: ValidationResult, ctx: ExpectedContext): CrossCheckResult {
  if (!result.exists) return { status: "n/a", expectedKeywords: [] };
  const searchable = normalize(
    [result.title, result.scope, result.fullSearchable].filter(Boolean).join(" "),
  );
  if (!searchable) return { status: "n/a", expectedKeywords: [] };

  let candidates: string[] = [];
  if (result.type === "KALITEXT" || result.type === "LEGITEXT") {
    if (ctx.branche) candidates.push(normalize(ctx.branche));
    if (ctx.idcc) candidates.push(ctx.idcc.trim());
  } else if (result.type === "LEGIARTI") {
    if (ctx.code) candidates.push(normalize(ctx.code));
  } else if (result.type === "JURITEXT") {
    if (ctx.juridiction) candidates.push(normalize(ctx.juridiction));
  } else if (result.type === "JORFTEXT") {
    if (ctx.branche) candidates.push(normalize(ctx.branche));
  }

  candidates = candidates.filter((c) => c.length > 0);
  if (candidates.length === 0) return { status: "n/a", expectedKeywords: [] };

  const matched = candidates.some((c) => searchable.includes(c));
  if (matched) return { status: "match", expectedKeywords: candidates };

  // Mismatch : on cherche un indice de la VRAIE branche dans le contenu
  // pour aider l'agent (et le lecteur du rapport) à comprendre le piège.
  const branchHint = findBranchHint(result.fullSearchable);
  const found = branchHint
    ? `réel rattachement détecté : « ${branchHint} »`
    : `titre réel : « ${(result.title ?? "").slice(0, 100)} »`;

  return {
    status: "mismatch",
    expectedKeywords: candidates,
    detail: `attendu ${candidates.map((c) => `« ${c} »`).join(" ou ")}, ${found}`,
  };
}

function findBranchHint(fullSearchable: string | undefined): string | undefined {
  if (!fullSearchable) return undefined;
  const lower = fullSearchable.toLowerCase();
  // On cherche en priorité « convention collective nationale » (le nom
  // complet d'une CCN contient quasi-systématiquement cette tournure) :
  // c'est ce pattern qui révèle la branche réelle dans le corps d'un
  // avenant. Si on tombe sur une mention plus laconique « convention
  // collective » sans « nationale », on l'utilise en second choix.
  let idx = lower.indexOf("convention collective nationale");
  if (idx < 0) idx = lower.indexOf("convention collective");
  if (idx < 0) return undefined;
  const chunk = fullSearchable.slice(idx, idx + 200).replace(/\s+/g, " ").trim();
  return chunk;
}

function extractTitle(raw: any, type: RefType): string | undefined {
  if (type === "JURITEXT") {
    return pickString(raw?.text?.titre, raw?.text?.titreLong, raw?.titre);
  }
  // KALITEXT, LEGITEXT, JORFTEXT, LEGIARTI, BOI : `title` est au top-level
  // pour la plupart des endpoints (kaliText, lawDecree, jorf, getArticle).
  return pickString(
    raw?.title,
    raw?.titre,
    raw?.titreLong,
    raw?.article?.titre,
    raw?.text?.titre,
    raw?.text?.titreLong,
  );
}

function extractScope(raw: any, type: RefType): string | undefined {
  if (type === "KALITEXT") {
    const articles = raw?.articles;
    if (Array.isArray(articles) && articles.length > 0) {
      const first = articles[0];
      const surtitre = pickString(first?.surtitre);
      const content = pickString(first?.content);
      if (content) {
        const stripped = content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        const truncated = stripped.length > 300 ? stripped.slice(0, 300) + "…" : stripped;
        if (surtitre) return `${surtitre} — ${truncated}`;
        return truncated;
      }
    }
    return pickString(
      raw?.contexte?.text?.titre,
      raw?.contexte?.text?.titreLong,
      raw?.contexte?.titre,
    );
  }
  if (type === "JURITEXT") {
    const j = pickString(raw?.text?.juridiction);
    const formation = pickString(raw?.text?.formation);
    return [j, formation].filter(Boolean).join(" · ") || undefined;
  }
  if (type === "LEGIARTI" || type === "LEGITEXT") {
    return pickString(raw?.context?.titreTxt?.titre, raw?.article?.context?.titreTxt?.titre);
  }
  return undefined;
}

/**
 * Extrait un blob de texte plus large que `scope`, utilisé seulement pour le
 * cross-check sémantique (matching de mots-clés). Pour les KALI, on
 * concatène le contenu de TOUS les articles : certains avenants ne nomment
 * leur branche que dans un article tardif (ex. avenant 109 commerce auto
 * qui mentionne « services de l'automobile » uniquement à l'article 4).
 * Ce blob n'est jamais affiché — il sert uniquement à `crossCheckContext`.
 */
function extractSearchable(raw: any, type: RefType): string | undefined {
  if (type === "KALITEXT") {
    const articles = raw?.articles;
    if (Array.isArray(articles) && articles.length > 0) {
      const parts = articles
        .map((a: any) => pickString(a?.content))
        .filter((s: string | undefined): s is string => Boolean(s))
        .map((s: string) => s.replace(/<[^>]+>/g, " "));
      const all = parts.join(" ").replace(/\s+/g, " ").trim();
      if (all) return all.length > 10000 ? all.slice(0, 10000) : all;
    }
    return undefined;
  }
  return undefined;
}

async function validateRef(ref: RefMatch, http: PisteHttpClient): Promise<ValidationResult> {
  const url = urlFor(ref);
  let path: string;
  let body: Record<string, string>;
  switch (ref.type) {
    case "KALITEXT":
      path = "/consult/kaliText";
      body = { id: ref.id };
      break;
    case "LEGITEXT":
      path = "/consult/lawDecree";
      body = { textId: ref.id };
      break;
    case "JORFTEXT":
      path = "/consult/jorf";
      body = { textCid: ref.id };
      break;
    case "LEGIARTI":
      path = "/consult/getArticle";
      body = { id: ref.id };
      break;
    case "JURITEXT":
      path = "/consult/juri";
      body = { textId: ref.id };
      break;
    case "BOI":
      path = "/consult/circulaire";
      body = { id: ref.id };
      break;
  }

  try {
    const raw: any = await http.post(path, body);
    if (!raw || (typeof raw === "object" && Object.keys(raw).length === 0)) {
      return { id: ref.id, type: ref.type, exists: false, url, error: "réponse vide" };
    }
    if (ref.type === "JURITEXT" && !raw?.text) {
      return { id: ref.id, type: ref.type, exists: false, url, error: "décision introuvable" };
    }
    // Pour les endpoints qui répondent toujours 200 avec un objet "creux"
    // quand l'ID n'existe pas (cas observé sur /consult/kaliText, lawDecree,
    // getArticle), on considère que l'absence de titre = référence inexistante.
    const title = extractTitle(raw, ref.type);
    if (!title) {
      return { id: ref.id, type: ref.type, exists: false, url, error: "texte introuvable (réponse sans titre)" };
    }
    return {
      id: ref.id,
      type: ref.type,
      exists: true,
      title,
      scope: extractScope(raw, ref.type),
      fullSearchable: extractSearchable(raw, ref.type),
      url,
    };
  } catch (err: any) {
    const msg = err?.message ? String(err.message) : String(err);
    return { id: ref.id, type: ref.type, exists: false, url, error: msg.slice(0, 240) };
  }
}

export function registerValidateNote(server: McpServer, http: PisteHttpClient) {
  server.registerTool(
    "validate_note",
    {
      title: "Valider toutes les références Légifrance citées dans une note",
      description: [
        "Extrait par regex tous les identifiants Légifrance (KALITEXT, LEGIARTI, LEGITEXT, JURITEXT, JORFTEXT, BOI-) cités dans une note, et vérifie pour chacun (a) son existence côté Légifrance, (b) son titre exact, (c) son champ d'application réel (branche pour KALI, juridiction pour JURI, code parent pour LEGIARTI).",
        "À APPELER OBLIGATOIREMENT en fin de production de note ou de consultation, avant restitution à l'utilisateur. C'est le seul garde-fou non-LLM contre les hallucinations résiduelles : identifiants forgés (IDs qui n'existent pas) ET identifiants vrais mais rattachés à une autre branche que celle annoncée (« piège des branches »).",
        "IMPORTANT : passe TOUJOURS le paramètre `expected_context` avec ce que la note prétend couvrir (branche/idcc pour les CCN, code parent pour les articles, juridiction pour les arrêts). Sans ce paramètre, le tool ne peut pas détecter automatiquement les références mal attribuées — il se contente de lister, à charge pour toi de comparer. AVEC ce paramètre, le tool fait le cross-check sémantique pour toi et te retourne une erreur explicite si une référence ne correspond pas.",
        "Le tool retourne `isError: true` si au moins une référence est invalide ou mal attribuée — dans ce cas, tu DOIS corriger la note avant restitution.",
      ].join("\n"),
      inputSchema: {
        note: z
          .string()
          .min(1)
          .describe("Texte complet de la note à valider, en markdown. Tu y passes la note finale telle que tu l'enverrais au lecteur."),
        expected_context: z
          .object({
            branche: z
              .string()
              .optional()
              .describe(
                "Branche / CCN annoncée dans la note pour les KALITEXT (ex. « coiffure », « métallurgie », « bâtiment », « distribution films »). Recherché en sous-chaîne, insensible à la casse et aux accents.",
              ),
            idcc: z
              .string()
              .optional()
              .describe(
                "IDCC à 4 chiffres annoncé pour les KALITEXT (ex. « 2596 » pour la coiffure, « 1090 » pour le commerce automobile).",
              ),
            code: z
              .string()
              .optional()
              .describe(
                "Code parent annoncé pour les LEGIARTI (ex. « Code du travail », « Code de commerce », « Code civil »).",
              ),
            juridiction: z
              .string()
              .optional()
              .describe(
                "Juridiction annoncée pour les JURITEXT (ex. « Cour de cassation, chambre sociale », « Conseil d'État », « Cour d'appel »).",
              ),
          })
          .optional()
          .describe(
            "Contexte attendu de la note. Permet au tool de détecter automatiquement les références mal attribuées (piège des branches). À fournir systématiquement.",
          ),
      },
    },
    async (args) => {
      const refs = extractReferences(args.note);
      if (refs.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "Aucun identifiant Légifrance détecté (KALITEXT/LEGIARTI/LEGITEXT/JURITEXT/JORFTEXT/BOI-). Si ta note contient des citations sans aucun de ces IDs, le format imposé (cf. skill geny) n'est pas respecté — chaque date d'acte juridique doit être suivie de son identifiant entre parenthèses. Réécris la note avec les IDs, ou marque explicitement les références non vérifiées « à confirmer ».",
            },
          ],
        };
      }

      log.info("validate-note: checking refs", { count: refs.length });

      const ctx: ExpectedContext = args.expected_context ?? {};
      const hasCtx = Object.values(ctx).some((v) => typeof v === "string" && v.trim().length > 0);

      const results = await Promise.all(refs.map((r) => validateRef(r, http)));
      const crossChecks = results.map((r) => crossCheckContext(r, ctx));
      const ok = results.filter((r) => r.exists);
      const ko = results.filter((r) => !r.exists);
      const mismatches = results
        .map((r, i) => ({ r, cc: crossChecks[i]! }))
        .filter(({ cc }) => cc.status === "mismatch");

      const blocking = ko.length > 0 || mismatches.length > 0;

      const lines: string[] = [];
      lines.push(`# Validation de ${results.length} référence(s) Légifrance citée(s)`);
      lines.push("");
      lines.push(
        `**Synthèse** : ${ok.length}/${results.length} trouvée(s), ${ko.length} échec(s) de vérification, ${mismatches.length} mal attribuée(s) (piège des branches).`,
      );
      if (!hasCtx) {
        lines.push("");
        lines.push(
          "⚠️ Tu n'as pas passé `expected_context` — le tool ne peut pas détecter automatiquement les références mal attribuées. Au prochain appel, passe `expected_context: { branche: \"…\", idcc: \"…\" }` (ou code/juridiction selon le cas) pour activer le cross-check anti piège-des-branches.",
        );
      }
      lines.push("");

      if (ko.length > 0) {
        lines.push("## ⚠️ Références non vérifiables");
        lines.push("");
        for (const r of ko) {
          lines.push(`- \`${r.id}\` (${r.type}) — **${r.error ?? "vérification impossible"}**`);
          lines.push(`  - URL tentée : ${r.url}`);
        }
        lines.push("");
        lines.push(
          "**Action requise** : pour CHAQUE référence ci-dessus, soit tu la récupères maintenant via le bon `legifrance_get_*` tool (et tu mets à jour ta note avec le titre exact), soit tu la retires de ta note et tu la remplaces par « à confirmer (référence non vérifiée) ». **Une référence non vérifiée ne doit jamais être livrée au lecteur.**",
        );
        lines.push("");
      }

      if (mismatches.length > 0) {
        lines.push("## 🚨 PIÈGE DES BRANCHES DÉTECTÉ — références mal attribuées");
        lines.push("");
        for (const { r, cc } of mismatches) {
          lines.push(`- \`${r.id}\` (${r.type}) — **MISMATCH**`);
          if (r.title) lines.push(`  - Titre réel : **${r.title}**`);
          if (r.scope) lines.push(`  - Rattachement réel : ${r.scope}`);
          if (cc.detail) lines.push(`  - ${cc.detail}`);
          lines.push(`  - URL : ${r.url}`);
        }
        lines.push("");
        lines.push(
          "**Action OBLIGATOIRE** : ces références ne correspondent PAS au contexte annoncé. Retire-les de ta note et remplace-les soit par la bonne référence (relance `legifrance_recherche` ciblée sur la vraie branche/code/juridiction), soit par « à confirmer (référence non vérifiée) ». **Ne livre PAS la note en l'état au lecteur.**",
        );
        lines.push("");
      }

      if (ok.length > 0) {
        const zipped = results.map((r, i) => ({ r, cc: crossChecks[i]! })).filter(({ r }) => r.exists);
        const matches = zipped.filter(({ cc }) => cc.status === "match").map(({ r }) => r);
        const naList = zipped.filter(({ cc }) => cc.status === "n/a").map(({ r }) => r);
        if (matches.length > 0) {
          lines.push("## ✓ Références confirmées et bien attribuées");
          lines.push("");
          for (const r of matches) {
            lines.push(`- \`${r.id}\` (${r.type})`);
            if (r.title) lines.push(`  - Titre réel : **${r.title}**`);
            if (r.scope) lines.push(`  - Rattachement : ${r.scope}`);
            lines.push(`  - URL : ${r.url}`);
          }
          lines.push("");
        }
        if (naList.length > 0) {
          lines.push("## ℹ️ Références confirmées (rattachement non cross-checké)");
          lines.push("");
          for (const r of naList) {
            lines.push(`- \`${r.id}\` (${r.type})`);
            if (r.title) lines.push(`  - Titre réel : **${r.title}**`);
            if (r.scope) lines.push(`  - Rattachement : ${r.scope}`);
            lines.push(`  - URL : ${r.url}`);
          }
          lines.push("");
          if (hasCtx) {
            lines.push(
              "*(Rattachement non cross-checké : type de référence non couvert par le contexte fourni, ou scope manquant.)*",
            );
          } else {
            lines.push(
              "*(Rattachement non cross-checké : aucun `expected_context` fourni. Lis chaque titre réel ci-dessus et compare-le à ce que ta note annonce.)*",
            );
          }
          lines.push("");
        }
      }

      lines.push("---");
      if (blocking) {
        lines.push(
          "**❌ La note ne passe pas la validation.** Corrige les références flaguées ci-dessus, puis ré-appelle `validate_note` pour confirmer.",
        );
      } else if (hasCtx) {
        lines.push(
          "**✅ La note passe la validation** : toutes les références citées existent et correspondent au contexte annoncé.",
        );
      } else {
        lines.push(
          "*Toutes les références citées existent. Le cross-check sémantique n'a pas été effectué (pas de `expected_context`). Compare manuellement chaque titre réel à ce que ta note annonce avant restitution.*",
        );
      }

      return {
        isError: blocking,
        content: [{ type: "text", text: lines.join("\n") }],
      };
    },
  );
}
