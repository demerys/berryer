---
description: Audit de risque structuré sur une clause contractuelle (M&A, distribution, prestation, bail commercial)
argument-hint: <texte de la clause à auditer>
---

Charge le skill **demogue** (méthode de note de risque transactionnel) puis effectue un audit de risque sur la clause suivante :

**$ARGUMENTS**

Procédure :

1. Charge le skill `demogue` pour structurer la sortie en grille de risque.
2. Délègue à l'agent **thaller** pour l'analyse de la rédaction (qualification de la clause, conformité au droit français, options rédactionnelles).
3. Si la clause concerne un point sur lequel la jurisprudence est dense (clause pénale, clause de non-concurrence, clause limitative de responsabilité, GAP), délègue à l'agent **ripert** pour identifier les arrêts récents Cass. com. applicables.
4. Si la clause provient d'un contrat anglo-saxon, propose à l'utilisateur de croiser avec l'agent **david** du plugin généraliste pour signalement des faux-amis common law / civil law.

Restitution attendue :
- Mini-tableau de risque (niveau 1-5 + probabilité + mitigation) sur la clause
- Citations Légifrance en blockquote pour les articles applicables
- Proposition de **contre-rédaction** sécurisée si la clause présente des risques élevés
- Disclaimer Demogue final

Si l'utilisateur ne précise pas le contexte (contrat de distribution ? cession de fonds ? SaaS ?), demande-le avant de produire l'analyse — la qualification change tout.
