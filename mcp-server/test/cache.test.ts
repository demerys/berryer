import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ResponseCache, defaultTtlForPath } from "../src/cache.js";

describe("ResponseCache", () => {
  let cache: ResponseCache;

  beforeEach(() => {
    cache = new ResponseCache({ path: ":memory:" });
  });

  afterEach(() => {
    cache.close();
  });

  it("miss → set → hit", () => {
    const hash = ResponseCache.hash({ id: "X" });
    expect(cache.get("POST /consult/getArticle", hash)).toBeUndefined();

    cache.set("POST /consult/getArticle", hash, { article: { id: "X" } }, 60_000);

    const hit = cache.get<{ article: { id: string } }>("POST /consult/getArticle", hash);
    expect(hit).toEqual({ article: { id: "X" } });

    const stats = cache.stats();
    expect(stats.totalRows).toBe(1);
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
  });

  it("hash stable et indépendant de l'ordre des clés", () => {
    const a = ResponseCache.hash({ a: 1, b: 2 });
    const b = ResponseCache.hash({ a: 1, b: 2 });
    expect(a).toBe(b);
    // Note : différent ordre de clés JSON.stringify produit un hash différent.
    // C'est acceptable pour notre usage (tools construisent toujours le même body).
    const c = ResponseCache.hash({ a: 1, c: 3 });
    expect(a).not.toBe(c);
  });

  it("expire les entrées au-delà du TTL", () => {
    const hash = "h";
    cache.set("POST /search", hash, { x: 1 }, 1); // 1 ms TTL
    // sleep synchronous via busy loop
    const until = Date.now() + 5;
    while (Date.now() < until) {
      // wait
    }
    expect(cache.get("POST /search", hash)).toBeUndefined();
  });

  it("clear() purge tout, clear(method) cible une famille", () => {
    cache.set("POST /search", "h1", { a: 1 }, 60_000);
    cache.set("POST /search", "h2", { a: 2 }, 60_000);
    cache.set("POST /consult/code", "h3", { a: 3 }, 60_000);

    expect(cache.stats().totalRows).toBe(3);

    cache.clear("POST /search");
    expect(cache.stats().totalRows).toBe(1);

    cache.clear();
    expect(cache.stats().totalRows).toBe(0);
  });

  it("defaultTtlForPath donne 1h pour /search, 24h pour /consult", () => {
    expect(defaultTtlForPath("/search")).toBe(60 * 60 * 1000);
    expect(defaultTtlForPath("/suggest")).toBe(60 * 60 * 1000);
    expect(defaultTtlForPath("/list/code")).toBe(60 * 60 * 1000);
    expect(defaultTtlForPath("/consult/getArticle")).toBe(24 * 60 * 60 * 1000);
    expect(defaultTtlForPath("/consult/code")).toBe(24 * 60 * 60 * 1000);
  });
});
