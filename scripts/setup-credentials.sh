#!/usr/bin/env bash
# setup-credentials.sh — assistant de configuration des credentials PISTE
# pour le plugin Berryer. Usage type : un avocat lance ce script UNE FOIS
# après réception du package, il colle ses Client ID + Client Secret PISTE,
# le script stocke ça dans ~/.config/berryer/credentials.json (mode 0600).
#
# Le serveur MCP du plugin lit ce fichier en priorité si les env vars
# PISTE_CLIENT_ID / PISTE_CLIENT_SECRET ne sont pas définies dans l'env
# du process - ce qui est le cas par défaut quand Cowork est lancé en
# GUI sur macOS (le launcher GUI ne source pas ~/.zshrc).
#
# Usage : bash scripts/setup-credentials.sh
set -euo pipefail

CONFIG_DIR="$HOME/.config/berryer"
CONFIG_FILE="$CONFIG_DIR/credentials.json"

cat <<'BANNER'

╔═══════════════════════════════════════════════════════════════╗
║  Berryer — Configuration des credentials PISTE                ║
╚═══════════════════════════════════════════════════════════════╝

Ce script va vous guider pour configurer vos credentials PISTE
(Client ID + Client Secret) une fois pour toutes. Aucune donnée
n'est envoyée sur Internet — tout reste sur votre poste.

Vous trouvez ces credentials sur https://piste.gouv.fr →
Mes applications → votre application → onglet Identifiants.

BANNER

# 1. Detect existing config
if [[ -f "$CONFIG_FILE" ]]; then
  echo "⚠️  Une configuration existe déjà : $CONFIG_FILE"
  read -r -p "    L'écraser ? [y/N] " confirm
  if [[ ! "$confirm" =~ ^[YyOo]$ ]]; then
    echo "    Abandon. Aucune modification."
    exit 0
  fi
fi

# 2. Prompt for Client ID
echo ""
read -r -p "▸ PISTE_CLIENT_ID : " CLIENT_ID
if [[ -z "$CLIENT_ID" ]]; then
  echo "❌ Client ID vide, abandon." >&2
  exit 1
fi
if [[ "$CLIENT_ID" == \${env:* ]] || [[ "$CLIENT_ID" == \${* ]]; then
  echo "❌ Vous avez collé une chaîne de template (\${...}) au lieu de la vraie valeur." >&2
  echo "   Allez sur piste.gouv.fr et copiez la valeur EXACTE du Client ID." >&2
  exit 1
fi

# 3. Prompt for Client Secret (masqué)
read -r -s -p "▸ PISTE_CLIENT_SECRET (saisie masquée) : " CLIENT_SECRET
echo ""
if [[ -z "$CLIENT_SECRET" ]]; then
  echo "❌ Client Secret vide, abandon." >&2
  exit 1
fi

# 4. Environnement (production ou sandbox)
echo ""
read -r -p "▸ Environnement [production/sandbox] (défaut: production) : " PISTE_ENV
PISTE_ENV="${PISTE_ENV:-production}"
if [[ "$PISTE_ENV" != "production" && "$PISTE_ENV" != "sandbox" ]]; then
  echo "❌ Environnement invalide (attendu: production ou sandbox)." >&2
  exit 1
fi

# 5. Création du fichier en mode 0600
mkdir -p "$CONFIG_DIR"
chmod 700 "$CONFIG_DIR"
umask 077
cat > "$CONFIG_FILE" <<JSON
{
  "PISTE_CLIENT_ID": "$CLIENT_ID",
  "PISTE_CLIENT_SECRET": "$CLIENT_SECRET",
  "PISTE_ENV": "$PISTE_ENV"
}
JSON
chmod 600 "$CONFIG_FILE"

# 6. Test rapide du token (optionnel mais utile)
echo ""
echo "▸ Test de connexion à PISTE…"
case "$PISTE_ENV" in
  sandbox) OAUTH_URL="https://sandbox-oauth.piste.gouv.fr/api/oauth/token" ;;
  *)       OAUTH_URL="https://oauth.piste.gouv.fr/api/oauth/token" ;;
esac

if ! command -v curl >/dev/null 2>&1; then
  echo "  curl non disponible, test de connexion sauté."
else
  RESP=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$OAUTH_URL" \
    -H "content-type: application/x-www-form-urlencoded" \
    --data-urlencode "grant_type=client_credentials" \
    --data-urlencode "client_id=$CLIENT_ID" \
    --data-urlencode "client_secret=$CLIENT_SECRET" \
    --data-urlencode "scope=openid" || echo "000")
  if [[ "$RESP" == "200" ]]; then
    echo "  ✅ OAuth PISTE OK (HTTP 200)."
  else
    echo "  ⚠️  OAuth PISTE a répondu HTTP $RESP."
    echo "      - 401 : credentials invalides → vérifiez le Client ID/Secret"
    echo "      - 403 : application possiblement désactivée"
    echo "      - autre : voir https://status.piste.gouv.fr"
    echo "      Le fichier de configuration a été sauvegardé malgré tout."
  fi
fi

# 7. Récap
cat <<EOF

═══════════════════════════════════════════════════════════════
✅ Configuration enregistrée :
   Fichier : $CONFIG_FILE
   Permissions : 600 (lecture/écriture pour vous uniquement)
   Environnement : $PISTE_ENV

Prochaines étapes :
   1. Quittez Claude Code/Cowork complètement (Cmd+Q sur macOS)
   2. Relancez Claude Code/Cowork
   3. Tapez "piste_status" dans une conversation pour vérifier

Pour modifier ces credentials plus tard, relancez ce script
ou éditez directement le fichier $CONFIG_FILE.

Pour les supprimer : rm $CONFIG_FILE
═══════════════════════════════════════════════════════════════

EOF
