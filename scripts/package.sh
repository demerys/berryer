#!/usr/bin/env bash
# package.sh — produit un .zip versionné de la suite Berryer pour distribution
# beta privée. Contient le monorepo complet (3 plugins + core + scripts) avec
# les builds TS frais, mais sans node_modules.
#
# Utilisateur à la réception :
#   1. décompresser
#   2. npm install (à la racine du monorepo) - installe les workspaces
#   3. node plugins/<plugin>/scripts/setup-credentials.mjs
#   4. claude --plugin-dir plugins/<plugin>  OU upload dans Cowork
#
# Usage : bash scripts/package.sh [version]
#   - sans argument : utilise la version du marketplace.json
#   - avec argument : utilise la version passée
#
# Sortie : dist-pkg/berryer-suite-v<version>.zip
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

# 1. Lire la version depuis marketplace.json
if [[ $# -ge 1 ]]; then
  VERSION="$1"
else
  VERSION=$(node -p "require('./.claude-plugin/marketplace.json').metadata.version")
fi
echo "▶ Version : $VERSION"

# 2. Build frais de tous les workspaces (core + 3 plugins)
echo "▶ npm install + build de tous les workspaces…"
npm install --no-fund --no-audit --silent
npm run build > /dev/null

# 3. Vérifier que les 3 dist/ existent
for plugin in berryer berryer-affaires berryer-social; do
  if [[ ! -f "plugins/$plugin/mcp-server/dist/index.js" ]]; then
    echo "❌ plugins/$plugin/mcp-server/dist/index.js manquant. Stop." >&2
    exit 1
  fi
done
if [[ ! -f packages/core/dist/index.js ]]; then
  echo "❌ packages/core/dist/index.js manquant. Stop." >&2
  exit 1
fi

# 4. Préparer le dossier de packaging
PKG_DIR="dist-pkg"
PKG_NAME="berryer-suite-v$VERSION"
PKG_PATH="$PKG_DIR/$PKG_NAME"
rm -rf "$PKG_PATH" "$PKG_DIR/$PKG_NAME.zip"
mkdir -p "$PKG_PATH"

# 5. Copier le monorepo (rsync exclut le bruit et les outils dev)
echo "▶ Copie du monorepo dans ${PKG_PATH}…"
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
  --exclude='*.tsbuildinfo' \
  --exclude='packages/core/test/' \
  --exclude='docs/' \
  --exclude='SPEC_*.md' \
  --exclude='scripts/package.sh' \
  --exclude='scripts/capture-fixture.sh' \
  --exclude='scripts/setup.sh' \
  --exclude='CLAUDE.md' \
  ./ "$PKG_PATH/"

# 6. Vérifier que les builds sont bien dans le zip
for plugin in berryer berryer-affaires berryer-social; do
  if [[ ! -f "$PKG_PATH/plugins/$plugin/mcp-server/dist/index.js" ]]; then
    echo "❌ Build de $plugin manquant dans le package. Stop." >&2
    exit 1
  fi
done

# 7. Ajouter un README_BETA.md dédié à la suite
cat > "$PKG_PATH/README_BETA.md" <<EOF
# Suite Berryer v$VERSION — distribution beta privée

Vous recevez ce package dans le cadre d'un programme de test privé. Il contient **3 plugins** indépendants que vous pouvez installer séparément ou ensemble :

- **berryer** (généraliste) — agents Dupin, Cassin, Colbert, Portalis, David
- **berryer-affaires** (droit des affaires) — agents Thaller, Ripert, Houin, Guyon
- **berryer-social** (droit du travail) — agents Durand, Lyon-Caen, Despax, Camerlynck

Tous partagent le même \`core\` (client PISTE, cache, tools Légifrance) et les mêmes credentials.

## Installation — étape 1 : Node.js

Vérifiez que Node.js ≥ 20 est installé :
\`\`\`
node --version
\`\`\`

Si manquant : installeur LTS sur https://nodejs.org/fr (4 clics).

## Installation — étape 2 : extraire et installer les dépendances

1. Décompressez ce dossier où vous voulez (ex: \`~/berryer-suite\`).
2. Ouvrez un terminal dans ce dossier :
   - **macOS** : Finder → clic droit → « Nouveau terminal au dossier »
   - **Windows** : Explorateur → barre d'adresse → \`cmd\` puis Entrée
   - **Linux** : clic droit → « Ouvrir dans un terminal »
3. Lancez :
   \`\`\`
   npm install
   \`\`\`
   (installe les dépendances des 3 plugins via npm workspaces, ~30 sec)

## Installation — étape 3 : configurer vos credentials PISTE (une seule fois)

\`\`\`
node plugins/berryer/scripts/setup-credentials.mjs
\`\`\`

Saisissez votre Client ID et Client Secret PISTE. Le script écrit \`~/.config/berryer/credentials.json\` (lecture restreinte) — partagé entre les 3 plugins, pas besoin de le refaire.

## Installation — étape 4 : choisir votre plugin

### Vous êtes avocat généraliste / cabinet pluri-disciplinaire
\`\`\`
claude --plugin-dir plugins/berryer
\`\`\`
Ou dans Cowork : Customize → + → Upload plugin → sélectionnez le dossier \`plugins/berryer\`.

### Vous êtes spécialiste droit des affaires
\`\`\`
claude --plugin-dir plugins/berryer-affaires
\`\`\`

### Vous êtes spécialiste droit du travail
\`\`\`
claude --plugin-dir plugins/berryer-social
\`\`\`

### Cabinet pluri-disciplinaire qui veut TOUS les plugins
Pour Cowork : uploadez chaque sous-dossier l'un après l'autre. Pour Claude Code : utilisez la marketplace locale :
\`\`\`
claude
> /plugin marketplace add /chemin/vers/berryer-suite-v$VERSION
> /plugin install berryer
> /plugin install berryer-affaires
> /plugin install berryer-social
\`\`\`

## Premier test

Une fois le plugin installé, dans une conversation :
\`\`\`
piste_status
\`\`\`
Doit retourner \`"diagnostic": "✅ Plugin opérationnel"\`. Puis testez selon votre plugin :

- **berryer** : \`/berryer:recherche article 1240 code civil\`
- **berryer-affaires** : \`/berryer-affaires:audit-clause "votre clause anglo-saxonne"\`
- **berryer-social** : \`/berryer-social:ccn métallurgie\`

## Bugs et retours

Voir le fichier **plugins/berryer/BETA_TESTING.md** ou contacter contact@demerys.com avec en objet \`[BERRYER BETA] <résumé>\`.
EOF

# 8. Créer le zip
echo "▶ Création du zip…"
(cd "$PKG_DIR" && zip -rq "$PKG_NAME.zip" "$PKG_NAME")
SIZE=$(du -h "$PKG_DIR/$PKG_NAME.zip" | cut -f1)
echo "✅ Package : $PKG_DIR/$PKG_NAME.zip ($SIZE)"

# 9. Liste rapide du contenu
echo ""
echo "▶ Contenu (top-level) :"
unzip -l "$PKG_DIR/$PKG_NAME.zip" | head -25

echo ""
echo "▶ À envoyer aux beta testeurs :"
echo "   $PKG_DIR/$PKG_NAME.zip"
echo "   + plugins/berryer/BETA_TESTING.md (guide testeur)"
echo "   + plugins/berryer/BETA_INVITATION.md (3 variantes de mail)"
