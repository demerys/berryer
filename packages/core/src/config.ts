import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { log } from "./logger.js";

export type PisteEnv = "production" | "sandbox";

export interface Config {
  clientId: string | undefined;
  clientSecret: string | undefined;
  env: PisteEnv;
  oauthTokenUrl: string;
  apiBaseUrl: string;
  cacheDir: string;
  /** Source des credentials, pour le diagnostic (env / file / none). */
  credentialsSource: "env" | "file" | "none";
}

interface CredentialsFile {
  PISTE_CLIENT_ID?: string;
  PISTE_CLIENT_SECRET?: string;
  PISTE_ENV?: PisteEnv;
}

/**
 * Charge un fichier credentials JSON sous ~/.config/berryer/credentials.json
 * (ou $BERRYER_CREDENTIALS_FILE pour les tests). Mode 0600 attendu - on log
 * un warning si lisible par d'autres mais on accepte quand même.
 */
function loadCredentialsFile(): CredentialsFile | undefined {
  const path =
    process.env.BERRYER_CREDENTIALS_FILE ??
    resolve(homedir(), ".config", "berryer", "credentials.json");
  if (!existsSync(path)) return undefined;
  try {
    const content = readFileSync(path, "utf-8");
    return JSON.parse(content) as CredentialsFile;
  } catch (err) {
    log.warn("credentials file unreadable", {
      path,
      err: err instanceof Error ? err.message : String(err),
    });
    return undefined;
  }
}

/**
 * Cowork (Claude Desktop) ne substitue pas les placeholders `${VAR}` du bloc
 * `env` d'un `.mcp.json` quand la variable n'est pas dans l'env du processus.
 * Au lieu de passer une string vide, il passe la chaîne littérale `${VAR}` au
 * MCP server. Sans cette détection, le loader croit que la variable est
 * définie et ne fallback pas sur `~/.config/berryer/credentials.json`.
 */
function cleanEnv(v: string | undefined): string | undefined {
  if (!v) return undefined;
  if (/^\$\{[^}]+\}$/.test(v)) return undefined;
  return v;
}

export function loadConfig(): Config {
  // 1. Source primaire : variables d'environnement (Claude Code lancé depuis
  //    un shell qui source ~/.zshrc, ou env passées via .mcp.json).
  let clientId = cleanEnv(process.env.PISTE_CLIENT_ID);
  let clientSecret = cleanEnv(process.env.PISTE_CLIENT_SECRET);
  let envOverride = cleanEnv(process.env.PISTE_ENV);
  let source: "env" | "file" | "none" = clientId && clientSecret ? "env" : "none";

  // 2. Fallback : fichier ~/.config/berryer/credentials.json
  //    Cas typique : Cowork sur macOS lancé en GUI, qui ne source pas ~/.zshrc
  //    et n'a donc pas accès aux env vars définies par l'utilisateur.
  if (source === "none") {
    const fileCreds = loadCredentialsFile();
    if (fileCreds) {
      clientId = clientId ?? fileCreds.PISTE_CLIENT_ID;
      clientSecret = clientSecret ?? fileCreds.PISTE_CLIENT_SECRET;
      envOverride = envOverride ?? fileCreds.PISTE_ENV;
      if (clientId && clientSecret) source = "file";
    }
  }

  const env: PisteEnv = envOverride === "sandbox" ? "sandbox" : "production";
  const oauthTokenUrl =
    env === "sandbox"
      ? "https://sandbox-oauth.piste.gouv.fr/api/oauth/token"
      : "https://oauth.piste.gouv.fr/api/oauth/token";
  const apiBaseUrl =
    env === "sandbox"
      ? "https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app"
      : "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app";

  return {
    clientId,
    clientSecret,
    env,
    oauthTokenUrl,
    apiBaseUrl,
    cacheDir: process.env.CACHE_DIR ?? `${process.cwd()}/.cache`,
    credentialsSource: source,
  };
}
