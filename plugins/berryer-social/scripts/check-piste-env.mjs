#!/usr/bin/env node
/*
 * check-piste-env.mjs — hook PreToolUse cross-platform.
 * Bloque l'appel d'un tool legifrance_* si aucune source de credentials
 * (env ou fichier ~/.config/berryer/credentials.json) n'est utilisable.
 * Affiche un message d'aide clair.
 *
 * Code de sortie :
 *   0 = OK (credentials disponibles)
 *   2 = blocage (credentials manquants — Claude Code remontera le message stderr)
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { resolve } from "node:path";

const IS_WINDOWS = platform() === "win32";
const SETUP_CMD = IS_WINDOWS
  ? "node scripts\\setup-credentials.mjs"
  : "node scripts/setup-credentials.mjs";

function hasEnvCreds() {
  return Boolean(process.env.PISTE_CLIENT_ID && process.env.PISTE_CLIENT_SECRET);
}

function hasFileCreds() {
  const path = resolve(homedir(), ".config", "berryer", "credentials.json");
  if (!existsSync(path)) return false;
  try {
    const c = JSON.parse(readFileSync(path, "utf-8"));
    return Boolean(c.PISTE_CLIENT_ID && c.PISTE_CLIENT_SECRET);
  } catch {
    return false;
  }
}

if (hasEnvCreds() || hasFileCreds()) {
  process.exit(0);
}

const msg = `❌ Le plugin berryer ne peut pas appeler Légifrance/PISTE :
   aucun credential trouvé (ni dans l'environnement, ni dans le fichier
   ~/.config/berryer/credentials.json).

Méthode la plus simple pour configurer :

   ${SETUP_CMD}

Ce script vous demande votre PISTE_CLIENT_ID et PISTE_CLIENT_SECRET,
les enregistre localement, et fait un test de connexion.

Création des credentials : https://piste.gouv.fr → tableau de bord →
applications → souscrire à l'API Légifrance et BOFiP.
`;

process.stderr.write(msg);
process.exit(2);
