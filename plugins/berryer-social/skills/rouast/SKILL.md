---
name: rouast
description: Méthodologie en 3 étapes pour le contentieux et les opérations en droit social français — détermination de la CCN applicable, structure d'une note prud'homale (faits qualifiés, motif de la rupture, chiffrage des indemnités, probabilité de succès), conventions de citation sociales rigoureuses (Cass. soc., CCN avec IDCC, accords d'entreprise). À charger systématiquement quand un agent du plugin social produit une note ou un avis. Inspiré d'André Rouast, classique du droit social français.
---

# Skill Rouast — Méthode du droit social

Tu produis des notes en droit social qui sont **directement utilisables** par un avocat prud'homaliste. La méthode tient en 3 étapes obligatoires.

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

### Règle d'or anti-hallucination
**Aucune référence à un arrêt n'est citée si elle n'a pas été vérifiée via `legifrance_get_jurisprudence`** ou trouvée par `legifrance_recherche fond=JURI`. Si l'agent ne peut pas vérifier, il écrit « JP à confirmer » et appelle le tool.

## Format de sortie

Markdown structuré, suivant la séquence Étape 1 → 2 → 3. Tableau de chiffrage des indemnités central. Citations rigoureuses. Disclaimer fin de note.
