import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { log } from "./logger.js";
import { PisteClient } from "./piste-client.js";
import { PisteHttpClient } from "./http.js";
import { ResponseCache } from "./cache.js";
import { registerStatus } from "./tools/status.js";
import { registerGetArticle } from "./tools/get-article.js";
import { registerGetCode } from "./tools/get-code.js";
import { registerGetLoda } from "./tools/get-loda.js";
import { registerGetJurisprudence } from "./tools/get-jurisprudence.js";
import { registerGetJorf } from "./tools/get-jorf.js";
import { registerGetCirculaire } from "./tools/get-circulaire.js";
import { registerRecherche } from "./tools/recherche.js";
import { registerSuggest } from "./tools/suggest.js";
import { registerCacheClear } from "./tools/cache-clear.js";

// Re-exports pour les plugins qui veulent un usage avancé.
export { loadConfig } from "./config.js";
export type { Config, PisteEnv } from "./config.js";
export { log } from "./logger.js";
export { PisteClient, PisteCredentialsMissingError, PisteAuthError } from "./piste-client.js";
export {
  PisteHttpClient,
  PisteApiError,
  PisteForbiddenError,
} from "./http.js";
export type { HttpClientOptions, RequestOptions } from "./http.js";
export { ResponseCache, defaultTtlForPath } from "./cache.js";
export type { CacheStats, CacheOptions } from "./cache.js";
export {
  registerStatus,
  registerGetArticle,
  registerGetCode,
  registerGetLoda,
  registerGetJurisprudence,
  registerGetJorf,
  registerGetCirculaire,
  registerRecherche,
  registerSuggest,
  registerCacheClear,
};

export interface CreateServerOptions {
  /** Nom du serveur MCP, exposé en `mcp__plugin_<plugin>_<server>__*`. */
  name: string;
  /** Version du plugin (cf. plugin.json). */
  version: string;
}

export interface CreatedServer {
  server: McpServer;
  /** Démarre le transport stdio + handlers de signal. À await dans le main du plugin. */
  start: () => Promise<void>;
}

/**
 * Crée un MCP server préconfiguré avec les 10 tools Légifrance, le cache SQLite
 * local, le client PISTE OAuth et les handlers de shutdown propre.
 *
 * Chaque plugin de la suite Berryer (généraliste, affaires, social) appelle
 * cette fonction depuis son propre `mcp-server/src/index.ts`. Le cache et la
 * config sont chargés depuis `${CLAUDE_PLUGIN_ROOT}/.cache/cache.db` et les
 * variables d'env / `~/.config/berryer/credentials.json` (cf. config.ts).
 */
export function createBerryerServer(opts: CreateServerOptions): CreatedServer {
  const config = loadConfig();
  log.info(`${opts.name} mcp server starting`, { env: config.env });

  const cache = new ResponseCache({ path: `${config.cacheDir}/cache.db` });
  const auth = new PisteClient(config);
  const http = new PisteHttpClient(config, auth, { cache });

  const server = new McpServer({ name: opts.name, version: opts.version });

  registerStatus(server, config, cache, auth, http);
  registerGetArticle(server, http);
  registerGetCode(server, http);
  registerGetLoda(server, http);
  registerGetJurisprudence(server, http);
  registerGetJorf(server, http);
  registerGetCirculaire(server, http);
  registerRecherche(server, http);
  registerSuggest(server, http);
  registerCacheClear(server, cache);

  const start = async () => {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    log.info(`${opts.name} mcp server connected`);

    const shutdown = () => {
      log.info(`${opts.name} mcp server shutting down`);
      cache.close();
      process.exit(0);
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  };

  return { server, start };
}
