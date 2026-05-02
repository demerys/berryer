import { request, type Dispatcher } from "undici";
import { log } from "./logger.js";
import type { Config } from "./config.js";
import type { PisteClient } from "./piste-client.js";
import { ResponseCache, defaultTtlForPath } from "./cache.js";

const MAX_RETRIES_429 = 3;
const RETRY_5XX_DELAY_MS = 2000;

export class PisteApiError extends Error {
  constructor(
    public status: number,
    public path: string,
    public body: string,
  ) {
    super(`PISTE/Légifrance ${status} sur ${path}: ${body.slice(0, 300)}`);
    this.name = "PisteApiError";
  }
}

export class PisteForbiddenError extends Error {
  constructor(public path: string, body: string) {
    super(
      `Accès refusé par PISTE (403) sur ${path}. Cause probable : votre application PISTE n'a pas souscrit à l'API Légifrance. Rendez-vous sur https://piste.gouv.fr (dashboard → application → Souscriptions). Détail : ${body.slice(0, 300)}`,
    );
    this.name = "PisteForbiddenError";
  }
}

export interface HttpClientOptions {
  /** Inject a dispatcher (for tests/MockAgent). */
  dispatcher?: Dispatcher;
  /** Override the sleep function (for tests). */
  sleep?: (ms: number) => Promise<void>;
  /** Optional response cache. */
  cache?: ResponseCache;
}

export interface RequestOptions {
  /** Skip the cache lookup (still writes to cache on success). */
  bypassCache?: boolean;
  /** Override the default TTL (ms). */
  ttlMs?: number;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class PisteHttpClient {
  private dispatcher?: Dispatcher;
  private sleep: (ms: number) => Promise<void>;
  cache?: ResponseCache;

  constructor(
    private config: Config,
    private auth: PisteClient,
    opts: HttpClientOptions = {},
  ) {
    this.dispatcher = opts.dispatcher;
    this.sleep = opts.sleep ?? defaultSleep;
    this.cache = opts.cache;
  }

  /**
   * POST a JSON body to the Légifrance API.
   * Handles auth (bearer token), 401 re-auth, 403 friendly error, 429 backoff, 5xx retry.
   */
  async post<T = unknown>(path: string, body: unknown, opts: RequestOptions = {}): Promise<T> {
    return this.callJson<T>("POST", path, body, opts);
  }

  async get<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
    return this.callJson<T>("GET", path, undefined, opts);
  }

  private async callJson<T>(
    method: "GET" | "POST",
    path: string,
    body: unknown,
    opts: RequestOptions,
  ): Promise<T> {
    const cacheKey = `${method} ${path}`;
    const paramsHash = this.cache ? ResponseCache.hash(body ?? null) : "";

    if (this.cache && !opts.bypassCache) {
      const cached = this.cache.get<T>(cacheKey, paramsHash);
      if (cached !== undefined) {
        log.debug("cache hit", { method, path });
        return cached;
      }
    }

    const url = `${this.config.apiBaseUrl}${path}`;
    let attempt429 = 0;
    let attempt401 = 0;
    let attempt5xx = 0;

    // Retry loop. Each branch decides whether to retry.
    while (true) {
      const token = await this.auth.getAccessToken();
      const start = Date.now();
      const res = await request(url, {
        method,
        headers: {
          authorization: `Bearer ${token}`,
          accept: "application/json",
          ...(body !== undefined ? { "content-type": "application/json" } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        dispatcher: this.dispatcher,
      });
      const text = await res.body.text();
      const elapsedMs = Date.now() - start;

      if (res.statusCode === 200 || res.statusCode === 201) {
        log.debug("piste api ok", { method, path, status: res.statusCode, ms: elapsedMs });
        const parsed = text ? (JSON.parse(text) as T) : (undefined as T);
        if (this.cache && parsed !== undefined) {
          const ttl = opts.ttlMs ?? defaultTtlForPath(path);
          this.cache.set(cacheKey, paramsHash, parsed, ttl);
        }
        return parsed;
      }

      if (res.statusCode === 401 && attempt401 === 0) {
        log.warn("piste api 401, re-auth and retry", { path });
        this.auth.invalidateToken();
        attempt401 += 1;
        continue;
      }

      if (res.statusCode === 403) {
        log.error("piste api 403", { path, body: text.slice(0, 300) });
        throw new PisteForbiddenError(path, text);
      }

      if (res.statusCode === 429 && attempt429 < MAX_RETRIES_429) {
        const delay = Math.min(2 ** attempt429 * 1000, 8000);
        log.warn("piste api 429, backoff", { path, attempt: attempt429 + 1, delayMs: delay });
        attempt429 += 1;
        await this.sleep(delay);
        continue;
      }

      if (res.statusCode >= 500 && res.statusCode < 600 && attempt5xx === 0) {
        log.warn("piste api 5xx, retry once", { path, status: res.statusCode });
        attempt5xx += 1;
        await this.sleep(RETRY_5XX_DELAY_MS);
        continue;
      }

      log.error("piste api error", { method, path, status: res.statusCode, body: text.slice(0, 300) });
      throw new PisteApiError(res.statusCode, path, text);
    }
  }
}
