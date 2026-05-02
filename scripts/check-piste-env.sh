#!/usr/bin/env bash
# check-piste-env.sh — hook PreToolUse pour les tools Légifrance.
# Bloque l'appel si PISTE_CLIENT_ID ou PISTE_CLIENT_SECRET manquent,
# avec un message clair indiquant comment configurer.
set -euo pipefail

if [[ -z "${PISTE_CLIENT_ID:-}" ]]; then
  cat <<'EOF' >&2
❌ Le plugin berryer ne peut pas appeler Légifrance/PISTE :
   la variable d'environnement PISTE_CLIENT_ID est manquante.

Pour la définir :
  • Claude Cowork : ouvrir Customize → berryer → renseigner les credentials PISTE.
  • Claude Code   : exporter PISTE_CLIENT_ID et PISTE_CLIENT_SECRET dans votre shell
                    (.zshrc / .bashrc / variables système Windows).

Création des credentials : https://piste.gouv.fr → tableau de bord → applications
(souscrire à l'API Légifrance et BOFiP).
EOF
  exit 2
fi

if [[ -z "${PISTE_CLIENT_SECRET:-}" ]]; then
  echo "❌ Plugin berryer : PISTE_CLIENT_SECRET manquant. Voir piste.gouv.fr." >&2
  exit 2
fi

exit 0
