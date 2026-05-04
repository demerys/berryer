#!/usr/bin/env bash
# package-cowork.sh — produit un .zip autonome par plugin pour upload Cowork.
#
# Cowork "Upload plugin" attend un .zip qui contient le dossier plugin avec
# .claude-plugin/plugin.json à la racine. Le serveur MCP du plugin doit être
# autonome car le poste du testeur n'a pas le monorepo.
#
# Le script :
#   1. Bundle @berryer/core directement dans mcp-server/dist/index.js (via
#      esbuild) - plus besoin de @berryer/core dans node_modules
#   2. Copie node_modules/better-sqlite3 (binding natif, non bundlable) dans
#      le plugin mcp-server/node_modules/
#   3. Zippe le tout
#
# Sortie : dist-pkg/<plugin>-vX.Y.Z.zip pour chaque plugin
#
# Usage : bash scripts/package-cowork.sh [plugin-name]
#   - sans argument : produit les 3 zips
#   - avec argument : produit uniquement le plugin nommé
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
VERSION=$(node -p "require('./package.json').version")
PKG_DIR="dist-pkg"
mkdir -p "$PKG_DIR"

PLUGINS=(berryer berryer-affaires berryer-social)
if [[ $# -ge 1 ]]; then
  PLUGINS=("$1")
fi

# 1. Build initial du core (pour avoir packages/core/dist/index.js)
echo "▶ Build core…"
(cd packages/core && npm run build > /dev/null)

for plugin in "${PLUGINS[@]}"; do
  PLUGIN_DIR="plugins/$plugin"
  if [[ ! -d "$PLUGIN_DIR" ]]; then
    echo "❌ $PLUGIN_DIR n'existe pas."
    continue
  fi

  echo ""
  echo "════════════════════════════════════════════"
  echo "▶ Packaging $plugin v$VERSION"
  echo "════════════════════════════════════════════"

  # 2. Bundle le serveur MCP avec esbuild (inline @berryer/core et toutes les
  #    deps JS, externalize seulement better-sqlite3 qui est natif)
  echo "▶ Bundle esbuild…"
  npx esbuild "$PLUGIN_DIR/mcp-server/src/index.ts" \
    --bundle \
    --platform=node \
    --target=node20 \
    --format=esm \
    --outfile="$PLUGIN_DIR/mcp-server/dist/index.js" \
    --external:better-sqlite3 \
    --banner:js='import { createRequire } from "module"; const require = createRequire(import.meta.url);' \
    --log-level=warning

  # 3. Préparer le staging dir
  STAGE="$PKG_DIR/$plugin-v$VERSION"
  rm -rf "$STAGE" "$PKG_DIR/$plugin-v$VERSION.zip"
  mkdir -p "$STAGE"

  # 4. Copier le plugin (sans node_modules, sans src/)
  echo "▶ Copie du plugin…"
  rsync -a \
    --exclude='node_modules/' \
    --exclude='.cache/' \
    --exclude='*.db' \
    --exclude='*.db-*' \
    --exclude='*.tsbuildinfo' \
    --exclude='mcp-server/src/' \
    "$PLUGIN_DIR/" "$STAGE/"

  # 5. Copier better-sqlite3 (et ses deps natives) dans node_modules du plugin.
  #    npm workspaces hoist différemment selon la version : on cherche
  #    better-sqlite3 dans plusieurs emplacements possibles.
  echo "▶ Copie de better-sqlite3 (binding natif)…"
  mkdir -p "$STAGE/mcp-server/node_modules"
  BSQ_SRC=""
  for candidate in node_modules/better-sqlite3 packages/core/node_modules/better-sqlite3; do
    if [[ -d "$candidate" ]]; then
      BSQ_SRC="$candidate"
      break
    fi
  done
  if [[ -z "$BSQ_SRC" ]]; then
    echo "❌ better-sqlite3 introuvable. Lance npm install d'abord." >&2
    exit 1
  fi
  rsync -a "$BSQ_SRC" "$STAGE/mcp-server/node_modules/"
  # better-sqlite3 dépend de bindings et file-uri-to-path
  for dep in bindings file-uri-to-path; do
    for cand in "node_modules/$dep" "packages/core/node_modules/$dep"; do
      if [[ -d "$cand" ]]; then
        rsync -a "$cand" "$STAGE/mcp-server/node_modules/"
        break
      fi
    done
  done

  # 6. Créer un README_BETA dans le zip
  cat > "$STAGE/README_BETA.md" <<EOF
# $plugin v$VERSION — distribution Cowork

Plugin autonome de la suite Berryer (DEMERYS INVESTMENT). Bundle complet,
prêt pour upload dans Claude Cowork.

## Installation Cowork

1. Claude Desktop → Cowork → Customize
2. Bouton + → **Upload plugin** → sélectionnez ce fichier .zip
3. Configurez vos credentials PISTE :
   - Décompressez le zip si vous voulez utiliser le script :
     \`\`\`
     node scripts/setup-credentials.mjs
     \`\`\`
   - OU saisissez vos credentials directement dans le formulaire Cowork
     si proposé

4. Premier test : tapez \`piste_status\` dans une conversation Cowork

## Pré-requis

- Node.js ≥ 20 sur votre poste (https://nodejs.org/fr)
- Compte PISTE avec souscription API Légifrance (https://piste.gouv.fr)
- Abonnement Claude Pro/Max/Team/Enterprise

## Confidentialité

Vos credentials et requêtes ne quittent jamais votre poste. Le serveur
MCP tourne localement. Aucune visibilité Demerys ni Anthropic.

## Support

contact@demerys.com — https://demerys.com
EOF

  # 7. Zip final
  echo "▶ Création du zip…"
  (cd "$PKG_DIR" && zip -rq "$plugin-v$VERSION.zip" "$plugin-v$VERSION")
  SIZE=$(du -h "$PKG_DIR/$plugin-v$VERSION.zip" | cut -f1)
  echo "✅ $PKG_DIR/$plugin-v$VERSION.zip ($SIZE)"

  # 8. Test rapide du bundle : tools/list via stdio
  echo "▶ Test du bundle…"
  TEST_OUTPUT=$(cd "$STAGE/mcp-server" && node -e '
    const { spawn } = require("child_process");
    const p = spawn("node", ["dist/index.js"], {
      env: { ...process.env, LOG_LEVEL: "error", PISTE_CLIENT_ID: "test", PISTE_CLIENT_SECRET: "test" },
      stdio: ["pipe", "pipe", "pipe"]
    });
    let buf = "";
    let done = false;
    p.stdout.on("data", c => {
      buf += c.toString();
      const lines = buf.split("\n");
      for (const l of lines) {
        if (!l.trim()) continue;
        try {
          const r = JSON.parse(l);
          if (r.id === 2 && r.result && r.result.tools) {
            console.log("OK:" + r.result.tools.length);
            done = true;
            p.kill();
            process.exit(0);
          }
        } catch {}
      }
    });
    p.stdin.write(JSON.stringify({jsonrpc:"2.0",id:1,method:"initialize",params:{protocolVersion:"2024-11-05",capabilities:{},clientInfo:{name:"t",version:"0"}}}) + "\n");
    p.stdin.write(JSON.stringify({jsonrpc:"2.0",id:2,method:"tools/list",params:{}}) + "\n");
    setTimeout(() => { if (!done) { console.log("TIMEOUT"); p.kill(); process.exit(1); } }, 5000);
  ' 2>&1 | grep -E "^(OK:|TIMEOUT|FAIL)" | head -1)

  if [[ "$TEST_OUTPUT" =~ ^OK:([0-9]+) ]]; then
    echo "  ✅ Bundle expose ${BASH_REMATCH[1]} tools"
  else
    echo "  ⚠️  Bundle problème : $TEST_OUTPUT"
  fi

  # Cleanup staging
  rm -rf "$STAGE"
done

echo ""
echo "════════════════════════════════════════════"
echo "▶ Zips produits dans $PKG_DIR/ :"
ls -lh "$PKG_DIR"/*.zip 2>&1 | awk '{print "   ", $9, "(", $5, ")"}'
echo ""
echo "▶ Pour upload Cowork :"
echo "   Claude Desktop → Cowork → Customize → + → Upload plugin"
echo "   → sélectionnez l'un des zips ci-dessus"
