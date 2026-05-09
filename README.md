# Berryer — un cabinet juridique virtuel français dans Claude

> Trois plugins Claude (Code, Cowork, Desktop) qui mettent à disposition une équipe de **14 agents juridiques spécialisés**, branchés en direct sur **Légifrance** et le **BOFiP**, sans qu'aucune donnée n'aille sur un serveur tiers.

Édité par [Demerys](https://demerys.com). Site officiel : [berryer-landing.netlify.app](https://berryer-landing.netlify.app/).

---

## Pourquoi Berryer

Trois objections récurrentes des juristes vis-à-vis des assistants IA généralistes — et la manière dont Berryer y répond.

### 1. « Claude répond bien, mais invente parfois des références »

Berryer ne cite **que** ce qu'il a effectivement consulté sur Légifrance à la seconde près. Schémas Zod calés sur des **captures réelles** de l'API DILA (pas sur la doc Swagger qui ment), attendus de jurisprudence sortis **mot pour mot** du texte officiel en blockquote, lien Légifrance fourni systématiquement pour vérification en un clic.

Si un agent n'a pas pu vérifier, il le dit explicitement. Pas d'invention, pas de paraphrase qui dérive — la fiabilité est l'arête principale du produit.

### 2. « Je ne peux pas envoyer un dossier client à un service américain »

Le serveur MCP de chaque plugin tourne **localement** sur votre poste. Vos requêtes partent en direct vers `api.piste.gouv.fr` (DILA, opérateur public) avec **vos** credentials PISTE. Demerys n'a **aucune** visibilité, aucune télémétrie, aucun cookie, aucun cache distant. Le code source est ouvert et auditable (~2 000 lignes TypeScript, 42 tests).

C'est précisément l'architecture exigée par le secret professionnel (article 226-13 du Code pénal) et la conformité RGPD pour les données clients.

### 3. « Les conventions de citation, les noms d'agents, le format n'ont rien de français »

La suite est conçue par et pour des juristes français. Les agents portent des noms de juristes français (Berryer, Cassin, Colbert, Portalis, Thaller, Ripert, Durand, Lyon-Caen…). Les méthodes (Domat pour la note, Pothier pour la consultation, Gény pour les citations, Demogue pour la note de risque transactionnel, Rouast pour la procédure prud'homale) reprennent les standards de la doctrine française.

Les citations sont rendues dans le format français rigoureux : `Civ. 1re, 12 mars 2024, n° 22-12.345`, `art. L. 225-38 C. com.`, `BOI-IS-BASE-30-30-20-20 §80`, etc.

---

## Trois plugins, une seule philosophie

### `berryer` — Cabinet généraliste

Pour cabinets pluri-disciplinaires. Couvre civil, commercial, fiscal, consommation, traduction de contrats anglo-saxons.

**Équipe (6 agents)** : Berryer (orchestrateur), Dupin (veille), Cassin (jurisprudence), Colbert (fiscal CGI + BOFiP), Portalis (rédaction de notes et consultations), David (traduction common law / droit civil).
**Skills méthodologiques** : Domat (note), Pothier (consultation), Gény (citations).

→ [README détaillé](./plugins/berryer/README.md)

### `berryer-affaires` — Cabinet droit des affaires

Pour avocats spécialisés en M&A, contentieux commercial, droit des sociétés, procédures collectives.

**Équipe (4 agents)** : Thaller (rédaction commerciale, contrats, baux, fonds de commerce), Ripert (jurisprudence Cass. com. et Conseil d'État), Houin (procédures collectives — sauvegarde, redressement, liquidation), Guyon (droit des sociétés).
**Skill méthodologique** : Demogue (note de risque transactionnel pour M&A et opérations structurantes).

→ [README détaillé](./plugins/berryer-affaires/README.md)

### `berryer-social` — Cabinet droit du travail

Pour avocats spécialisés en contentieux prud'homal, conventions collectives, représentation du personnel.

**Équipe (4 agents)** : Durand (droit individuel — contrat, modification, rupture, indemnités), Lyon-Caen (rapports collectifs — CSE, négociation, grève, transferts L. 1224-1), Despax (négociation collective, qualification CCN, KALI), Camerlynck (procédure prud'homale).
**Skill méthodologique** : Rouast (qualification CCN + structure note prud'homale + conventions de citation sociales).

→ [README détaillé](./plugins/berryer-social/README.md)

---

## Comment l'obtenir

### Pendant la beta

- **Code ouvert et installable gratuitement** depuis ce dépôt (clone + `npm install` + credentials PISTE).
- **Beta accompagnée** sur candidature, qui inclut installation guidée à distance, calage métier sur vos cas types, support privilégié pendant 4 semaines, accès direct aux mainteneurs. Aucun engagement et aucune contrepartie financière pendant la phase beta.

Candidatures et marques d'intérêt : via le **formulaire de contact** sur [demerys.com](https://demerys.com), en précisant `[BERRYER BETA]` en objet et votre profil (cabinet, taille, dominantes).

### Après la beta

Le code source restera diffusé sous **EUPL-1.2** (gratuit, libre, modifiable dans le respect du copyleft). Un service **accompagné** (installation, calage, support, formation, hébergement éventuel) sera proposé en option payante, positionné pour rester accessible à un cabinet de toute taille. Les conditions précises seront publiées avant la sortie de beta.

### Prérequis utilisateur

- Compte **PISTE** gratuit avec souscription Légifrance active ([dashboard PISTE](https://piste.gouv.fr))
- Abonnement **Claude** (Pro, Team ou Enterprise)
- **Node.js ≥ 20** installé localement
- macOS, Windows ou Linux

---

## Installation rapide

```bash
# Prérequis : Node.js ≥ 20, compte PISTE avec souscription Légifrance
git clone https://github.com/demerys/berryer
cd berryer
npm install                                         # workspaces
node plugins/berryer/scripts/setup-credentials.mjs  # une fois, partagé entre les 3 plugins

# Puis selon votre profil :
claude --plugin-dir plugins/berryer            # généraliste
claude --plugin-dir plugins/berryer-affaires   # droit des affaires
claude --plugin-dir plugins/berryer-social     # droit du travail
```

Pour Cowork (parcours UI sans terminal) : voir `plugins/berryer/INSTALL.md`.

Installation via marketplace Claude Code :
```
/plugin marketplace add demerys/berryer
/plugin install berryer
/plugin install berryer-affaires
/plugin install berryer-social
```

---

## Architecture (monorepo)

```
demerys/berryer/
├── packages/core/                    # @berryer/core — lib partagée
│   └── src/                          # client PISTE, cache, schémas Zod, tools Légifrance
├── plugins/
│   ├── berryer/                      # plugin généraliste (6 agents + 3 skills)
│   ├── berryer-affaires/             # plugin droit des affaires (4 agents + 1 skill)
│   └── berryer-social/               # plugin droit du travail (4 agents + 1 skill)
├── .claude-plugin/marketplace.json   # liste les 3 plugins
├── package.json                      # workspaces npm
└── tsconfig.base.json
```

Chaque plugin a son propre `mcp-server/` minimal (~10 lignes) qui importe `@berryer/core` et démarre. Les bundles (`dist/index.js`) sont **commités** dans le dépôt — pas de `npm install` requis pour faire tourner un plugin une fois cloné.

---

## Robustesse face aux hoquets infrastructure

La passerelle DILA a des micro-pannes connues (HTTP 400 vides, datacenter rbx/sbg flottants, OAuth qui pédale). Les plugins retry automatiquement jusqu'à 5 fois avec backoff exponentiel (~42 sec total), et leurs messages d'erreur sont conçus pour ne **pas** induire les agents en erreur de diagnostic (un 400 vide n'est pas un 403 de souscription, c'est un hoquet — la distinction est explicite dans le code).

---

## Confidentialité

Vos credentials et requêtes ne quittent **jamais** votre poste. Le serveur MCP de chaque plugin tourne **localement**. Aucune intermédiation Demerys ou Anthropic. Aucune télémétrie. Code source auditable.

Si Cowork affiche un avertissement de sécurité concernant les MCP locaux, il fait référence à cette architecture — c'est précisément l'effet recherché pour le secret professionnel et la conformité RGPD.

---

## Disclaimer juridique

> Berryer fournit un **accès aux sources juridiques officielles** françaises (Légifrance, BOFiP, KALI) et une **aide à la recherche, à la rédaction et à la mise en forme**.
>
> Berryer **ne fournit pas de conseil juridique** au sens des articles 54 et suivants de la loi n° 71-1130 du 31 décembre 1971 portant réforme de certaines professions judiciaires et juridiques.
>
> Toute interprétation des textes ou décisions, et toute application à une situation déterminée, restent sous l'entière responsabilité du **professionnel utilisateur** (avocat, juriste, expert-comptable ou équivalent).

---

## Licences et mentions légales

- **Code source** : **EUPL-1.2** (Licence publique de l'Union européenne v1.2) — voir [LICENSE](./LICENSE) et [NOTICE](./NOTICE). Politique d'usage des marques : [TRADEMARK.md](./TRADEMARK.md).
- **Données Légifrance / BOFiP / KALI** : **Licence Ouverte v2.0** (Etalab) — s'applique aux contenus que vous récupérez via le plugin, indépendamment de l'EUPL.
- **Éditeur** : DEMERYS INVESTMENT, SAS au capital de 200 000 €, RCS Béziers 803 315 225, 23 avenue Auguste Albertini, 34500 Béziers.
- **Marques** : « Berryer » et « Demerys » sont des éléments d'identité commerciale de DEMERYS INVESTMENT — voir [TRADEMARK.md](./TRADEMARK.md) pour les usages autorisés.

---

## Roadmap V0.3+

- Récupération du **texte intégral des fiches BOFiP** via l'endpoint dédié DGFiP (V1.1)
- Tool `legifrance_diff` pour comparer deux versions d'un article
- Tool `bofip_chronologie` pour les versions historiques d'une fiche
- Tool `idcc_resolver` (plugin social) pour résoudre nom CCN ↔ IDCC
- Tool `infogreffe_lookup` (plugin affaires) pour le registre des sociétés
- Marketplace privée d'organisation Cowork (clé en main, branding cabinet)
- Internationalisation (Eur-Lex pour les cabinets transfrontaliers)

---

## Disclaimer (rappel)

Berryer fournit un accès aux sources officielles et une aide à la recherche / rédaction. Il ne fournit pas de conseil juridique. Toute interprétation reste sous la responsabilité du professionnel utilisateur.

---

## Contact

- **Site officiel** : [berryer-landing.netlify.app](https://berryer-landing.netlify.app/)
- **Site éditeur** : [demerys.com](https://demerys.com) (formulaire de contact en bas de page)
- **Issues GitHub** : [demerys/berryer/issues](https://github.com/demerys/berryer/issues) — privilégié pour les bugs reproductibles, les demandes de feature, les questions techniques publiques.

> *« Un plugin n'est pas un outil. C'est une équipe. »*
