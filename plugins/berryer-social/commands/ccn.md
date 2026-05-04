---
description: Identifier la convention collective applicable à une activité ou un IDCC + dispositions clés
argument-hint: <activité, code APE, ou IDCC>
---

Charge le skill **rouast** (méthodologie sociale, étape 1 — détermination de la CCN) puis identifie la convention collective pour :

**$ARGUMENTS**

Procédure :

1. Charge le skill `rouast`.
2. Délègue à l'agent **despax** pour la recherche dans le fond `KALI` :
   - Si l'utilisateur a fourni un IDCC à 4 chiffres → recherche directe
   - Si l'utilisateur a fourni un code APE → identifier la CCN candidate via le champ d'application
   - Si l'utilisateur a fourni une activité en clair → recherche par mots-clés et identification du champ d'application
3. Une fois la CCN identifiée, donner :
   - Le **libellé exact** de la CCN
   - L'**IDCC** (4 chiffres)
   - Le statut **étendue** (oui / non / partiellement) avec date du dernier arrêté d'extension
   - Le **champ d'application** principal (1-2 lignes)
   - Les **dispositions clés** récurrentes (préavis, indemnité de licenciement conventionnelle, salaires minimaux par coefficient si dans le bloc 1, durée du travail, congés conventionnels) — récupérables via `legifrance_get_loda` sur le LEGITEXT de la CCN.
4. Si plusieurs CCN candidates, présenter les 2-3 options en demandant à l'utilisateur de préciser l'activité réelle prépondérante.

Si la requête est ambiguë, demander à l'utilisateur :
- Le code APE
- L'effectif de l'entreprise
- L'activité principale en clair
- L'éventuelle existence d'accords d'entreprise dérogatoires
