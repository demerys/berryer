import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PisteHttpClient } from "../http.js";
import { ConsultTextResponseSchema } from "../schemas.js";
import { resolveLegitext, listKnownCodes } from "../codes-legitext.js";
import { normalizeLegiDate } from "../format.js";
import { log } from "../logger.js";

interface SectionLite {
  id: string | undefined;
  title: string | undefined;
  articles: number;
  sections: SectionLite[];
}

function summarizeSections(
  sections:
    | ReadonlyArray<{
        id?: string | null;
        title?: string | null;
        articles?: unknown[] | null;
        sections?: unknown[] | null;
      }>
    | null
    | undefined,
  depth = 0,
  maxDepth = 2,
): SectionLite[] {
  if (!sections || depth >= maxDepth) return [];
  return sections.map((s) => ({
    id: s.id ?? undefined,
    title: s.title ?? undefined,
    articles: Array.isArray(s.articles) ? s.articles.length : 0,
    sections: summarizeSections(s.sections as never, depth + 1, maxDepth),
  }));
}

function formatSectionTree(nodes: SectionLite[], indent = 0): string {
  return nodes
    .map((n) => {
      const pad = "  ".repeat(indent);
      const meta = n.articles > 0 ? ` _(${n.articles} article${n.articles > 1 ? "s" : ""})_` : "";
      const head = `${pad}- ${n.title ?? "(sans titre)"}${meta}`;
      const children = formatSectionTree(n.sections, indent + 1);
      return children ? `${head}\n${children}` : head;
    })
    .join("\n");
}

export function registerGetCode(server: McpServer, http: PisteHttpClient) {
  server.registerTool(
    "legifrance_get_code",
    {
      title: "Sommaire d'un code (Légifrance)",
      description: [
        "Récupère le sommaire (table des matières) d'un code français à une date donnée. Utile pour explorer la structure avant d'aller chercher un article précis avec `legifrance_get_article`.",
        `Codes connus : ${listKnownCodes().slice(0, 8).join(", ")}…`,
        "Si vous voulez le contenu d'un article précis, utilisez plutôt `legifrance_get_article`.",
      ].join("\n"),
      inputSchema: {
        code: z.string().describe("Nom du code (ex. 'Code civil') ou identifiant LEGITEXT…"),
        date: z
          .string()
          .optional()
          .describe("Date de consultation au format yyyy-MM-dd. Par défaut : aujourd'hui."),
        sectionId: z
          .string()
          .optional()
          .describe("Identifiant LEGISCTA d'une sous-section, pour ne charger qu'une partie."),
      },
    },
    async (args) => {
      const legitext = resolveLegitext(args.code);
      if (!legitext) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Code "${args.code}" non reconnu. Codes connus : ${listKnownCodes().join(", ")}.`,
            },
          ],
        };
      }
      const date = args.date ?? new Date().toISOString().slice(0, 10);
      const body: Record<string, unknown> = { textId: legitext, date };
      if (args.sectionId) body.sctCid = args.sectionId;

      const raw = await http.post("/consult/code", body);
      const parsed = ConsultTextResponseSchema.safeParse(raw);
      if (!parsed.success) {
        log.warn("get-code: response shape unexpected", { issues: parsed.error.issues.slice(0, 3) });
        return {
          isError: true,
          content: [{ type: "text", text: `Réponse Légifrance inattendue : ${parsed.error.message.slice(0, 300)}` }],
        };
      }

      const data = parsed.data;
      const lines: string[] = [];
      lines.push(`# ${data.title ?? args.code}`);
      const meta: string[] = [];
      if (data.nature) meta.push(data.nature);
      if (data.etat) meta.push(data.etat);
      const dateDebut = normalizeLegiDate(data.dateDebut);
      if (dateDebut) meta.push(`En vigueur depuis ${dateDebut}`);
      if (meta.length) lines.push(`_${meta.join(" · ")}_\n`);

      if (data.resume) {
        lines.push(data.resume);
        lines.push("");
      }

      const tree = summarizeSections(data.sections ?? undefined);
      if (tree.length > 0) {
        lines.push("## Sommaire");
        lines.push(formatSectionTree(tree));
      }
      const rootArticles = (data.articles ?? []).length;
      if (rootArticles > 0) {
        lines.push(`\n_${rootArticles} article(s) à la racine._`);
      }
      lines.push(`\nIdentifiant : \`${legitext}\``);

      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );
}
