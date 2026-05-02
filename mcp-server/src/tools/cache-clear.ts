import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ResponseCache } from "../cache.js";

export function registerCacheClear(server: McpServer, cache: ResponseCache | undefined) {
  server.registerTool(
    "piste_cache_clear",
    {
      title: "Vider le cache PISTE local",
      description:
        "Supprime tout ou partie du cache local (responses SQLite). À utiliser si vous suspectez des données obsolètes ou pour forcer un appel frais. Optionnel : `method` (ex. `POST /search`) pour ne purger qu'une famille de requêtes.",
      inputSchema: {
        method: z.string().optional().describe("Filtre méthode + chemin (ex. `POST /search`)"),
      },
    },
    async (args) => {
      if (!cache) {
        return {
          content: [{ type: "text", text: "Cache désactivé." }],
        };
      }
      const deleted = cache.clear(args.method);
      const stats = cache.stats();
      return {
        content: [
          {
            type: "text",
            text: `${deleted} entrée(s) supprimée(s). Reste ${stats.totalRows} entrée(s) en cache.`,
          },
        ],
      };
    },
  );
}
