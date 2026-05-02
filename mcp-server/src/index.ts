#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { log } from "./logger.js";
import { registerStatus } from "./tools/status.js";

async function main() {
  const config = loadConfig();
  log.info("berryer mcp server starting", { env: config.env });

  const server = new McpServer({
    name: "berryer",
    version: "0.1.0",
  });

  registerStatus(server, config);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info("berryer mcp server connected");
}

main().catch((err) => {
  log.error("fatal", { err: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
