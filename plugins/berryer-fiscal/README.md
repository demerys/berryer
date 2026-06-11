# Berryer Fiscal — votre cabinet fiscaliste dans Claude

> Plugin spécialisé pour avocats fiscalistes, juristes et experts-comptables : fiscalité des entreprises, TVA, fiscalité internationale, contrôle et contentieux fiscal. Branché sur Légifrance (via PISTE) et sur le BOFiP (open data DGFiP, sans clé supplémentaire).

## L'équipe

### **Cozian** — *La fiscalité des entreprises*
**Maurice Cozian** (1936-2008), professeur à Dijon, auteur du *Précis de fiscalité des entreprises* et des *Grands principes de la fiscalité des entreprises*. Le plus grand pédagogue de la fiscalité française.

> **Quand il intervient** : « Quel régime fiscal pour cette fusion ? », « Conditions du régime mère-fille », « Exonération de plus-value à la cession du fonds », « Structurer la transmission avec un pacte Dutreil ».

### **Lauré** — *La TVA*
**Maurice Lauré** (1917-2001), inspecteur des finances, inventeur de la TVA en 1954 — l'impôt français le plus copié au monde, appliqué dans plus de 170 pays.

> **Quand il intervient** : « Cette prestation est-elle soumise à TVA ? », « Territorialité d'une prestation B2B intra-UE », « TVA déductible sur cette dépense ? », « TVA sur cette vente d'immeuble ».

### **Tixier** — *La fiscalité internationale*
**Gilbert Tixier**, professeur à Paris II, pionnier du *Droit fiscal international* (avec Guy Gest), qui a fondé la discipline en France.

> **Quand il intervient** : « Résidence fiscale de ce dirigeant expatrié ? », « Quelle retenue à la source sur ces dividendes versés en Allemagne ? », « Y a-t-il un établissement stable ? », « Documentation prix de transfert obligatoire ? ».

### **Trotabas** — *Le contrôle et le contentieux fiscal*
**Louis Trotabas** (1898-1985), doyen de la Faculté de Nice, fondateur du droit fiscal comme discipline juridique autonome — et défenseur des garanties du contribuable.

> **Quand il intervient** : « Mon client reçoit une proposition de rectification », « Délai de reprise applicable ? », « Sécuriser par rescrit L. 80 B », « Réclamation : devant quel juge ? ».

## Le méthodologiste

### **Jèze** — *La méthode de la consultation fiscale*
**Gaston Jèze** (1869-1953), le plus grand professeur de finances publiques français. Il exigeait qu'une analyse fiscale dise toujours **qui paie, combien, sur quelle base, en vertu de quel texte**.

Chargé automatiquement par les agents quand la demande appelle une consultation écrite. Produit une consultation structurée : **qualification / régime (texte + BOFiP croisés) / chiffrage / risques scorés (1-5) / sécurisation (rescrit, procédure amiable) / conclusion** — avec bandeau de vérification et self-check `validate_note` obligatoires.

## Slash command

```
/berryer-fiscal:convention <pays + situation>
```

Analyse d'application d'une convention fiscale bilatérale : droit interne d'abord (principe de subsidiarité), convention ensuite (`BOI-INT-CVB-`), élimination de la double imposition. Délègue à Tixier + Lauré si volet TVA.

## Périmètre — et coexistence avec Colbert

L'agent **Colbert** du plugin généraliste `berryer` reste le fiscaliste de premier recours pour les questions courantes (IR, plus-values des particuliers, droits de mutation simples). `berryer-fiscal` prend le relais quand la question devient une **matière de spécialiste** : restructurations, intégration fiscale, TVA complexe, flux internationaux, prix de transfert, contrôle et contentieux. Les deux plugins cohabitent sans conflit.

## Installation

Prérequis et installation détaillés : voir le **plugin généraliste `berryer`** dans le même monorepo (`plugins/berryer/INSTALL.md` et `plugins/berryer/BETA_TESTING.md`). Le parcours est identique :

1. Node.js ≥ 20 sur votre poste
2. Compte PISTE avec souscription API Légifrance
3. `node scripts/setup-credentials.mjs` une fois (les credentials sont partagés entre tous les plugins de la suite Berryer)
4. `claude --plugin-dir plugins/berryer-fiscal` (ou install via marketplace)

## Coexistence avec les autres plugins

Vous pouvez installer plusieurs plugins de la suite Berryer en parallèle. Les agents de `berryer-fiscal` cohabitent avec ceux du généraliste (`berryer`), du droit des affaires (`berryer-affaires`) et du social (`berryer-social`). Les credentials PISTE sont partagés via `~/.config/berryer/credentials.json`.

Dans une question pluri-disciplinaire (par exemple « fusion avec un volet prix de transfert et un PSE »), Claude délègue intelligemment à Cozian/Tixier ET à Guyon (sociétés) ou Lyon-Caen (social) si les autres plugins sont installés.

## Confidentialité

Identique à `berryer` généraliste. Vos credentials et requêtes ne quittent jamais votre poste. Voir `plugins/berryer/README.md` pour les détails.

## Licence

**EUPL-1.2** (Licence publique de l'Union européenne v1.2) côté code. Voir [LICENSE](../../LICENSE) et [NOTICE](../../NOTICE) à la racine du monorepo. Politique d'usage du nom commercial Demerys : [TRADEMARK.md](../../TRADEMARK.md).

Les données Légifrance/BOFiP relèvent de la **Licence Ouverte v2.0** (Etalab) et restent diffusées sous cette licence.

**Disclaimer** : ce plugin donne accès aux sources officielles ; il ne fournit pas de conseil juridique ou fiscal. Toute consultation produite doit être vérifiée par un professionnel habilité.
