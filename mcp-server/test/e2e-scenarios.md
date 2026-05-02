# Scénarios end-to-end — plugin berryer

Trois scénarios manuels à exécuter dans Claude Code (ou Cowork) une fois le plugin installé et les credentials PISTE configurés. Ils couvrent les cas réalistes d'usage par un avocat / expert-comptable.

> Ces tests sont **manuels** et nécessitent une connexion réelle à PISTE. Ils ne sont pas exécutés par vitest. Pour la suite automatisée, voir `npm test`.

## Préparation

```bash
export PISTE_CLIENT_ID=…
export PISTE_CLIENT_SECRET=…
bash scripts/verify-piste.sh   # doit afficher ✅
claude --plugin-dir /Users/thomas/code/claude/plugins/berryer
```

Dans Claude Code, vérifier que le plugin charge :
- `/plugin` → `berryer` listé, onglet **Errors** vide
- `piste_status` → `{"ok": true, "env": "production", …}`

---

## Scénario 1 — Article + jurisprudence associée

**Prompt** :
> Trouve-moi l'article 1240 du Code civil et la jurisprudence de la Cour de cassation de 2023-2024 qui l'applique. Donne-moi 5 décisions pertinentes.

**Comportement attendu** :
1. Claude appelle `legifrance_get_article` avec `code="Code civil"` + `num="1240"` → texte intégral renvoyé.
2. Claude délègue à l'agent **cassin** pour la jurisprudence (ou enchaîne directement avec `legifrance_recherche fond=JURI query="article 1240 responsabilité fait personnel" dateDebut="2023-01-01"`).
3. Cassin renvoie 5 arrêts récents avec attendu de principe en blockquote, citation rigoureuse (Cass. civ. 2e, …, n° …), et lien Légifrance pour chacun.
4. Présentation finale : article + tableau des arrêts + synthèse de l'orientation jurisprudentielle.

**Critères de réussite** :
- ✅ Texte exact de l'article 1240 (pas de paraphrase)
- ✅ 5 arrêts publiés en 2023 ou 2024 (vérifier la date)
- ✅ Citations au format français rigoureux (skill **gény**)
- ✅ Lien Légifrance fonctionnel pour chaque référence

---

## Scénario 2 — Veille thématique

**Prompt** :
> Veille sur les modifications du Code de la consommation depuis 2024.

**Comportement attendu** :
1. Claude délègue à l'agent **dupin**.
2. Dupin appelle `legifrance_recherche fond=LODA_DATE` avec `dateDebut="2024-01-01"` et `query` ciblée sur la consommation (ou `nature=["LOI", "ORDONNANCE", "DECRET"]`).
3. Pour chaque modification identifiée, `legifrance_get_loda` ou `legifrance_get_jorf` pour récupérer titre exact, NOR, articles touchés.
4. Restitution sous forme de tableau chronologique : date sign. / date JO / texte / nature / NOR / articles touchés / objet.
5. Synthèse en 3-5 lignes au-dessus du tableau (« 4 modifications majeures sur la période, dont 2 portent sur le démarchage à domicile… »).

**Critères de réussite** :
- ✅ Tableau chronologique trié de la plus ancienne à la plus récente (ou inverse)
- ✅ NOR systématiquement présent
- ✅ Lien Légifrance pour chaque texte
- ✅ Pas d'invention — toutes les modifications sont vérifiables

---

## Scénario 3 — Analyse fiscale (CGI + BOFiP)

**Prompt** :
> Analyse fiscale du régime micro-BNC en 2026. Je veux connaître les seuils, les conditions d'application, et les conséquences en TVA.

**Comportement attendu** :
1. Claude délègue à l'agent **colbert**.
2. Colbert appelle :
   - `legifrance_get_article code="CGI" num="102 ter"` (régime micro-BNC, seuils)
   - `legifrance_get_article code="CGI" num="293 B"` (franchise en base TVA, seuils)
   - `legifrance_recherche fond=CIRC query="micro-BNC"` pour identifier la fiche BOFiP
   - `legifrance_get_circulaire id="BOI-BNC-DECLA-…"` pour la doctrine
3. Colbert produit une analyse structurée :
   - Qualification (BNC, régime spécial)
   - Texte CGI (cité en blockquote)
   - Doctrine BOFiP (citée en blockquote, avec date de publication)
   - Application au cas d'espèce (seuils 2026, franchise TVA, abattement forfaitaire 34 %)
   - Risques / points d'attention
   - Conclusion + invitation au rescrit (LPF L. 80 B)

**Critères de réussite** :
- ✅ Le CGI **et** le BOFiP sont cités (jamais l'un sans l'autre — règle fondatrice de l'agent Colbert)
- ✅ Date de publication de la fiche BOFiP visible
- ✅ Disclaimer rescrit présent
- ✅ Seuils chiffrés à jour (vérifier contre la dernière LF)

---

## Scénario bonus — chaînage complet

**Prompt** :
> Je dois faire une note pour un client sur la responsabilité du fait des choses (art. 1242 al. 1). Recherche-moi la jurisprudence récente, vérifie s'il y a eu des modifications du texte, et rédige une note de synthèse.

**Comportement attendu** : enchaînement **dupin** (modifications du texte) → **cassin** (jurisprudence) → **portalis** + skill **domat** (rédaction de la note finale, intégrant les retours des deux premiers).

---

## Reporting des résultats

Quand vous exécutez ces scénarios, notez dans un fichier de transcript :
- La durée d'exécution (proxy de la qualité du cache)
- Les éventuelles erreurs Légifrance (403 = souscription manquante, 429 = rate limit, 5xx = serveur)
- Les écarts entre la sortie attendue et la sortie réelle (à utiliser pour ajuster les descriptions des agents si la délégation auto ne se déclenche pas)
