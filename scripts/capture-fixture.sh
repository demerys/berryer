#!/usr/bin/env bash
# capture-fixture.sh — capture une réponse réelle de l'API Légifrance pour servir
# de fixture aux tests vitest. Évite la divergence entre le Swagger (potentiellement
# obsolète) et la vraie réponse PISTE.
#
# Usage :
#   bash scripts/capture-fixture.sh <method> <path> <body-json> <fixture-name>
# Exemple :
#   bash scripts/capture-fixture.sh POST /consult/getArticle \
#     '{"id":"LEGIARTI000006417707"}' article-1240-code-civil
#
set -euo pipefail

if [[ $# -lt 4 ]]; then
  echo "Usage: $0 <METHOD> <PATH> <BODY_JSON> <FIXTURE_NAME>" >&2
  exit 2
fi

METHOD="$1"
API_PATH="$2"
BODY="$3"
NAME="$4"

if [[ -z "${PISTE_CLIENT_ID:-}" || -z "${PISTE_CLIENT_SECRET:-}" ]]; then
  echo "❌ PISTE_CLIENT_ID et PISTE_CLIENT_SECRET requis." >&2
  exit 2
fi

PISTE_ENV="${PISTE_ENV:-production}"
case "$PISTE_ENV" in
  sandbox)
    OAUTH_URL="https://sandbox-oauth.piste.gouv.fr/api/oauth/token"
    API_BASE="https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app"
    ;;
  *)
    OAUTH_URL="https://oauth.piste.gouv.fr/api/oauth/token"
    API_BASE="https://api.piste.gouv.fr/dila/legifrance/lf-engine-app"
    ;;
esac

TOKEN=$(curl -sS -X POST "$OAUTH_URL" \
  -H "content-type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "client_id=$PISTE_CLIENT_ID" \
  --data-urlencode "client_secret=$PISTE_CLIENT_SECRET" \
  --data-urlencode "scope=openid" \
  | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

if [[ -z "$TOKEN" ]]; then
  echo "❌ Échec OAuth." >&2
  exit 1
fi

DEST_DIR="$(cd "$(dirname "$0")/.." && pwd)/mcp-server/test/fixtures"
mkdir -p "$DEST_DIR"
DEST="$DEST_DIR/$NAME.json"

echo "▶ $METHOD $API_BASE$API_PATH"
if [[ "$METHOD" == "GET" ]]; then
  curl -sS -X GET "$API_BASE$API_PATH" \
    -H "authorization: Bearer $TOKEN" \
    -H "accept: application/json" \
    | python3 -m json.tool > "$DEST"
else
  echo "  body: $BODY"
  curl -sS -X "$METHOD" "$API_BASE$API_PATH" \
    -H "authorization: Bearer $TOKEN" \
    -H "content-type: application/json" \
    -H "accept: application/json" \
    -d "$BODY" \
    | python3 -m json.tool > "$DEST"
fi

echo "✅ Fixture sauvegardée : $DEST"
echo "▶ Aperçu :"
head -30 "$DEST"
