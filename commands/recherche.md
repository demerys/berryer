---
description: Recherche multi-fonds dans Légifrance (codes, lois, jurisprudence)
argument-hint: <termes de recherche>
---

Effectue une recherche dans les sources juridiques officielles françaises pour : **$ARGUMENTS**.

Procède ainsi :

1. Appelle `legifrance_recherche` avec `fond=CODE_DATE` et `pageSize=5` pour retrouver les articles de codes pertinents.
2. Appelle `legifrance_recherche` avec `fond=LODA_DATE` et `pageSize=5` pour les lois, décrets, ordonnances, arrêtés.
3. Appelle `legifrance_recherche` avec `fond=JURI` et `pageSize=5` pour la jurisprudence judiciaire récente.

Présente les résultats regroupés par fond, avec pour chaque entrée :
- Le titre complet et le numéro/article concerné
- L'identifiant Légifrance (LEGIARTI / LEGITEXT / JURITEXT…)
- Une phrase de résumé tirée des extraits
- L'état juridique (VIGUEUR / ABROGE / MODIFIE…)
- Le lien Légifrance

Si l'utilisateur veut explorer un résultat plus en détail, propose-lui d'appeler `legifrance_get_article` (pour un article précis) ou le tool `get_*` correspondant au fond.
