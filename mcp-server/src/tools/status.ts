import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { request } from "undici";
import type { Config } from "../config.js";
import type { ResponseCache } from "../cache.js";
import type { PisteClient } from "../piste-client.js";
import type { PisteHttpClient } from "../http.js";

export function registerStatus(
  server: McpServer,
  config: Config,
  cache?: ResponseCache,
  auth?: PisteClient,
  http?: PisteHttpClient,
) {
  server.registerTool(
    "piste_status",
    {
      title: "État de la connexion PISTE (avec test OAuth + API live)",
      description:
        "Diagnostic complet du plugin berryer : config locale + test OAuth réel + test API Légifrance live. À utiliser dès qu'une erreur PISTE apparaît pour distinguer un problème de credentials, de souscription, ou un hoquet infra. Le test fait un vrai appel OAuth puis un /misc/commitId — mais ne fait PAS de search.",
      inputSchema: z.object({}).shape,
    },
    async () => {
      const result: Record<string, unknown> = {
        env: config.env,
        oauthTokenUrl: config.oauthTokenUrl,
        apiBaseUrl: config.apiBaseUrl,
        cacheDir: config.cacheDir,
        hasClientId: Boolean(config.clientId),
        hasClientSecret: Boolean(config.clientSecret),
        clientIdPrefix: config.clientId ? config.clientId.slice(0, 8) + "…" : null,
        cache: cache ? cache.stats() : null,
      };

      if (!config.clientId || !config.clientSecret) {
        result.diagnostic =
          "❌ Credentials PISTE manquants dans l'environnement du plugin. Vérifiez PISTE_CLIENT_ID et PISTE_CLIENT_SECRET.";
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      // 1. Test OAuth réel
      try {
        const body = new URLSearchParams({
          grant_type: "client_credentials",
          client_id: config.clientId,
          client_secret: config.clientSecret,
          scope: "openid",
        }).toString();
        const oauthRes = await request(config.oauthTokenUrl, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
          body,
        });
        const oauthBody = await oauthRes.body.text();
        result.oauth = {
          status: oauthRes.statusCode,
          ok: oauthRes.statusCode === 200,
          bodyPreview: oauthBody.slice(0, 200),
        };
        if (oauthRes.statusCode !== 200) {
          result.diagnostic = `❌ OAuth PISTE échoue avec HTTP ${oauthRes.statusCode}. ${
            oauthRes.statusCode === 401
              ? "Credentials invalides ou secret expiré (régénérer sur piste.gouv.fr)."
              : oauthRes.statusCode === 400
                ? "Requête OAuth malformée — vérifier que PISTE_CLIENT_ID est bien défini."
                : oauthRes.statusCode === 403
                  ? "Accès OAuth refusé — application possiblement désactivée côté DILA."
                  : "Erreur infrastructure PISTE."
          }`;
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
      } catch (err) {
        result.oauth = { error: err instanceof Error ? err.message : String(err) };
        result.diagnostic = "❌ Impossible de joindre l'OAuth PISTE (réseau ?).";
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      // 2. Test API live via /misc/commitId
      if (http) {
        try {
          const commit = await http.get<{ ["Build version"]?: string }>("/misc/commitId", {
            bypassCache: true,
          });
          result.apiLive = {
            ok: true,
            buildVersion: commit?.["Build version"] ?? null,
          };
        } catch (err) {
          result.apiLive = {
            ok: false,
            error: err instanceof Error ? err.message.slice(0, 300) : String(err),
          };
          result.diagnostic = "⚠️ OAuth OK mais API Légifrance répond en erreur. Voir apiLive.error.";
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
      }

      result.diagnostic = "✅ Plugin opérationnel : credentials, OAuth, API Légifrance — tout répond.";
      // void void to indicate the auth client is unused but not removed (it's wired
      // in case we want to test refresh logic later)
      void auth;
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );
}
