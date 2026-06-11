#!/usr/bin/env node
/*
 * setup-credentials.mjs — assistant interactif cross-platform pour configurer
 * les credentials PISTE (Client ID + Client Secret) du plugin berryer.
 * Marche sur macOS, Linux, Windows.
 *
 * Usage : node scripts/setup-credentials.mjs
 *
 * Le serveur MCP lit les credentials soit depuis l'env (PISTE_CLIENT_ID /
 * PISTE_CLIENT_SECRET), soit depuis ~/.config/berryer/credentials.json.
 * Ce script écrit le fichier en mode 0600 (sur POSIX) — sur Windows, il
 * s'appuie sur les ACL NTFS qui restreignent par défaut le dossier home
 * à l'utilisateur courant.
 */

import { existsSync, mkdirSync, writeFileSync, chmodSync } from "node:fs";
import { homedir, platform } from "node:os";
import { resolve } from "node:path";
import { createInterface } from "node:readline";

const CONFIG_DIR = resolve(homedir(), ".config", "berryer");
const CONFIG_FILE = resolve(CONFIG_DIR, "credentials.json");
const IS_WINDOWS = platform() === "win32";

const banner = `
╔═══════════════════════════════════════════════════════════════╗
║  Berryer — Configuration des credentials PISTE                ║
╚═══════════════════════════════════════════════════════════════╝

Ce script va vous guider pour configurer vos credentials PISTE
(Client ID + Client Secret) une fois pour toutes. Aucune donnée
n'est envoyée sur Internet — sauf un test de connexion à PISTE
en fin de configuration.

Vous trouvez ces credentials sur https://piste.gouv.fr →
Mes applications → votre application → onglet Identifiants.
`;

console.log(banner);

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((res) => rl.question(question, (answer) => res(answer)));
}

/** Saisie masquée — pas d'écho des caractères tapés (pour le secret). */
function askSecret(question) {
  return new Promise((res) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    let captured = "";
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (key) => {
      // Ctrl+C
      if (key === "") {
        stdin.setRawMode?.(false);
        stdin.pause();
        process.stdout.write("\n");
        process.exit(130);
      }
      // Enter
      if (key === "\r" || key === "\n") {
        stdin.setRawMode?.(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        res(captured);
        return;
      }
      // Backspace
      if (key === "" || key === "\b") {
        if (captured.length > 0) {
          captured = captured.slice(0, -1);
          process.stdout.write("\b \b");
        }
        return;
      }
      captured += key;
      process.stdout.write("•");
    };
    stdin.on("data", onData);
  });
}

async function main() {
  // 1. Détection config existante
  if (existsSync(CONFIG_FILE)) {
    console.log(`⚠️  Une configuration existe déjà : ${CONFIG_FILE}`);
    const confirm = await ask("    L'écraser ? [y/N] ");
    if (!/^[yYoO]$/.test(confirm.trim())) {
      console.log("    Abandon. Aucune modification.");
      rl.close();
      process.exit(0);
    }
  }

  // 2. Client ID
  const clientId = (await ask("\n▸ PISTE_CLIENT_ID : ")).trim();
  if (!clientId) {
    console.error("❌ Client ID vide, abandon.");
    rl.close();
    process.exit(1);
  }
  if (clientId.startsWith("${")) {
    console.error(
      "❌ Vous avez collé une chaîne de template (${...}) au lieu de la vraie valeur.",
    );
    console.error(
      "   Allez sur piste.gouv.fr et copiez la valeur EXACTE du Client ID.",
    );
    rl.close();
    process.exit(1);
  }

  // 3. Client Secret (masqué) — readline ne marche pas pour la saisie masquée,
  //    on doit fermer rl pendant qu'on lit en raw mode.
  rl.pause();
  const clientSecret = await askSecret("▸ PISTE_CLIENT_SECRET (saisie masquée) : ");
  rl.resume();
  if (!clientSecret) {
    console.error("❌ Client Secret vide, abandon.");
    rl.close();
    process.exit(1);
  }

  // 4. Environnement
  let envChoice = (
    await ask("\n▸ Environnement [production/sandbox] (défaut: production) : ")
  )
    .trim()
    .toLowerCase();
  if (!envChoice) envChoice = "production";
  if (envChoice !== "production" && envChoice !== "sandbox") {
    console.error("❌ Environnement invalide (attendu: production ou sandbox).");
    rl.close();
    process.exit(1);
  }

  rl.close();

  // 5. Écriture du fichier
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
    if (!IS_WINDOWS) {
      try {
        chmodSync(CONFIG_DIR, 0o700);
      } catch {
        /* best-effort */
      }
    }
  }

  const payload = {
    PISTE_CLIENT_ID: clientId,
    PISTE_CLIENT_SECRET: clientSecret,
    PISTE_ENV: envChoice,
  };
  writeFileSync(CONFIG_FILE, JSON.stringify(payload, null, 2) + "\n");
  if (!IS_WINDOWS) {
    try {
      chmodSync(CONFIG_FILE, 0o600);
    } catch {
      /* best-effort */
    }
  }

  // 6. Test rapide du token via fetch natif (Node 18+)
  console.log("\n▸ Test de connexion à PISTE…");
  const oauthUrl =
    envChoice === "sandbox"
      ? "https://sandbox-oauth.piste.gouv.fr/api/oauth/token"
      : "https://oauth.piste.gouv.fr/api/oauth/token";
  try {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "openid",
    }).toString();
    const res = await fetch(oauthUrl, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json",
      },
      body,
    });
    if (res.status === 200) {
      console.log("  ✅ OAuth PISTE OK (HTTP 200).");
    } else {
      console.log(`  ⚠️  OAuth PISTE a répondu HTTP ${res.status}.`);
      console.log(
        "      - 401 : credentials invalides → vérifiez le Client ID/Secret",
      );
      console.log("      - 403 : application possiblement désactivée");
      console.log("      - autre : voir https://status.piste.gouv.fr");
      console.log("      Le fichier de configuration a été sauvegardé malgré tout.");
    }
  } catch (err) {
    console.log(
      `  ⚠️  Impossible de joindre PISTE pour le test : ${err instanceof Error ? err.message : String(err)}`,
    );
    console.log("      Le fichier a été sauvegardé. Réseau coupé ?");
  }

  // 7. Récap
  console.log(`
═══════════════════════════════════════════════════════════════
✅ Configuration enregistrée :
   Fichier      : ${CONFIG_FILE}
   Permissions  : ${IS_WINDOWS ? "ACL NTFS (héritées du dossier utilisateur)" : "0600 (lecture/écriture pour vous uniquement)"}
   Environnement : ${envChoice}

Prochaines étapes :
   1. Quittez Claude Code/Cowork complètement (Cmd+Q sur macOS,
      ou Quitter dans le menu Fichier sur Windows)
   2. Relancez Claude Code/Cowork
   3. Tapez "piste_status" dans une conversation pour vérifier

Pour modifier ces credentials plus tard, relancez ce script
ou éditez directement le fichier de configuration.

Pour les supprimer : ${IS_WINDOWS ? `del "${CONFIG_FILE}"` : `rm ${CONFIG_FILE}`}
═══════════════════════════════════════════════════════════════
`);
}

main().catch((err) => {
  console.error("❌ Erreur :", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
