# Suite Berryer — votre cabinet juridique français dans Claude

> Trois plugins Claude (Code, Cowork, Desktop) qui mettent à disposition des équipes de juristes spécialisés, branchées en direct sur **Légifrance** et le **BOFiP**, sans qu'aucune donnée ne quitte votre poste.

Édité par [Demerys](https://demerys.com).

---

## Trois plugins, un seul standard de qualité

### `berryer` — Cabinet généraliste
Pour cabinets pluri-disciplinaires. Couvre civil, commercial, fiscal, consommation, et la traduction de contrats anglo-saxons.

**Équipe** : Dupin (veille), Cassin (jurisprudence), Colbert (fiscal CGI + BOFiP), Portalis (rédaction), David (traduction).
**Méthodes** : Domat (note), Pothier (consultation), Gény (citations).

→ [README détaillé](./plugins/berryer/README.md)

### `berryer-affaires` — Cabinet droit des affaires
Pour avocats spécialisés en M&A, contentieux commercial, droit des sociétés, procédures collectives.

**Équipe** : Thaller (rédaction commerciale), Ripert (jurisprudence Cass. com.), Houin (procédures collectives), Guyon (sociétés).
**Méthode** : Demogue (note de risque transactionnel).

→ [README détaillé](./plugins/berryer-affaires/README.md)

### `berryer-social` — Cabinet droit du travail
Pour avocats spécialisés en contentieux prud'homal, conventions collectives, représentation du personnel.

**Équipe** : Durand (droit individuel), Lyon-Caen (CSE et collectif), Despax (CCN et négociation), Camerlynck (procédure prud'homale).
**Méthode** : Rouast (qualification CCN + structure note prud'homale).

→ [README détaillé](./plugins/berryer-social/README.md)

---

## Installation

Voir le guide détaillé dans `plugins/berryer/INSTALL.md`. Synthèse :

```bash
# Prérequis : Node.js ≥ 20, compte PISTE avec souscription Légifrance
npm install   # à la racine du monorepo, installe les workspaces
node plugins/berryer/scripts/setup-credentials.mjs   # une seule fois, partagé entre les 3 plugins

# Puis selon votre profil :
claude --plugin-dir plugins/berryer            # généraliste
claude --plugin-dir plugins/berryer-affaires   # droit des affaires
claude --plugin-dir plugins/berryer-social     # droit du travail
```

Pour Cowork : voir `plugins/berryer/INSTALL.md` (parcours A — UI graphique sans terminal).

---

## Architecture monorepo

```
demerys/berryer/
├── packages/core/              # @berryer/core - lib partagée
│   └── src/                    # client PISTE, cache, schémas Zod, tools Légifrance
├── plugins/
│   ├── berryer/                # plugin généraliste
│   ├── berryer-affaires/       # plugin droit des affaires
│   └── berryer-social/         # plugin droit du travail
├── .claude-plugin/marketplace.json   # liste les 3 plugins
├── package.json                # workspaces npm
└── tsconfig.base.json
```

Chaque plugin a son propre `mcp-server/` minimal (~10 lignes) qui importe `@berryer/core` et démarre. Le code commun (HTTP, cache, 10 tools Légifrance) est dans le core, maintenu une seule fois.

---

## Pourquoi la suite est fiable

### Aucune référence inventée
Chaque article cité, chaque arrêt mentionné, chaque fiche BOFiP référencée a été **réellement consultée sur Légifrance** au moment de la réponse. Si un agent n'a pas pu vérifier, il le dit explicitement.

Concrètement :
- Schémas Zod calés sur des **captures réelles** de l'API Légifrance (pas sur la doc Swagger qui ment)
- Attendus de jurisprudence sortis **mot pour mot** du texte officiel, en blockquote
- Liens Légifrance systématiquement fournis pour vérification

### Aucune donnée ne sort de votre poste
- Vos credentials PISTE dans le keychain de votre OS
- Les serveurs MCP des plugins tournent **localement**
- Vos requêtes partent en direct vers `api.piste.gouv.fr` — Demerys n'a aucune visibilité
- Aucune télémétrie
- Code source ouvert et auditable

### Robuste face aux hoquets infrastructure
La passerelle DILA a des micro-pannes connues. Le plugin retry automatiquement jusqu'à 5 fois avec backoff exponentiel (~42 sec total), et ses messages d'erreur sont conçus pour ne pas induire les agents en erreur de diagnostic.

---

## Pourquoi la suite est efficace

### La délégation automatique
Vous parlez à Claude en **langage naturel**. Claude analyse votre intention et délègue à l'agent pertinent — exactement comme un assistant qui transfère votre appel au bon spécialiste.

> *« Mon client a reçu un redressement TVA »* → Colbert (CGI + BOFiP)
> *« Décision Cass. com. sur clause de NC post-cession »* → Ripert
> *« CCN de la métallurgie pour cadre »* → Despax (KALI)
> *« Cession de SAS avec un salarié protégé »* → Guyon + Lyon-Caen (chaînage cross-plugin)

### Cache local
Les requêtes répétitives sont mises en cache localement (SQLite). Une seconde consultation du même article est instantanée.

### Coexistence des plugins
Vous pouvez installer plusieurs plugins en parallèle. Les agents cohabitent et se coordonnent. Pour une question pluri-disciplinaire, Claude orchestre les délégations cross-plugin.

---

## Confidentialité — argument clé pour les professions sensibles

Vos credentials et requêtes ne quittent **jamais** votre poste. Le serveur MCP de chaque plugin tourne **localement**. Aucune intermédiation Demerys ou Anthropic. Code source auditable.

Si Cowork affiche un avertissement de sécurité concernant les MCP locaux, il fait référence à cette architecture — c'est précisément l'effet recherché pour le secret professionnel et la conformité RGPD.

---

## Licence

- **Code** : **Apache License 2.0** — voir [LICENSE](./LICENSE) et [NOTICE](./NOTICE). Politique d'usage des marques : [TRADEMARK.md](./TRADEMARK.md).
- **Éditeur** : DEMERYS INVESTMENT, SAS au capital de 200 000 €, RCS Béziers 803 315 225, 23 avenue Auguste Albertini, 34500 Béziers
- **Données Légifrance/BOFiP** : Licence Ouverte v2.0 (Etalab) — s'applique aux contenus que vous récupérez via le plugin
- **Disclaimer** : Berryer fournit un **accès aux sources officielles** et une aide à la recherche/rédaction. **Il ne fournit pas de conseil juridique**. Toute interprétation reste sous la responsabilité du professionnel utilisateur.

---

## Roadmap V0.3+

- Récupération du **texte intégral des fiches BOFiP** via l'endpoint dédié DGFiP (V1.1)
- Tool `legifrance_diff` pour comparer deux versions d'un article
- Tool `bofip_chronologie` pour les versions historiques d'une fiche
- Tool `idcc_resolver` (plugin social) pour résoudre nom CCN ↔ IDCC
- Tool `infogreffe_lookup` (plugin affaires) pour le registre des sociétés
- Marketplace privée d'organisation Cowork (clé en main pour cabinet, branding personnalisé)
- Internationalisation (Eur-Lex pour les cabinets transfrontaliers)

---

## Support

- **Issues GitHub** : [demerys/berryer/issues](https://github.com/demerys/berryer/issues)
- **Email** : contact@demerys.com
- **Site** : [demerys.com](https://demerys.com)

*« Un plugin n'est pas un outil. C'est une équipe. »*
