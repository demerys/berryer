# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## État du repo

Pre-implementation : seul `SPEC_berryer_plugin.md` existe. Toute la structure code/config décrite ci-dessous est à créer. **Le spec est la source de vérité** — le lire en entier avant toute décision d'architecture, et notamment la section 14 ("Instructions à Claude Code pour démarrer") qui dicte le workflow de bootstrap (questions → plan 15 étapes → commits par étape).

## Identité produit

`berryer` est un plugin Claude (compatible Claude Code, Cowork, et Desktop) qui expose les API **Légifrance** et **BOFiP** via **PISTE** à des avocats / juristes / experts-comptables. L'utilisateur final fournit **sa propre clé PISTE** — Demerys ne centralise rien (argument RGPD/secret professionnel).

Naming : tous les composants portent le nom de juristes français (Berryer, Dupin, Cassin, Colbert, Portalis, Domat, Pothier, Gény). Cohérence de marque non négociable, voir spec §1.

## Stack — IMPORTANT : ne PAS suivre le CLAUDE.md global Go

Le CLAUDE.md utilisateur global décrit une stack Go/Gin/SQLite. **Il ne s'applique pas ici.** Ce projet est TypeScript/Node :

- MCP server : TypeScript + `@modelcontextprotocol/sdk` (transport stdio)
- Runtime : Node.js ≥ 20
- HTTP : `undici`
- Cache local : `better-sqlite3` (un seul fichier `cache.db`)
- Validation : `zod`
- Tests : `vitest`

## Architecture critique du plugin

Règle stricte vérifiée doc Anthropic — **un seul fichier dans `.claude-plugin/`** : `plugin.json`. Tous les autres dossiers (`agents/`, `skills/`, `commands/`, `hooks/`, `mcp-server/`) sont à la **racine** du plugin, ainsi que `.mcp.json`. Voir §2.1 du spec pour l'arborescence complète.

Distribution via le repo marketplace `demerys/jurisconsultes-marketplace` (à créer séparément) qui contient le plugin `berryer/` + un `.claude-plugin/marketplace.json`. Même repo consommé par Cowork (UI) et Claude Code (CLI).

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
