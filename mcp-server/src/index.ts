#!/usr/bin/env node
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

async function main() {
  const config = loadConfig();
  log.info("berryer mcp server starting", { env: config.env });

  const cache = new ResponseCache({ path: `${config.cacheDir}/cache.db` });
  const auth = new PisteClient(config);
  const http = new PisteHttpClient(config, auth, { cache });

  const server = new McpServer({
    name: "berryer",
    version: "0.1.0",
  });

  registerStatus(server, config, cache);
  registerGetArticle(server, http);
  registerGetCode(server, http);
  registerGetLoda(server, http);
  registerGetJurisprudence(server, http);
  registerGetJorf(server, http);
  registerGetCirculaire(server, http);
  registerRecherche(server, http);
  registerSuggest(server, http);
  registerCacheClear(server, cache);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info("berryer mcp server connected");

  const shutdown = () => {
    log.info("berryer mcp server shutting down");
    cache.close();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  log.error("fatal", { err: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
