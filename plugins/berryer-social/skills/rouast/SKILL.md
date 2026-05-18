---
name: rouast
description: Méthodologie en 3 étapes pour le contentieux et les opérations en droit social français — détermination de la CCN applicable, structure d'une note prud'homale (faits qualifiés, motif de la rupture, chiffrage des indemnités, probabilité de succès), conventions de citation sociales rigoureuses (Cass. soc., CCN avec IDCC, accords d'entreprise). À charger systématiquement quand un agent du plugin social produit une note ou un avis. Inspiré d'André Rouast, classique du droit social français.
---

# Skill Rouast — Méthode du droit social

Tu produis des notes en droit social qui sont **directement utilisables** par un avocat prud'homaliste. La méthode tient en 3 étapes obligatoires.

## En-tête obligatoire de TOUTE note sociale

**Chaque note produite doit commencer par ce bandeau, sans exception.** Y compris pour les identifications simples de CCN. Il protège le lecteur contre les hallucinations résiduelles qu'aucun prompt n'empêche totalement.

> **⚠️ Note de recherche sociale — vérification finale par le professionnel**
>
> Cette note s'appuie sur les sources officielles consultées via l'API Légifrance (codes, fond KALI, jurisprudence Cass. soc.). Avant tout usage opérationnel — bulletin de paie, lettre de licenciement, négociation, dossier prud'homal — :
> 1. **Cliquer sur chaque lien Légifrance** cité pour ouvrir le texte source.
> 2. **Lire le titre du texte cible** et vérifier qu'il correspond bien à la **convention collective annoncée** (l'IDCC indiqué, par exemple coiffure IDCC 2596). Un KALITEXT valide peut renvoyer à un texte d'une CCN voisine (bricolage, tourisme social, esthétique…) — le titre seul fait foi.
> 3. **Confirmer la version en vigueur** à la date d'application visée. Les avenants salaires sont revalorisés 1 à 2 fois par an dans la plupart des branches.

## Étape 1 — Détermination de la CCN applicable

C'est l'erreur la plus fréquente : se tromper de CCN. Sans cette étape, l'analyse est incomplète.

### Procédure
1. **Code APE (NAF)** de l'entreprise — indice mais pas preuve
2. **Activité réelle prépondérante** — la CCN s'applique en fonction de l'activité réelle (Cass. soc. constante)
3. **Recherche dans le fond KALI** via `legifrance_recherche fond=KALI` pour identifier la CCN candidate
4. Vérification du **champ d'application** dans la CCN elle-même (1er article ou annexe)
5. Identification de l'**IDCC** (numéro à 4 chiffres, identifiant unique de la CCN)
6. Vérification du statut **étendue / non étendue** (arrêté d'extension JO)

### Si la CCN n'est pas identifiable avec certitude
- Le dire explicitement : « CCN à confirmer auprès du client (vérifier le bulletin de paie : mention obligatoire de la CCN — L. 3243-2 C. trav.) »
- Proposer 2-3 CCN candidates avec IDCC

## Étape 2 — Structure de la note prud'homale

Pour toute note destinée à un litige prud'homal, structure imposée :

### 1. Faits qualifiés juridiquement
5-10 lignes. Faits utiles à la qualification, ordre chronologique, vocabulaire neutre. Identifier :
- Le **type de contrat** (CDI/CDD/intérim/contrat aidé)
- L'**ancienneté** (date d'embauche, durée totale)
- La **CCN applicable** (cf. étape 1)
- L'**événement litigieux** (modification du contrat, licenciement, harcèlement, etc.)
- La **rémunération** (salaire de référence pour les calculs)

### 2. Qualification juridique du contrat
- CDI ? Si CDD ou intérim : conditions de recours (L. 1242-2 et s. ou L. 1251-6 et s.) — risque de requalification
- Cadre / non-cadre (impact sur durée du préavis, indemnité conventionnelle)
- Forfait jours / horaire (conditions de validité du forfait, JP Cass. soc. sur le contrôle de la charge de travail)

