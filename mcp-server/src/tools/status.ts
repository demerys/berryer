import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../config.js";
import type { ResponseCache } from "../cache.js";

export function registerStatus(server: McpServer, config: Config, cache?: ResponseCache) {
  server.registerTool(
    "piste_status",
    {
      title: "État de la connexion PISTE",
      description:
        "Diagnostic interne du plugin berryer : retourne l'environnement PISTE actif, la présence des credentials, les URLs cibles et les statistiques du cache. À utiliser pour vérifier que le plugin est correctement configuré avant d'appeler les autres tools.",
      inputSchema: z.object({}).shape,
    },
    async () => {
      const status = {
        ok: Boolean(config.clientId && config.clientSecret),
        env: config.env,
        hasClientId: Boolean(config.clientId),
        hasClientSecret: Boolean(config.clientSecret),
        oauthTokenUrl: config.oauthTokenUrl,
        apiBaseUrl: config.apiBaseUrl,
        cacheDir: config.cacheDir,
        cache: cache ? cache.stats() : null,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
      };
    },
  );
}
