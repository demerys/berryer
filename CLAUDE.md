# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## État du repo (mai 2026)

**Monorepo de la suite Berryer**, contient à terme 3 plugins (généraliste, droit des affaires, droit du travail) qui partagent un `core` commun.

```
demerys/berryer/
├── packages/core/                # @berryer/core (lib partagée)
├── plugins/
│   ├── berryer/                  # plugin généraliste (Dupin, Cassin, Colbert, Portalis, David)
│   ├── berryer-affaires/         # à venir M3-M4 (Thaller, Ripert, Houin, Guyon)
│   └── berryer-social/           # à venir M5-M6 (Durand, Lyon-Caen, Despax, Camerlynck)
├── .claude-plugin/marketplace.json   # à créer M2
├── package.json                  # workspaces npm
├── tsconfig.base.json
└── docs/, scripts/ (dev tools), SPEC_berryer_plugin.md (archive V1)
```

`SPEC_berryer_plugin.md` reste la source de vérité historique pour la V1. Pour la refonte en cours (V0.2.0), voir `~/.claude/plans/ok-regarde-aussi-je-jazzy-diffie.md` (plan validé en mai 2026).

## Identité produit

La suite Berryer est éditée par Demerys pour avocats / juristes / experts-comptables. Chaque plugin expose les API **Légifrance** et **BOFiP** via **PISTE** avec une équipe d'agents juridiques nommés selon des juristes français célèbres. L'utilisateur final fournit **sa propre clé PISTE** — Demerys ne centralise rien (argument RGPD/secret professionnel).

Naming : tous les composants portent le nom de juristes français. Cohérence de marque non négociable. Voir le SPEC pour la liste complète et les biographies courtes.

## Stack — IMPORTANT : ne PAS suivre le CLAUDE.md global Go

Le CLAUDE.md utilisateur global décrit une stack Go/Gin/SQLite. **Il ne s'applique pas ici.** Ce projet est TypeScript/Node :

- MCP server : TypeScript + `@modelcontextprotocol/sdk` (transport stdio)
- Runtime : Node.js ≥ 20
- HTTP : `undici`
- Cache local : `better-sqlite3` (un fichier `cache.db` par plugin)
- Validation : `zod`
- Tests : `vitest`
- Workspaces : npm 10+ workspaces (les 3 plugins + le core)

## Architecture critique

### Monorepo + plugins indépendants

- `packages/core/` exporte `createBerryerServer({ name, version })` qui fait tout le wiring : config, OAuth PISTE, cache SQLite, registre des 10 tools Légifrance, signal handlers. Sans changement fonctionnel par rapport à V1.
- Chaque `plugins/<nom>/mcp-server/src/index.ts` fait juste `import { createBerryerServer, log } from "@berryer/core"` puis `const { start } = createBerryerServer({ name, version }); start().catch(...)`. ~10 lignes par plugin.
- Build : `npm run build` à la racine builde `core` puis tous les plugins (workspaces). Au runtime, `node plugins/<nom>/mcp-server/dist/index.js` résout `@berryer/core` via les symlinks workspace dans `node_modules/`.

### Règle stricte des dossiers d'un plugin

Vérifié doc Anthropic — **un seul fichier dans `.claude-plugin/` du plugin** : `plugin.json`. Tous les autres dossiers (`agents/`, `skills/`, `commands/`, `hooks/`, `mcp-server/`) sont à la **racine du plugin** (i.e. dans `plugins/<nom>/`), ainsi que `.mcp.json`.

Le `marketplace.json` global est à la racine **du monorepo** (`./.claude-plugin/marketplace.json`), pas dans un plugin.

### Distribution

Repo `demerys/berryer` (privé en beta, public à terme) contient le monorepo entier + le `marketplace.json` qui liste les 3 plugins. Un utilisateur fait `/plugin marketplace add demerys/berryer` puis `/plugin install berryer` (ou `berryer-affaires` ou `berryer-social`). Plus besoin d'un repo marketplace séparé.

