---
name: demogue
description: Méthodologie de note de risque transactionnel pour opérations en droit des affaires (M&A, joint-venture, refinancement, cession de fonds de commerce, partenariat commercial structurant). À charger pour produire une grille de risque structurée — qualification, identification des points de vigilance, scoring, mitigations possibles. Inspiré de René Demogue (1872-1938), théoricien des obligations dans la pratique des affaires, qui posait l'analyse contractuelle en termes de risque-bénéfice à une époque où le droit la formulait encore en termes de cause et d'objet.
---

# Skill Demogue — Note de risque transactionnel

Tu produis une **grille de risque** structurée sur une opération en cours de négociation. C'est l'outil de référence d'un avocat d'affaires lors d'une due diligence, d'une revue de term sheet ou d'une analyse pré-signing. La grille donne au client une vision **scorée et actionnable** des risques.

## Structure obligatoire

### 1. Qualification de l'opération
2-3 lignes : nature juridique de l'opération (cession de droits sociaux ? fonds de commerce ? actif ? joint-venture ?), parties, périmètre. Choix entre régime fiscal A vs B s'il y en a un.

### 2. Inventaire des risques
Tableau à 6 colonnes :

| # | Catégorie | Description du risque | Niveau (1-5) | Probabilité | Mitigation possible |
|---|---|---|---|---|---|

**Échelle de niveau** :
- **5 — critique** : peut faire échouer l'opération ou exposer à un risque illimité (dol, fraude, vice caché majeur, interdiction réglementaire)
- **4 — élevé** : conséquences financières lourdes (> 10 % de la valeur de l'opération)
- **3 — modéré** : conséquences gérables si anticipées (5-10 %)
- **2 — faible** : risque résiduel, à mentionner pour traçabilité (< 5 %)
- **1 — informatif** : ne nécessite pas d'action mais doit être consigné

**Catégories standard** (adapter selon l'opération) :
- **Juridique structurel** : forme sociale inadaptée, autorisations manquantes, défaut de capacité
- **Contractuel** : clauses sensibles, garanties insuffisantes, conditions suspensives mal calibrées
- **Fiscal** : régime applicable, optimisations possibles, contentieux fiscaux pendants
- **Social / RH** : représentation du personnel, transferts de contrats, salariés protégés, plans sociaux
- **Réglementaire** : autorisations sectorielles (ARS, AMF, ACPR, ANSM…), contrôle des concentrations
- **Litiges en cours / passés** : contentieux pendants, prescriptions interrompues, jugements non exécutés
- **Propriété intellectuelle** : titularité, contrats de licence, IP créée par les salariés
- **Données / RGPD** : transferts internationaux, sous-traitants, consentements
- **Environnemental** : ICPE, sols pollués, garanties financières
- **Financement** : covenants, sûretés, sort des financements en cas de cession
- **Gouvernance post-opération** : pactes d'associés, droits réservés, gestion des minoritaires

### 3. Synthèse priorisée
Liste des 3-5 risques les plus structurants (niveau 4-5), avec une recommandation d'action immédiate pour chacun.

### 4. Conditions suspensives suggérées
Liste opérationnelle des CP à inscrire dans le SPA / contrat-cadre pour neutraliser les risques élevés (autorisations administratives, audits complémentaires, levée de sûretés, etc.).

### 5. Stratégie de négociation
2-3 lignes pour chaque côté :
- **Côté client cessionnaire/acquéreur** : ce qu'il faut **obtenir** (cap, seuil, durée de survie GAP, déclarations spécifiques) et ce qu'il faut **éviter** (clauses « best efforts », clauses pénales asymétriques).
- **Côté client cédant/cible** : ce qu'il faut **donner** (déclarations standard, GAP plafonnée) et ce qu'il faut **refuser** (responsabilité illimitée, GAP sans cap, clauses de recouvrement automatique).

## Règles d'or

1. **Aucun risque sans source** : chaque ligne du tableau doit pouvoir être justifiée par un texte (article du Code, jurisprudence, doctrine BOFiP) ou par une pièce du dossier (contrat, courrier, rapport d'expertise). Si tu n'as pas la source, écris « source à confirmer » et invite à interroger le tool Légifrance ou à demander la pièce au client.

2. **Niveau et probabilité indépendants** : un risque de niveau 5 peut avoir une probabilité faible (10-30 %) — il reste à signaler. Un risque de niveau 2 avec probabilité 90 % peut nécessiter une action.

3. **Mitigation toujours actionnable** : ne pas écrire « surveiller » ou « être vigilant ». Écrire : « inclure une clause spécifique de garantie sur ce point, plafond X, durée Y », ou « obtenir copie du jugement n° XXX et l'inclure en pièce annexe », ou « solliciter un rescrit fiscal LPF L. 80 B avant signature ».

4. **Pas d'avis subjectif** : la grille reste factuelle. L'avocat décide ensuite du seuil d'acceptabilité. Tu peux écrire « risque significatif » mais pas « inacceptable » ou « à éviter absolument ».

5. **Date d'arrêt du droit applicable** : mentionner explicitement « Au [date], les dispositions applicables sont… ». La fiscalité et la doctrine BOFiP changent vite.

## Cas spécifiques

### Audit de clause isolée (sans deal complet)
Si l'utilisateur soumet une seule clause (ex : clause d'indemnification d'un SaaS Delaware), produire un mini-tableau ciblé : **risques liés à cette clause** uniquement, **mitigation par contre-rédaction**. Mentionner systématiquement la **gouvernance** du contrat (droit applicable, juridiction compétente) car elle conditionne l'analyse.

### Term sheet international
Croiser obligatoirement avec l'agent **david** (plugin généraliste) si installé, pour signaler les faux-amis common law / civil law (consideration, indemnification ≠ indemnisation, liquidated damages vs clause pénale modulable, etc.).

### Cession de fonds de commerce
Vérifier les mentions obligatoires (art. L. 141-1 C. com.) — leur omission rend la cession annulable. Vérifier le respect du droit de préemption commune (L. 214-1 et s. C. urb.). Consulter le PLU si zone réglementée.

### Cession de droits sociaux
GAP obligatoire à analyser : durée de survie, plafonds (cap), seuils (basket / threshold), exclusions (carve-outs : impôts, environnement, salaire des dirigeants), modalités de mise en œuvre (notification, délai de réponse, expertise contradictoire).

## Format de sortie

Markdown structuré. Tableau de risque central. Citations des textes applicables en blockquote. Liens Légifrance pour chaque référence. Synthèse priorisée pour exécutive summary client. Toujours terminer par un **disclaimer** de l'avocat : « Cette analyse est établie au regard des éléments communiqués au [date] et ne constitue pas un avis définitif. Toute évolution probatoire et l'examen exhaustif du dossier sont susceptibles de modifier l'appréciation du risque. »
