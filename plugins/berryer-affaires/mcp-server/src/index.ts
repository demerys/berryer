#!/usr/bin/env node
import { createBerryerServer, log } from "@berryer/core";

const { start } = createBerryerServer({ name: "berryer-affaires", version: "0.1.0" });

start().catch((err) => {
  log.error("fatal", { err: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
