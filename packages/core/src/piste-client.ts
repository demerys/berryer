import { request, type Dispatcher } from "undici";
import { log } from "./logger.js";
import type { Config } from "./config.js";

interface CachedToken {
  accessToken: string;
  refreshAt: number; // epoch ms
}

interface OAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

const REFRESH_MARGIN_MS = 10 * 60 * 1000; // 10 min before expiry

export class PisteCredentialsMissingError extends Error {
  constructor() {
    super(
      "Credentials PISTE manquants. Définissez PISTE_CLIENT_ID et PISTE_CLIENT_SECRET (Légifrance/PISTE).",
    );
    this.name = "PisteCredentialsMissingError";
  }
}

export class PisteAuthError extends Error {
  constructor(public status: number, body: string) {
    super(`Échec de l'authentification PISTE (HTTP ${status}). Vérifiez vos credentials. Détail : ${body}`);
    this.name = "PisteAuthError";
  }
}

export class PisteClient {
  private cached: CachedToken | undefined;

  constructor(
    private config: Config,
    private dispatcher?: Dispatcher,
  ) {}

  /**
   * Returns a valid access token, refreshing if needed.
   * Throws if credentials are missing or auth fails.
   */
  async getAccessToken(force = false): Promise<string> {
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new PisteCredentialsMissingError();
    }

    if (!force && this.cached && Date.now() < this.cached.refreshAt) {
      return this.cached.accessToken;
    }

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: "openid",
    }).toString();

    log.debug("piste oauth: requesting token", { url: this.config.oauthTokenUrl });

    const res = await request(this.config.oauthTokenUrl, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json",
      },
      body,
      dispatcher: this.dispatcher,
    });

    const text = await res.body.text();
    if (res.statusCode !== 200) {
      log.error("piste oauth failed", { status: res.statusCode, body: text.slice(0, 500) });
      throw new PisteAuthError(res.statusCode, text.slice(0, 500));
    }

    const json = JSON.parse(text) as OAuthResponse;
    const expiresInMs = json.expires_in * 1000;
    const refreshAt = Date.now() + Math.max(expiresInMs - REFRESH_MARGIN_MS, 30_000);
    this.cached = { accessToken: json.access_token, refreshAt };
    log.info("piste oauth: token acquired", {
      expiresInSec: json.expires_in,
      refreshInSec: Math.round((refreshAt - Date.now()) / 1000),
    });
    return json.access_token;
  }

  /** Force a token refresh on next call (used after 401). */
  invalidateToken() {
    this.cached = undefined;
  }

  /** For tests/diagnostics. */
  getTokenInfo(): { hasToken: boolean; refreshInSec: number | null } {
    if (!this.cached) return { hasToken: false, refreshInSec: null };
    return {
      hasToken: true,
      refreshInSec: Math.max(0, Math.round((this.cached.refreshAt - Date.now()) / 1000)),
    };
  }
}
