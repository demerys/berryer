import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";
import { log } from "./logger.js";

export interface CacheStats {
  totalRows: number;
  hits: number;
  misses: number;
}

export interface CacheOptions {
  /** Filesystem path or ":memory:" for tests. */
  path: string;
}

/**
 * Cache SQLite local pour les réponses PISTE.
 * Schéma : (method, params_hash) → response_json + fetched_at + ttl.
 * better-sqlite3 est synchrone et 100% local — zéro latence après ouverture.
 */
export class ResponseCache {
  private db: DatabaseType;
  private hits = 0;
  private misses = 0;

  constructor(opts: CacheOptions) {
    if (opts.path !== ":memory:") {
      mkdirSync(dirname(opts.path), { recursive: true });
    }
    this.db = new Database(opts.path);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("synchronous = NORMAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS responses (
        method TEXT NOT NULL,
        params_hash TEXT NOT NULL,
        response_json TEXT NOT NULL,
        fetched_at INTEGER NOT NULL,
        ttl INTEGER NOT NULL,
        PRIMARY KEY(method, params_hash)
      )
    `);
  }

  /** Stable hash of arbitrary params. */
  static hash(params: unknown): string {
    return createHash("sha256").update(JSON.stringify(params ?? null)).digest("hex");
  }

  get<T = unknown>(method: string, paramsHash: string): T | undefined {
    const row = this.db
      .prepare<[string, string], { response_json: string; fetched_at: number; ttl: number }>(
        "SELECT response_json, fetched_at, ttl FROM responses WHERE method = ? AND params_hash = ?",
      )
      .get(method, paramsHash);
    if (!row) {
      this.misses += 1;
      return undefined;
    }
    if (Date.now() > row.fetched_at + row.ttl) {
      this.misses += 1;
      this.db
        .prepare("DELETE FROM responses WHERE method = ? AND params_hash = ?")
        .run(method, paramsHash);
      return undefined;
    }
    this.hits += 1;
    return JSON.parse(row.response_json) as T;
  }

  set(method: string, paramsHash: string, response: unknown, ttlMs: number): void {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO responses (method, params_hash, response_json, fetched_at, ttl) VALUES (?, ?, ?, ?, ?)",
      )
      .run(method, paramsHash, JSON.stringify(response), Date.now(), ttlMs);
  }

  /** Clear all rows or those for a given method. */
  clear(method?: string): number {
    const result = method
      ? this.db.prepare("DELETE FROM responses WHERE method = ?").run(method)
      : this.db.prepare("DELETE FROM responses").run();
    log.info("cache cleared", { method: method ?? "*", deleted: result.changes });
    return result.changes;
  }

  stats(): CacheStats {
    const row = this.db
      .prepare<[], { count: number }>("SELECT COUNT(*) as count FROM responses")
      .get();
    return {
      totalRows: row?.count ?? 0,
      hits: this.hits,
      misses: this.misses,
    };
  }

  close(): void {
    this.db.close();
  }
}

/** TTL par défaut selon le type d'endpoint (en ms). */
export function defaultTtlForPath(path: string): number {
  if (path.includes("/search") || path.includes("/suggest") || path.includes("/list/")) {
    return 60 * 60 * 1000; // 1h pour les recherches (résultats mouvants)
  }
  return 24 * 60 * 60 * 1000; // 24h pour les consult (textes plus stables)
}
