export type PisteEnv = "production" | "sandbox";

export interface Config {
  clientId: string | undefined;
  clientSecret: string | undefined;
  env: PisteEnv;
  oauthTokenUrl: string;
  apiBaseUrl: string;
  cacheDir: string;
}

export function loadConfig(): Config {
  const env: PisteEnv = process.env.PISTE_ENV === "sandbox" ? "sandbox" : "production";
  const oauthTokenUrl =
    env === "sandbox"
      ? "https://sandbox-oauth.piste.gouv.fr/api/oauth/token"
      : "https://oauth.piste.gouv.fr/api/oauth/token";
  const apiBaseUrl =
    env === "sandbox"
      ? "https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app"
      : "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app";

  return {
    clientId: process.env.PISTE_CLIENT_ID,
    clientSecret: process.env.PISTE_CLIENT_SECRET,
    env,
    oauthTokenUrl,
    apiBaseUrl,
    cacheDir: process.env.CACHE_DIR ?? `${process.cwd()}/.cache`,
  };
}
