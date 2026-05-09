# Berryer Social — votre cabinet droit du travail dans Claude

> Plugin spécialisé pour avocats et juristes en droit du travail et droit social : contentieux prud'homal, conventions collectives, représentation du personnel, sécurité sociale. Branché sur Légifrance et KALI via PISTE.

## L'équipe

### **Durand** — *Le droit individuel du travail*
**Paul Durand** (1908-1960), fondateur du *Traité de droit du travail moderne* (1947). Il a posé les bases du droit du travail français contemporain en distinguant clairement la matière du droit civil dont elle s'était émancipée.

> **Quand il intervient** : « Modification du contrat de travail », « Licenciement pour motif personnel ou économique ? », « Calcul des indemnités de rupture », « Prescription de l'action en nullité de transaction (art. 2224 C. civ.) », « Heures supplémentaires non payées ».

### **Lyon-Caen** — *Les rapports collectifs*
**Gérard Lyon-Caen** (1920-2004), grand contemporain du droit du travail, sociologue du droit social, auteur du *Traité de droit du travail* avec Pélissier et Supiot.

> **Quand il intervient** : « Consultation du CSE sur cette réorganisation », « Régularité de la désignation d'un délégué syndical », « Conditions de la grève », « Représentativité syndicale », « Procédure d'information-consultation préalable ».

### **Despax** — *La négociation collective*
**Michel Despax**, civiliste-travailliste, spécialiste de la négociation collective et des conventions collectives, auteur de référence sur la hiérarchie convention/loi.

> **Quand il intervient** : « Quelle CCN s'applique à mon client ? », « Hiérarchie convention de branche / accord d'entreprise », « Dispositions plus favorables et ordre public social », « Dénonciation d'un accord d'entreprise », « Effet d'une CCN étendue ».

### **Camerlynck** — *La procédure prud'homale*
**G.-H. Camerlynck**, classique du droit social français, qui a structuré la doctrine sur les juridictions du travail.

> **Quand il intervient** : « Saisine du conseil de prud'hommes », « Délais de prescription en matière de salaire (L. 3245-1) », « Audience de conciliation, départage », « Référé prud'homal », « Procédure d'appel », « Exécution provisoire ».

## Le méthodologiste

### **Rouast** — *La méthode de qualification CCN + structure prud'homale*
**André Rouast**, classique du droit social français, qui a posé la méthode de détermination de la convention collective applicable.

Charge automatiquement par les agents quand la demande implique un litige individuel ou collectif. Procédure en 3 étapes :
1. **Détermination de la CCN applicable** — code APE / activité réelle / IDCC / accords d'entreprise dérogatoires
2. **Structure de note prud'homale** — faits qualifiés / qualification juridique du contrat / motif réel et sérieux / chiffrage des indemnités demandées / probabilité de succès
3. **Conventions de citation sociales** — Cass. soc., date, n° pourvoi, FS-B+R / Bull. ; CCN avec IDCC ; accords d'entreprise

## Slash command

```
/berryer-social:ccn <activité ou IDCC>
```

Charge Rouast pour la méthode + délègue à Despax pour la recherche dans le fond `KALI` (conventions collectives).

## Installation

Prérequis et installation détaillés : voir le **plugin généraliste `berryer`** dans le même monorepo (`plugins/berryer/INSTALL.md` et `plugins/berryer/BETA_TESTING.md`). Le parcours est identique :

1. Node.js ≥ 20 sur votre poste
2. Compte PISTE avec souscription API Légifrance (qui couvre KALI pour les CCN)
3. `node scripts/setup-credentials.mjs` une fois (les credentials sont partagés entre tous les plugins de la suite Berryer)
4. `claude --plugin-dir plugins/berryer-social` (ou install via marketplace)

## Coexistence avec les autres plugins

Vous pouvez installer plusieurs plugins de la suite Berryer en parallèle. Les agents d'`berryer-social` cohabitent avec ceux du généraliste (`berryer`) et de l'affaires (`berryer-affaires`) si vous les avez installés. Les credentials PISTE sont partagés via `~/.config/berryer/credentials.json`.

Cas typique : pour une cession de société avec salarié protégé, Claude délègue à Lyon-Caen (autorisation administrative de licenciement) ET à Guyon (modalités de cession au sens du droit des sociétés) si le plugin affaires est installé.

## Confidentialité

Identique à `berryer` généraliste. Vos credentials et requêtes ne quittent jamais votre poste. Voir `plugins/berryer/README.md` pour les détails.

## Licence

**EUPL-1.2** (Licence publique de l'Union européenne v1.2) côté code. Voir [LICENSE](../../LICENSE) et [NOTICE](../../NOTICE) à la racine du monorepo. Pour la politique d'usage des marques : [TRADEMARK.md](../../TRADEMARK.md).

Les données Légifrance/KALI relèvent de la **Licence Ouverte v2.0** (Etalab) et restent diffusées sous cette licence.
