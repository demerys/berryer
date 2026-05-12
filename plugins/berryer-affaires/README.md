# Berryer Affaires — votre cabinet droit des affaires dans Claude

> Plugin spécialisé pour avocats et juristes en droit des affaires : sociétés, contrats commerciaux, contentieux, procédures collectives. Branché sur Légifrance via PISTE.

## L'équipe

### **Thaller** — *La rédaction commerciale*
**Edmond Thaller** (1851-1918), fondateur du *Traité de droit commercial*, professeur à la Faculté de Paris. Son traité a structuré la doctrine commerciale française pendant un siècle.

> **Quand il intervient** : « Rédige-moi des CGV pour cette activité de prestation B2B », « Quel régime pour ce bail commercial ? », « Cession de fonds de commerce : structure et formalités », « Pacte d'associés pour SAS ».

### **Ripert** — *La jurisprudence Cass. com.*
**Georges Ripert** (1880-1958), grand commercialiste du XXe siècle, doyen de la Faculté de Paris, auteur de l'incontournable *Traité de droit commercial* (avec Roblot).

> **Quand il intervient** : « Que dit la Cour de cassation sur cette clause de non-concurrence post-cession ? », « Évolution jurisprudentielle de l'abus de majorité », « Arrêt récent sur le rachat forcé de minoritaires ».

### **Houin** — *Les procédures collectives*
**Roger Houin**, civiliste et commercialiste, qui a marqué le droit des entreprises en difficulté.

> **Quand il intervient** : « Mon client veut entrer en sauvegarde judiciaire », « Conditions de la procédure de conciliation L. 611-4 », « Effet du jugement d'ouverture de RJ sur les contrats en cours », « Plan de cession ou plan de continuation ? ».

### **Guyon** — *Le droit des sociétés*
**Yves Guyon**, professeur à la Sorbonne, auteur du *Droit des affaires* de référence, contemporain et clair.

> **Quand il intervient** : « Convention réglementée pour SAS L. 227-10 », « Conditions de l'abus de majorité », « Modalités de transformation SARL → SAS », « Régime de la convention de gestion d'actifs ».

## Le méthodologiste

### **Demogue** — *La méthode de la note de risque transactionnel*
**René Demogue** (1872-1938), théoricien des obligations dans la pratique des affaires. Il pose la grille de risque qui doit accompagner toute négociation contractuelle structurée.

Charge automatiquement par les agents quand la demande implique une transaction (M&A, joint-venture, refinancement, cession). Produit une grille de risque structurée : **intitulé du risque / niveau (1-5) / impact / probabilité / mitigation possible**.

## Slash command

```
/berryer-affaires:audit-clause <texte de la clause>
```

Charge Demogue pour la grille de risque + délègue à Thaller pour l'analyse de la rédaction + Ripert si jurisprudence pertinente.

## Installation

Prérequis et installation détaillés : voir le **plugin généraliste `berryer`** dans le même monorepo (`plugins/berryer/INSTALL.md` et `plugins/berryer/BETA_TESTING.md`). Le parcours est identique :

1. Node.js ≥ 20 sur votre poste
2. Compte PISTE avec souscription API Légifrance
3. `node scripts/setup-credentials.mjs` une fois (les credentials sont partagés entre tous les plugins de la suite Berryer)
4. `claude --plugin-dir plugins/berryer-affaires` (ou install via marketplace)

## Coexistence avec les autres plugins

Vous pouvez installer plusieurs plugins de la suite Berryer en parallèle. Les agents d'`berryer-affaires` cohabitent avec ceux du généraliste (`berryer`) et du social (`berryer-social`) si vous les avez installés. Les credentials PISTE sont partagés via `~/.config/berryer/credentials.json`.

Dans une question pluri-disciplinaire (par exemple « cession de SAS avec un salarié protégé »), Claude délègue intelligemment à Guyon (sociétés) ET à Lyon-Caen (rapports collectifs) si le plugin social est installé.

## Confidentialité

Identique à `berryer` généraliste. Vos credentials et requêtes ne quittent jamais votre poste. Voir `plugins/berryer/README.md` pour les détails.

## Licence

**EUPL-1.2** (Licence publique de l'Union européenne v1.2) côté code. Voir [LICENSE](../../LICENSE) et [NOTICE](../../NOTICE) à la racine du monorepo. Politique d'usage du nom commercial Demerys : [TRADEMARK.md](../../TRADEMARK.md).

Les données Légifrance/BOFiP relèvent de la **Licence Ouverte v2.0** (Etalab) et restent diffusées sous cette licence.
