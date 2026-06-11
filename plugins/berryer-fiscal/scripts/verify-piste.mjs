#!/usr/bin/env node
/*
 * verify-piste.mjs — vérifie que les credentials PISTE permettent d'obtenir un
 * token et d'appeler l'API Légifrance. Cross-platform (macOS, Linux, Windows).
 *
 * Sources de credentials testées dans l'ordre :
 *   1. Variables d'env PISTE_CLIENT_ID / PISTE_CLIENT_SECRET
 *   2. Fichier ~/.config/berryer/credentials.json (créé par setup-credentials.mjs)
 *
 * Usage : node scripts/verify-piste.mjs
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

function loadCredentials() {
  // 1. Env
  if (process.env.PISTE_CLIENT_ID && process.env.PISTE_CLIENT_SECRET) {
    return {
      source: "env",
      clientId: process.env.PISTE_CLIENT_ID,
      clientSecret: process.env.PISTE_CLIENT_SECRET,
      env: process.env.PISTE_ENV ?? "production",
    };
  }
  // 2. File
  const path = resolve(homedir(), ".config", "berryer", "credentials.json");
  if (existsSync(path)) {
    try {
      const c = JSON.parse(readFileSync(path, "utf-8"));
      if (c.PISTE_CLIENT_ID && c.PISTE_CLIENT_SECRET) {
        return {
          source: "file",
          clientId: c.PISTE_CLIENT_ID,
          clientSecret: c.PISTE_CLIENT_SECRET,
          env: c.PISTE_ENV ?? "production",
        };
      }
    } catch {
      /* invalid file */
    }
  }
  return null;
}

async function main() {
  const creds = loadCredentials();
  if (!creds) {
    console.error("❌ Aucune source de credentials trouvée.");
    console.error("   Lancez d'abord : node scripts/setup-credentials.mjs");
    console.error("   Ou définissez PISTE_CLIENT_ID et PISTE_CLIENT_SECRET dans votre environnement.");
    process.exit(2);
  }

  console.log(`▶ Source des credentials : ${creds.source}`);
  console.log(`▶ Environnement : ${creds.env}`);

  const oauthUrl =
    creds.env === "sandbox"
      ? "https://sandbox-oauth.piste.gouv.fr/api/oauth/token"
      : "https://oauth.piste.gouv.fr/api/oauth/token";
  const apiBase =
    creds.env === "sandbox"
      ? "https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app"
      : "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app";

  console.log(`▶ OAuth URL : ${oauthUrl}`);

  // OAuth
  const oauthBody = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    scope: "openid",
  }).toString();

  let token;
  try {
    const res = await fetch(oauthUrl, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json",
      },
      body: oauthBody,
    });
    if (res.status !== 200) {
      const txt = await res.text();
      console.error(`❌ OAuth a répondu HTTP ${res.status} : ${txt.slice(0, 200)}`);
      process.exit(1);
    }
    const json = await res.json();
    token = json.access_token;
    console.log(`✅ Token obtenu (${token.length} caractères)`);
  } catch (err) {
    console.error(`❌ Erreur réseau lors de l'OAuth : ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  // API ping
  console.log("▶ Appel /misc/commitId pour vérifier la connectivité API…");
  try {
    const res = await fetch(`${apiBase}/misc/commitId`, {
      method: "GET",
      headers: { authorization: `Bearer ${token}`, accept: "application/json" },
    });
    const body = await res.text();
    console.log(`▶ HTTP ${res.status}`);
    console.log(`▶ Body : ${body.slice(0, 300)}`);
    if (res.status !== 200) {
      console.error("❌ L'API ne répond pas correctement. Vérifiez la souscription Légifrance sur piste.gouv.fr.");
      process.exit(1);
    }
    console.log("✅ Connectivité PISTE/Légifrance OK.");
  } catch (err) {
    console.error(`❌ Erreur réseau lors de l'appel API : ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main();
