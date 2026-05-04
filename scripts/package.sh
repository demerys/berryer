#!/usr/bin/env bash
# package.sh — produit un .zip versionné du plugin pour distribution beta privée
# (upload Cowork "Upload plugin" ou clone-via-zip pour Claude Code).
# Lance un build TS frais avant de zipper. Exclut .git, node_modules, .cache, *.db, .env.
#
# Usage : bash scripts/package.sh [version]
#   - sans argument : utilise la version de .claude-plugin/plugin.json
#   - avec argument : utilise la version passée
#
# Sortie : dist-pkg/berryer-v<version>.zip
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

# 1. Lire la version
if [[ $# -ge 1 ]]; then
  VERSION="$1"
else
  VERSION=$(node -p "require('./.claude-plugin/plugin.json').version")
fi
echo "▶ Version : $VERSION"

# 2. Build frais
echo "▶ Build du MCP server (npm install + tsc)…"
(cd mcp-server && npm install --no-fund --no-audit --silent && npm run build > /dev/null)

# 3. Vérifier que dist/ existe
if [[ ! -f mcp-server/dist/index.js ]]; then
  echo "❌ Le build n'a pas produit mcp-server/dist/index.js. Stop." >&2
  exit 1
fi

# 4. Préparer le dossier de packaging
PKG_DIR="dist-pkg"
PKG_NAME="berryer-v$VERSION"
PKG_PATH="$PKG_DIR/$PKG_NAME"
rm -rf "$PKG_PATH" "$PKG_DIR/$PKG_NAME.zip"
mkdir -p "$PKG_PATH"

# 5. Copier les fichiers utiles (rsync exclut le bruit)
echo "▶ Copie des fichiers utiles dans ${PKG_PATH}…"
rsync -a \
  --exclude='.git/' \
  --exclude='.git*' \
  --exclude='node_modules/' \
  --exclude='.cache/' \
  --exclude='*.db' \
  --exclude='*.db-*' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='.DS_Store' \
  --exclude='dist-pkg/' \
  --exclude='coverage/' \
  --exclude='*.log' \
  --exclude='mcp-server/test/' \
  --exclude='mcp-server/src/' \
  --exclude='docs/' \
  --exclude='SPEC_*.md' \
  --exclude='MARKETPLACE.md' \
  --exclude='CLAUDE.md' \
  ./ "$PKG_PATH/"

# 6. S'assurer que mcp-server/dist/ est bien dans le zip (rsync l'inclut par défaut)
if [[ ! -f "$PKG_PATH/mcp-server/dist/index.js" ]]; then
  echo "❌ dist/ manquant dans le package. Stop." >&2
  exit 1
fi

# 7. Ajouter un README_BETA.md dédié à l'install zip (court)
cat > "$PKG_PATH/README_BETA.md" <<EOF
# Berryer v$VERSION — distribution beta privée

Vous recevez ce package dans le cadre d'un programme de test privé.

## Installation rapide

### Vous utilisez Claude Cowork (UI graphique, sans terminal)

1. Ouvrez **Claude Desktop** → onglet **Cowork** → **Customize**
2. Bouton **+** → **Upload plugin** → sélectionnez ce dossier (ou son zip)
3. Le plugin **berryer** apparaît, cliquez **Install**
4. Saisissez vos credentials PISTE (Client ID + Client Secret) dans le formulaire
5. Premier test : tapez \`/berryer:recherche article 1240 code civil\`

### Vous utilisez Claude Code (terminal)

1. Décompressez ce dossier où vous voulez (ex: \`~/berryer\`)
2. Définissez vos credentials PISTE dans \`~/.zshrc\` (ou \`~/.bashrc\`) :
   \`\`\`bash
   export PISTE_CLIENT_ID="…"
   export PISTE_CLIENT_SECRET="…"
   \`\`\`
3. \`source ~/.zshrc\`
4. Lancez Claude Code en pointant vers le plugin :
   \`\`\`bash
   claude --plugin-dir ~/berryer
   \`\`\`
5. Premier test : \`/berryer:recherche article 1240 code civil\`

## Pré-requis communs

- Un **compte PISTE** ([piste.gouv.fr](https://piste.gouv.fr)) avec souscription aux API Légifrance et BOFiP
- Un abonnement Claude Pro/Max/Team/Enterprise (pour Cowork uniquement)

## Confidentialité — point important

Vos credentials et requêtes ne quittent **jamais** votre poste. Le serveur MCP du plugin tourne localement, vos requêtes partent en direct vers \`api.piste.gouv.fr\`. Aucune visibilité Demerys ni Anthropic.

## Bugs et retours

Voir le fichier **BETA_TESTING.md** ou contacter contact@demerys.com.
EOF

# 8. Créer le zip
echo "▶ Création du zip…"
(cd "$PKG_DIR" && zip -rq "$PKG_NAME.zip" "$PKG_NAME")
SIZE=$(du -h "$PKG_DIR/$PKG_NAME.zip" | cut -f1)
echo "✅ Package : $PKG_DIR/$PKG_NAME.zip ($SIZE)"

# 9. Liste rapide du contenu
echo ""
echo "▶ Contenu (top-level) :"
unzip -l "$PKG_DIR/$PKG_NAME.zip" | head -30

echo ""
echo "▶ À envoyer aux beta testeurs :"
echo "   $PKG_DIR/$PKG_NAME.zip"
echo "   + le fichier BETA_TESTING.md (à la racine du repo)"
echo "   + le mail d'invitation (BETA_INVITATION.md)"