## PISTE / OAuth

- Flow `client_credentials`, scope `openid`, token TTL ~1h → rafraîchir à 50min
- Variables d'env : `PISTE_CLIENT_ID`, `PISTE_CLIENT_SECRET`, `PISTE_ENV` (default `production`)
- Endpoints prod vs sandbox : voir §3.3
- **Ne pas typer les réponses PISTE depuis la doc seule** : faire un appel réel avec un vrai token et inspecter avant de figer les schémas Zod (instruction explicite du spec §14.6)
- Cache obligatoire avant d'ajouter beaucoup de tools (rate limits PISTE serrés, requêtes répétitives)
- **Syntaxe d'interpolation `.mcp.json`** : utiliser `${VAR}` et **PAS** `${env:VAR}` (la spec §2.3 a la mauvaise syntaxe). Source : https://code.claude.com/docs/en/mcp.md. Sans `env:` les substitutions échouent silencieusement et la string littérale `${env:PISTE_CLIENT_ID}` est passée à PISTE qui rejette en 403, donnant l'illusion d'un problème de souscription.

## PISTE — bugs infrastructure connus

- **HTTP 400 avec content-length:0 sur /search** : la passerelle DILA renvoie sporadiquement des 400 vides sur des bodies parfaitement valides (constaté en mai 2026). Durée typique des hoquets : 10-60 sec. Le plugin retry jusqu'à 5 fois avec backoff exponentiel (42 sec total). `PisteApiError` cas 400+empty est explicitement marqué "ce n'est PAS un 403, PAS un problème de credentials" pour empêcher les agents de mal interpréter.
- **Datacenters multi-routés** : le LB DILA route entre `rbx` (Roubaix) et `sbg` (Strasbourg). Un DC peut être plus instable que l'autre.

## Tools MCP V1 (8 tools)

Légifrance : `legifrance_recherche`, `legifrance_get_article_code`, `legifrance_get_loda`, `legifrance_get_jurisprudence`, `legifrance_get_jorf`. BOFiP : `bofip_recherche`, `bofip_get_document`. Utilitaire : `piste_status`. Détails inputs/outputs/endpoints en §3.4.

Gestion d'erreurs PISTE : 401 → re-auth + 1 retry, 403 → message "souscrire l'API sur dashboard PISTE", 429 → backoff exponentiel 3x, 5xx → 1 retry après 2s. Toujours mentionner "Légifrance/PISTE" dans les messages d'erreur.

## Agents et skills

- **Agents** (`agents/*.md`) : Markdown + frontmatter YAML (`name`, `description`, `tools`). La `description` doit être assez précise pour que Claude délègue correctement. Garder la note culturelle d'intro de chaque agent.
- **Skills** (`skills/<nom>/SKILL.md`) : un dossier par skill. Le dossier `gény/` peut contenir l'accent UTF-8 ; basculer sur `geny/` si Claude Code remonte un problème d'encodage.

## Slash commands

Namespacés par le nom du plugin : `/berryer:recherche`, `/berryer:veille`. Fichiers dans `commands/` à la racine.

## Test local pré-publication

```bash
claude --plugin-dir /chemin/vers/berryer
# puis dans Claude Code :
/plugin
# vérifier listing + onglet Errors vide
```

Checklist Cowork avant publication : §8bis.4. Notamment, tester l'UI de saisie credentials PISTE depuis un compte Cowork différent de celui de dev.

## Style

- Français pour les messages utilisateur (descriptions agents/skills, erreurs, doc)
- Anglais pour le code (variables, fonctions, commentaires techniques)
- License MIT côté code ; rappeler que les **données** Légifrance/BOFiP relèvent de la Licence Ouverte 2.0 (à mentionner dans le README)
- Disclaimer obligatoire : le plugin donne accès aux sources, il ne fournit pas de conseil juridique
