#!/usr/bin/env bash
# verify-piste.sh — vérifie que les credentials PISTE permettent d'obtenir un token
# et d'appeler l'API Légifrance. À lancer avec PISTE_CLIENT_ID + PISTE_CLIENT_SECRET en env.
set -euo pipefail

if [[ -z "${PISTE_CLIENT_ID:-}" || -z "${PISTE_CLIENT_SECRET:-}" ]]; then
  echo "❌ PISTE_CLIENT_ID et PISTE_CLIENT_SECRET doivent être définis." >&2
  exit 2
fi

PISTE_ENV="${PISTE_ENV:-production}"
case "$PISTE_ENV" in
  sandbox)
    OAUTH_URL="https://sandbox-oauth.piste.gouv.fr/api/oauth/token"
    API_BASE="https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app"
    ;;
  production)
    OAUTH_URL="https://oauth.piste.gouv.fr/api/oauth/token"
    API_BASE="https://api.piste.gouv.fr/dila/legifrance/lf-engine-app"
    ;;
  *)
    echo "❌ PISTE_ENV doit être 'production' ou 'sandbox' (reçu: $PISTE_ENV)" >&2
    exit 2
    ;;
esac

echo "▶ Environnement : $PISTE_ENV"
echo "▶ OAuth URL : $OAUTH_URL"

TOKEN_JSON=$(curl -sS -X POST "$OAUTH_URL" \
  -H "content-type: application/x-www-form-urlencoded" \
  -H "accept: application/json" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "client_id=$PISTE_CLIENT_ID" \
  --data-urlencode "client_secret=$PISTE_CLIENT_SECRET" \
  --data-urlencode "scope=openid")

ACCESS_TOKEN=$(echo "$TOKEN_JSON" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

if [[ -z "$ACCESS_TOKEN" ]]; then
  echo "❌ Impossible d'obtenir un token. Réponse :" >&2
  echo "$TOKEN_JSON" >&2
  exit 1
fi

echo "✅ Token obtenu (${#ACCESS_TOKEN} caractères)"

echo "▶ Appel /misc/commitId pour vérifier la connectivité API…"
COMMIT_RESP=$(curl -sS -w "\n__HTTP__%{http_code}" -X GET "$API_BASE/misc/commitId" \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "accept: application/json")

HTTP_CODE=$(echo "$COMMIT_RESP" | sed -n 's/.*__HTTP__\([0-9]*\)$/\1/p')
BODY=$(echo "$COMMIT_RESP" | sed 's/__HTTP__[0-9]*$//')

echo "▶ HTTP $HTTP_CODE"
echo "▶ Body : $BODY"

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "❌ L'API ne répond pas correctement. Vérifiez la souscription Légifrance sur piste.gouv.fr." >&2
  exit 1
fi

echo "✅ Connectivité PISTE/Légifrance OK."
