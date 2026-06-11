---
description: Analyse d'application d'une convention fiscale bilatérale à une situation transfrontalière (résidence, flux, retenue à la source, double imposition)
argument-hint: <pays partenaire + situation (ex : "Allemagne — dividendes versés par une SAS française à sa mère allemande")>
---

Charge le skill **jeze** (méthode de la consultation fiscale) puis analyse l'application de la convention fiscale à la situation suivante :

**$ARGUMENTS**

Procédure :

1. Charge le skill `jeze` pour structurer la sortie en consultation fiscale (bandeau obligatoire + `validate_note` final avec `expected_context`).
2. Délègue à l'agent **tixier** l'analyse conventionnelle complète, dans l'ordre du principe de subsidiarité :
   - **Droit interne d'abord** : la France impose-t-elle selon le CGI (résidence, territorialité, retenue à la source) ?
   - **Convention ensuite** : identifier la convention applicable via `bofip_recherche` / `bofip_get_document` (série `BOI-INT-CVB-<pays>`, et le texte JORF si nécessaire), qualifier le revenu au sens conventionnel, identifier l'article applicable — dans la convention réellement signée, pas le modèle OCDE.
   - **Élimination de la double imposition** : méthode prévue (crédit d'impôt / exemption) et obligations pratiques (attestation de résidence, formulaires de taux conventionnel).
3. Si la situation comporte un volet TVA (prestations transfrontalières, importations), délègue à l'agent **lauré** — en rappelant que les conventions fiscales ne couvrent pas la TVA.
4. Si la situation évoque un risque prix de transfert ou établissement stable non déclaré, le signaler et proposer un approfondissement avec **tixier** (art. 57 CGI, documentation L. 13 AA LPF) et **trotabas** (procédure, régularisation).

Restitution attendue :
- Consultation structurée selon le skill `jeze`
- Tableau récapitulatif final : revenu / État de la source / texte interne / article conventionnel / taux final / méthode d'élimination
- **Aucun taux conventionnel de mémoire** : chaque taux cité provient d'une fiche `BOI-INT-CVB-` ou du texte de la convention consulté en session, sinon « à confirmer »
- Disclaimer Jèze final

Si l'utilisateur ne précise pas la nature du flux (dividendes ? intérêts ? redevances ? salaires ? plus-value ?) ou la résidence des parties, demande-le avant de produire l'analyse — la qualification conventionnelle change tout.