### 3. Motif réel et sérieux (ou absence)
Pour un licenciement contesté :
- Le motif énoncé dans la lettre de licenciement (lettre = limite à la motivation possible)
- Examen au regard des éléments factuels et de la JP applicable
- **Cause réelle** (faits objectifs, vérifiables) ET **cause sérieuse** (gravité justifiant la rupture)
- Si motif éco : caractère réel et sérieux du motif éco (L. 1233-3 : difficultés économiques, mutations technologiques, réorganisation pour sauvegarder la compétitivité, cessation d'activité)

### 4. Chiffrage des indemnités demandées
Tableau structuré :

| Demande | Base légale | Calcul | Montant |
|---|---|---|---|
| Indemnité de licenciement (légale ou conventionnelle, plus favorable) | L. 1234-9 + R. 1234-1 / CCN | … | € |
| Indemnité compensatrice de préavis | L. 1234-1 / CCN | … | € |
| Indemnité compensatrice de congés payés | L. 3141-28 | … | € |
| Indemnité licenciement sans cause réelle et sérieuse (barème Macron) | L. 1235-3 | Selon ancienneté + effectif | € |
| Rappel d'heures supplémentaires (3 ans) | L. 3245-1 | … | € |
| Dommages-intérêts (préjudice distinct) | art. 1240 C. civ. | … | € |
| Article 700 CPC | — | À l'appréciation | € |

### 5. Probabilité de succès
Échelle :
- **Très probable** : faits incontestables + jurisprudence claire
- **Probable** : faits favorables + JP tendant favorable
- **Discuté** : matière où la JP est divisée
- **Incertain** : peu de précédent, faits ambigus
- **Faible** : faits défavorables ou JP contraire

### 6. Stratégie procédurale (cf. Camerlynck si installé)
- Saisine BCO ou directement BJ ?
- Référé prud'homal pour les sommes incontestables (provisions sur salaires) ?
- Demandes additionnelles à anticiper côté employeur (compensation, demande reconventionnelle)

### 7. Disclaimer
> *Cette analyse est établie au regard des éléments communiqués au [date] et ne constitue pas un avis juridique définitif. Toute évolution probatoire et l'examen exhaustif du dossier sont susceptibles de modifier l'appréciation du risque.*

## Étape 3 — Conventions de citation sociales

**Avant toute citation, charge le skill `geny`** — c'est lui qui pose les conventions et la règle anti-hallucination absolue : un identifiant n'est cité que s'il a été retourné par un tool dans la session. Pas vu = pas cité.

**Rappel du format imposé (cf. geny)** : pour CHAQUE date d'avenant ou d'accord que tu cites, tu DOIS écrire le KALITEXT entre parenthèses immédiatement après. `Avenant du JJ mois AAAA` SEUL = interdit. `Avenant du JJ mois AAAA (KALITEXT000XXXXXXXX)` = OK. C'est la seule façon d'éviter le piège des « accords vrais mais d'une autre branche ».

Rappel du périmètre couvert par geny (à respecter intégralement) :

### Cass. soc.
Format : `Cass. soc., JJ mois AAAA, n° XX-XX.XXX, FS-B+R` (préciser la formation et la publication).

Exemples :
- `Cass. soc., 8 octobre 2025, n° 23-23.501, FS-B` (prescription transaction)
- `Cass. soc., 11 mai 2022, n° 21-15.247, FS-B+R+I` (barème Macron)
- `Cass. soc., 25 juin 2003, n° 01-42.679` (prise d'acte — fondateur)

### Conseil d'État (contentieux administratif du travail — autorisation salarié protégé, contestation PSE)
Format : `CE, [ass./sect./sous-sect.], JJ mois AAAA, n° XXXXXX`

Exemple : `CE, 22 mai 2019, Société ABC, n° 412345`

### Conventions collectives
Format : `Convention collective <libellé court> (IDCC <NNNN>)`, avec mention de l'avenant ou de l'arrêté d'extension le cas échéant.

Exemples :
- `Convention collective des bureaux d'études techniques, cabinets d'ingénieurs-conseils et sociétés de conseils — Syntec (IDCC 1486)`
- `Convention collective nationale de la métallurgie (IDCC 3248), avenant n° X du JJ mois AAAA`

### Accords d'entreprise
Format : `Accord d'entreprise du JJ mois AAAA conclu au sein de la société Y (déposé à la DREETS sous le n° T...)`

### Articles
- `art. L. 1234-9 C. trav.` (préciser L./R./D.)
- `art. R. 1454-9 C. trav.`
- `art. 2224 C. civ.` pour le droit civil applicable au social (transaction notamment)
- `art. L. 169 LPF` pour le contentieux du recouvrement social par l'URSSAF

### Règle d'or anti-hallucination (étendue à tous les identifiants)

**Aucun identifiant n'est cité s'il n'a pas été retourné par un tool dans la session** :
- arrêt → vérifié via `legifrance_get_jurisprudence` ou trouvé via `legifrance_recherche fond=JURI`
- article du Code du travail → vérifié via `legifrance_get_article` ou `legifrance_recherche fond=CODE_DATE`
- CCN, avenant, accord interpro → vérifié via `legifrance_get_loda` (par KALITEXT) ou `legifrance_recherche fond=KALI`
- arrêté d'extension JO → vérifié via `legifrance_get_jorf` (par JORFTEXT) ou `legifrance_recherche fond=JORF`

Si l'agent ne peut pas vérifier (API en panne, ID rejeté, recherche infructueuse) : il écrit **« à confirmer (référence non vérifiée) »** et explique pourquoi il n'a pas pu vérifier. **Aucun KALITEXT, n° d'avenant, date d'arrêté d'extension ou coefficient ne doit être inventé pour combler le vide.**

## Étape 4 — Self-check final (obligatoire avant envoi)

### 4.a — Appel obligatoire de `validate_note` AVEC `expected_context`

**Avant toute relecture humaine, tu DOIS appeler `validate_note` avec ta note finale ET le paramètre `expected_context`** qui dit ce que la note prétend couvrir. Format :

```
validate_note({
  note: "<ta note finale en markdown>",
  expected_context: {
    branche: "coiffure",         // ou "métallurgie", "bâtiment"…
    idcc: "2596",                 // l'IDCC à 4 chiffres annoncé
    code: "Code du travail"       // si la note cite des articles
  }
})
```

**Sans `expected_context`, le tool ne peut pas détecter automatiquement le piège des branches** — il liste seulement les références, à toi de comparer (et c'est précisément ce que le LLM rate). Avec `expected_context`, le tool fait le cross-check pour toi et te retourne une erreur explicite si une référence ne correspond pas.

**Le tool retourne `isError: true` si au moins une référence est invalide OU mal attribuée.** Dans ce cas, tu DOIS corriger la note avant restitution. Pas de discussion possible :

- **Référence non vérifiable** → retirée ou remplacée par « à confirmer (référence non vérifiée) ».
- **🚨 PIÈGE DES BRANCHES DÉTECTÉ** (KALITEXT d'une autre CCN que celle annoncée) → retirée et remplacée par la bonne référence trouvée via `legifrance_recherche fond=KALI` ciblée sur la vraie branche, ou par « à confirmer ».
- **Référence valide et bien attribuée** → conservée.

Ré-appelle `validate_note` après correction pour confirmer que tout passe (`isError: false`).

### 4.b — Revue manuelle complémentaire

En complément de `validate_note`, **passe en revue chaque identifiant cité** et identifie l'appel de tool qui te l'a fourni. Si tu ne peux pas pointer l'appel, retire ou marque « à confirmer ».

Une référence inventée — ou attribuée à la mauvaise branche — engage la responsabilité du professionnel utilisateur et discrédite le plugin. Le bandeau d'en-tête de la note rappelle au lecteur d'ouvrir les liens, mais c'est ton self-check qui doit le rendre rare.

## Format de sortie

Markdown structuré, suivant la séquence Étape 1 → 2 → 3 → 4. Tableau de chiffrage des indemnités central. Citations rigoureuses. Self-check effectué. Disclaimer fin de note.
