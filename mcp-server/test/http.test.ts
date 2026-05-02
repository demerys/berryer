import { describe, it, expect, beforeEach } from "vitest";
import { MockAgent, setGlobalDispatcher } from "undici";
import { PisteClient } from "../src/piste-client.js";
import { PisteHttpClient, PisteApiError, PisteForbiddenError } from "../src/http.js";
import { ResponseCache } from "../src/cache.js";
import type { Config } from "../src/config.js";

const config: Config = {
  clientId: "id",
  clientSecret: "secret",
  env: "production",
  oauthTokenUrl: "https://oauth.piste.gouv.fr/api/oauth/token",
  apiBaseUrl: "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app",
  cacheDir: "/tmp/test",
};

function makeAgent() {
  const agent = new MockAgent();
  agent.disableNetConnect();
  setGlobalDispatcher(agent);
  return agent;
}

function stubOAuth(agent: MockAgent, persist = true) {
  const interceptor = agent
    .get("https://oauth.piste.gouv.fr")
    .intercept({ path: "/api/oauth/token", method: "POST" })
    .reply(200, { access_token: "tk", token_type: "Bearer", expires_in: 3600 });
  if (persist) interceptor.persist();
}

describe("PisteHttpClient — gestion des erreurs et retries", () => {
  let agent: MockAgent;
  beforeEach(() => {
    agent = makeAgent();
    stubOAuth(agent);
  });

  it("retourne le body JSON sur 200", async () => {
    agent
      .get("https://api.piste.gouv.fr")
      .intercept({ path: "/dila/legifrance/lf-engine-app/consult/getArticle", method: "POST" })
      .reply(200, { article: { id: "X" } });

    const auth = new PisteClient(config, agent);
    const http = new PisteHttpClient(config, auth, { dispatcher: agent });
    const res = await http.post<{ article: { id: string } }>("/consult/getArticle", { id: "X" });
    expect(res.article.id).toBe("X");
  });

  it("re-auth après un 401 et retente une fois", async () => {
    const pool = agent.get("https://api.piste.gouv.fr");
    pool.intercept({ path: "/dila/legifrance/lf-engine-app/consult/getArticle", method: "POST" }).reply(401, "");
    pool
      .intercept({ path: "/dila/legifrance/lf-engine-app/consult/getArticle", method: "POST" })
      .reply(200, { ok: true });

    const auth = new PisteClient(config, agent);
    const http = new PisteHttpClient(config, auth, { dispatcher: agent });
    const res = await http.post<{ ok: boolean }>("/consult/getArticle", {});
    expect(res.ok).toBe(true);
  });

  it("lève PisteForbiddenError sur 403 (pas de retry)", async () => {
    agent
      .get("https://api.piste.gouv.fr")
      .intercept({ path: "/dila/legifrance/lf-engine-app/consult/getArticle", method: "POST" })
      .reply(403, "subscription required");

    const auth = new PisteClient(config, agent);
    const http = new PisteHttpClient(config, auth, { dispatcher: agent });
    await expect(http.post("/consult/getArticle", {})).rejects.toBeInstanceOf(PisteForbiddenError);
  });

  it("backoff sur 429 puis succès", async () => {
    const pool = agent.get("https://api.piste.gouv.fr");
    pool.intercept({ path: "/dila/legifrance/lf-engine-app/search", method: "POST" }).reply(429, "");
    pool.intercept({ path: "/dila/legifrance/lf-engine-app/search", method: "POST" }).reply(429, "");
    pool
      .intercept({ path: "/dila/legifrance/lf-engine-app/search", method: "POST" })
      .reply(200, { results: [] });

    const auth = new PisteClient(config, agent);
    const sleeps: number[] = [];
    const http = new PisteHttpClient(config, auth, {
      dispatcher: agent,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
    });
    const res = await http.post<{ results: unknown[] }>("/search", {});
    expect(res.results).toEqual([]);
    expect(sleeps).toEqual([1000, 2000]); // exponential backoff: 2^0, 2^1
  });

  it("cache hit : 2e appel n'atteint pas le réseau", async () => {
    // L'intercept ne répond qu'une fois. Si http.post fait un 2e appel, ça plantera.
    agent
      .get("https://api.piste.gouv.fr")
      .intercept({ path: "/dila/legifrance/lf-engine-app/consult/getArticle", method: "POST" })
      .reply(200, { article: { id: "X" } });

    const auth = new PisteClient(config, agent);
    const cache = new ResponseCache({ path: ":memory:" });
    const http = new PisteHttpClient(config, auth, { dispatcher: agent, cache });

    const r1 = await http.post<{ article: { id: string } }>("/consult/getArticle", { id: "X" });
    const r2 = await http.post<{ article: { id: string } }>("/consult/getArticle", { id: "X" });
    expect(r1.article.id).toBe("X");
    expect(r2.article.id).toBe("X");
    expect(cache.stats()).toMatchObject({ totalRows: 1, hits: 1 });
    cache.close();
  });

  it("retry sur 5xx (1 fois) puis remonte l'erreur si 2e échec", async () => {
    const pool = agent.get("https://api.piste.gouv.fr");
    pool.intercept({ path: "/dila/legifrance/lf-engine-app/search", method: "POST" }).reply(500, "boom");
    pool.intercept({ path: "/dila/legifrance/lf-engine-app/search", method: "POST" }).reply(503, "still down");

    const auth = new PisteClient(config, agent);
    const http = new PisteHttpClient(config, auth, {
      dispatcher: agent,
      sleep: async () => {},
    });
    await expect(http.post("/search", {})).rejects.toBeInstanceOf(PisteApiError);
  });
});
