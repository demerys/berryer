# Scénarios E2E cross-plugin — Suite Berryer V0.2.0

Quatre scénarios manuels à exécuter dans Claude Code (ou Cowork) une fois les 3 plugins installés. Ils valident que les plugins **coexistent et coopèrent** dans une même session.

> Pré-requis : les 3 plugins (`berryer`, `berryer-affaires`, `berryer-social`) installés via marketplace ou `--plugin-dir`. Credentials PISTE configurés via `setup-credentials.mjs` (partagés).

## Validation automatisée préalable (déjà passée)

```
✅ berryer: 10 tools, get_article retourne Article 1240 (C. civ.)
✅ berryer-affaires: 10 tools, get_article retourne Article L225-38 (C. com.)
✅ berryer-social: 10 tools, get_article retourne Article L1234-9 (C. trav.)
```

Les 3 plugins exposent chacun les 10 tools Légifrance attendus, namespaces distincts, et répondent à un appel article réel.

---

## Scénario 1 — Question généraliste

**Prompt** :
> Quel est le texte exact de l'article 1240 du Code civil ? Donne-moi aussi 3 arrêts récents de la Cour de cassation qui l'appliquent en matière de responsabilité du fait personnel.

**Comportement attendu** :
- Tool `legifrance_get_article` du plugin `berryer` (ou n'importe lequel — tous ont accès au Code civil) → texte de l'art. 1240
- Délégation à **Cassin** (plugin généraliste) pour la jurisprudence
- 3 arrêts cités au format `Cass. civ. 2e, JJ mois AAAA, n° XX-XX.XXX, FS-B+R`, avec attendus en blockquote

**Critères de réussite** :
- ✅ Texte exact (pas paraphrasé)
- ✅ 3 arrêts vérifiables sur Légifrance via les liens
- ✅ Format de citation rigoureux (skill **gény** chargé)

---

## Scénario 2 — Question droit des affaires pure

**Prompt** :
> Mon client veut signer une lettre d'intention pour racheter un fonds de commerce. Donne-moi la structure type, les 5 clauses incontournables, et les principaux risques côté acquéreur.

**Comportement attendu** :
- Délégation à **Thaller** (plugin affaires) pour la rédaction
- Charge le skill **demogue** pour la grille de risque
- Citations art. L. 141-1 et s. C. com. (mentions obligatoires de la cession), L. 145-1 et s. (bail commercial éventuel), 1626 C. civ. (garantie d'éviction)
- Tableau de risque structuré (5 colonnes : risque / niveau / probabilité / mitigation / clause à insérer)

**Critères de réussite** :
- ✅ Délégation à `berryer:thaller` visible dans la trace
- ✅ Skill demogue chargé
- ✅ 5+ clauses incontournables identifiées avec base légale
- ✅ Au moins 4 risques principaux listés (passif fiscal, salariés transférés, droit de préemption commune, GAP insuffisante, etc.)

---

## Scénario 3 — Question droit du travail pure

**Prompt** :
> Mon client a été licencié pour motif économique sans entretien préalable et son employeur n'a pas consulté le CSE alors qu'il y a 25 salariés. Quel motif réel ? Quel chiffrage de mes demandes prud'homales ?

**Comportement attendu** :
- Délégation à **Durand** (droit individuel — qualification de la rupture)
- Délégation à **Lyon-Caen** (rapports collectifs — défaut de consultation CSE)
- Charge le skill **rouast** pour la structure de note prud'homale
- Identification des irrégularités : absence d'entretien préalable (L. 1232-2 — irrégularité de procédure), défaut de consultation CSE alors qu'effectif ≥ 11 (mais consultation CSE seulement obligatoire pour licenciement éco si effectif ≥ 50, à vérifier)
- Chiffrage : indemnité de licenciement (L. 1234-9), indemnité de préavis (L. 1234-1), indemnité conventionnelle (selon CCN), indemnité pour absence de cause réelle et sérieuse (barème Macron L. 1235-3), indemnité pour licenciement nul si défaut de consultation CSE caractérisé

**Critères de réussite** :
- ✅ Délégations à Durand + Lyon-Caen visibles
- ✅ Skill rouast chargé (structure faits / qualification / motif / chiffrage / probabilité)
- ✅ Citation barème Macron L. 1235-3 avec montants en mois de salaire
- ✅ Mention de la nécessité d'identifier la CCN (délégation possible à Despax)

---

## Scénario 4 — Question pluri-disciplinaire (le test décisif)

**Prompt** :
> Mon client cède sa SAS de 80 salariés à un fonds d'investissement. Il y a un salarié protégé (membre du CSE). Quels risques ? Étapes à anticiper côté droit des sociétés ET côté droit du travail ?

**Comportement attendu** : **chaînage cross-plugin**

- Côté société (`berryer-affaires`) :
  - **Guyon** : modalités de cession des actions, transfert du contrôle, conventions réglementées potentielles, GAP à insérer
  - **Houin** si la cible est en difficulté (peu probable ici mais à vérifier)

- Côté travail (`berryer-social`) :
  - **Lyon-Caen** : le transfert L. 1224-1 ne s'applique PAS à une cession d'actions (la société continue, contrats inchangés). Mais **information-consultation du CSE** obligatoire avant la cession (L. 2312-39 — projet de modification de l'organisation économique). Délais préfix.
  - **Lyon-Caen** : le **salarié protégé** ne nécessite pas d'autorisation pour le simple changement de contrôle (pas de rupture). Mais s'il y a réorganisation post-cession → autorisation préalable de l'inspection du travail nécessaire pour tout licenciement (L. 2411-1 et s.).
  - **Durand** : pas de modification du contrat sans accord du salarié (Cass. soc. constante).

- Délégation possible à **Colbert** (plugin généraliste) si la dimension fiscale apparaît (régime mère-fille, plus-value de cession, droits d'enregistrement).

**Critères de réussite** :
- ✅ Au moins 2 plugins invoqués dans la même réponse (`berryer-affaires:guyon` ET `berryer-social:lyon-caen`)
- ✅ Distinction claire L. 1224-1 (ne s'applique pas) vs information-consultation CSE (s'applique)
- ✅ Mention spécifique du statut salarié protégé et de ses implications post-cession
- ✅ Suggestion de délégation cross-plugin si la question dérive (vers Colbert pour le fiscal, par exemple)

---

## Que faire si un scénario échoue ?

1. **L'agent attendu n'est pas invoqué** → enrichir la `description` du frontmatter de l'agent pour inclure plus de mots-clés correspondant au prompt.
2. **Le skill n'est pas chargé** → enrichir la `description` du skill avec la situation déclencheuse explicite.
3. **Citation incorrecte** → c'est le test ultime de la règle anti-hallucination du skill `gény` / `rouast`. Si l'agent invente, c'est un bug de doc système à corriger.
4. **Conflit de namespace** → vérifier que le frontmatter `tools:` de chaque agent utilise bien `mcp__plugin_<plugin>_<server>__*`.

---

## Reporting des résultats

Quand vous exécutez ces scénarios, notez :
- Durée d'exécution
- Erreurs PISTE éventuelles
- Écarts entre attendu et réel (à utiliser pour ajuster les agents et skills)
- Qualité de la chaîne pluri-disciplinaire (scénario 4) — c'est le différenciant produit le plus fort
