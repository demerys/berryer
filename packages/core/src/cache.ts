import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
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

interface CacheEntry {
  response: unknown;
  fetchedAt: number;
  ttl: number;
}

interface CacheFile {
  /** key = `${method}|${paramsHash}` */
  entries: Record<string, CacheEntry>;
}

/**
 * Cache local pour les réponses PISTE — implémentation **JSON pur**.
 *
 * Pas de dépendance native (pas de better-sqlite3) — le plugin reste
 * 100 % bundlable par esbuild et fonctionne après un simple `git clone`
 * sans étape de build native. Pour les volumes de cache typiques d'un
 * cabinet (10-1000 entrées par session), la perf est largement
 * suffisante : la lecture/écriture d'un objet JSON ~10-200 KB prend
 * moins d'une milliseconde.
 *
 * - Stockage : un seul fichier JSON, écriture atomique via temp + rename.
 * - Mémoire : Map en mémoire pour les hits, persisté à chaque set/clear.
 * - Tests : path = ":memory:" → pas d'IO disque.
 */
export class ResponseCache {
  private path: string | undefined;
  private store: Map<string, CacheEntry>;
  private hits = 0;
  private misses = 0;

  constructor(opts: CacheOptions) {
    if (opts.path === ":memory:") {
      this.path = undefined;
      this.store = new Map();
      return;
    }
    this.path = opts.path;
    mkdirSync(dirname(this.path), { recursive: true });
    this.store = this.load();
  }

  /** Stable hash of arbitrary params. */
  static hash(params: unknown): string {
    return createHash("sha256").update(JSON.stringify(params ?? null)).digest("hex");
  }

  private key(method: string, paramsHash: string): string {
    return `${method}|${paramsHash}`;
  }

  private load(): Map<string, CacheEntry> {
    if (!this.path || !existsSync(this.path)) return new Map();
    try {
      const raw = readFileSync(this.path, "utf-8");
      const parsed = JSON.parse(raw) as CacheFile;
      const m = new Map<string, CacheEntry>();
      for (const [k, v] of Object.entries(parsed.entries ?? {})) {
        m.set(k, v);
      }
      return m;
    } catch (err) {
      log.warn("cache file unreadable, starting fresh", {
        path: this.path,
        err: err instanceof Error ? err.message : String(err),
      });
      return new Map();
    }
  }

  private persist(): void {
    if (!this.path) return;
    const data: CacheFile = { entries: Object.fromEntries(this.store) };
    const tmp = `${this.path}.tmp.${process.pid}.${Date.now()}`;
    try {
      writeFileSync(tmp, JSON.stringify(data));
      renameSync(tmp, this.path);
    } catch (err) {
      log.warn("cache persist failed", {
        path: this.path,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  get<T = unknown>(method: string, paramsHash: string): T | undefined {
    const k = this.key(method, paramsHash);
    const entry = this.store.get(k);
    if (!entry) {
      this.misses += 1;
      return undefined;
    }
    if (Date.now() > entry.fetchedAt + entry.ttl) {
      this.misses += 1;
      this.store.delete(k);
      this.persist();
      return undefined;
    }
    this.hits += 1;
    return entry.response as T;
  }

  set(method: string, paramsHash: string, response: unknown, ttlMs: number): void {
    const k = this.key(method, paramsHash);
    this.store.set(k, { response, fetchedAt: Date.now(), ttl: ttlMs });
    this.persist();
  }

  /** Clear all rows or those for a given method. */
  clear(method?: string): number {
    let deleted = 0;
    if (method) {
      const prefix = `${method}|`;
      for (const k of this.store.keys()) {
        if (k.startsWith(prefix)) {
          this.store.delete(k);
          deleted += 1;
        }
      }
    } else {
      deleted = this.store.size;
      this.store.clear();
    }
    this.persist();
    log.info("cache cleared", { method: method ?? "*", deleted });
    return deleted;
  }

  stats(): CacheStats {
    return {
      totalRows: this.store.size,
      hits: this.hits,
      misses: this.misses,
    };
  }

  close(): void {
    this.persist();
  }
}

/** TTL par défaut selon le type d'endpoint (en ms). */
export function defaultTtlForPath(path: string): number {
  if (path.includes("/search") || path.includes("/suggest") || path.includes("/list/")) {
    return 60 * 60 * 1000; // 1h pour les recherches (résultats mouvants)
  }
  return 24 * 60 * 60 * 1000; // 24h pour les consult (textes plus stables)
}
