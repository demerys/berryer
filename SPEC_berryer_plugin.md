# Spec — Plugin Claude `berryer` (Demerys)

> Document de spécification pour le développement du plugin **Berryer** par Demerys, exposant les API Légifrance et BOFiP via PISTE, et embarquant des agents juridiques spécialisés portant les noms de grands juristes français. **Compatible Claude Code ET Claude Cowork** (même plugin, deux modes d'installation). Distribution prévue : marketplace GitHub publique pour cabinets d'avocats et d'expertise comptable.

## Naming et identité de marque

Le plugin et ses composants portent les noms de grands juristes français du XIXe et du XXe siècles. Cet univers cohérent renforce le positionnement haut de gamme et l'ancrage culturel français du produit.

| Composant | Nom | Référence |
|---|---|---|
| Plugin | `berryer` | Pierre-Antoine Berryer (1790-1868), grand orateur du barreau, parlementaire |
| Agent veille juridique | `dupin` | André-Marie Dupin (1783-1865), juriste prolifique, procureur général à la Cour de cassation |
| Agent synthèse jurisprudence | `cassin` | René Cassin (1887-1976), prix Nobel, Conseil constitutionnel |
| Agent analyse fiscale BOFiP | `colbert` | Jean-Baptiste Colbert (1619-1683), figure tutélaire des finances publiques |
| Agent rédaction de note | `portalis` | Jean-Étienne-Marie Portalis (1746-1807), rédacteur principal du Code civil |
| Skill note de synthèse | `domat` | Jean Domat (1625-1696), méthodologue du droit |
| Skill consultation juridique | `pothier` | Robert-Joseph Pothier (1699-1772), inspirateur du Code civil |
| Skill citation française | `gény` | François Gény (1861-1959), théoricien des sources du droit |

Marketplace GitHub : `demerys/jurisconsultes-marketplace` (pensée pour accueillir d'autres plugins juridiques à terme).

---

## 1. Contexte et objectifs

### 1.1 Contexte produit

Demerys (agence de développement web et conseil IA, Béziers, France) construit un plugin Claude permettant à des avocats, juristes d'entreprise et experts-comptables d'interroger les sources juridiques officielles françaises (Légifrance, BOFiP) directement depuis :

- **Claude Code** (terminal, pour les profils tech-savvy ou les développeurs d'un cabinet)
- **Claude Cowork** (app desktop avec UI graphique, pour les avocats et experts-comptables non-techniques) — installation par "Add marketplace from GitHub", 4 clics
- **Claude Desktop** (via le MCP server intégré au plugin, sans avoir besoin de Claude Code)

Le **même plugin** sert ces trois cibles — c'est l'intérêt central de l'architecture plugin Anthropic. Aucune duplication de code, une seule base à maintenir.

L'utilisateur final fournit **sa propre clé PISTE** (client_id + client_secret OAuth2) — Demerys ne centralise rien, ce qui constitue un argument clé : conformité RGPD, secret professionnel, aucune intermédiation.

### 1.2 Objectifs fonctionnels

1. Exposer les API Légifrance et BOFiP en tools MCP utilisables par Claude (Code, Cowork, Desktop)
2. Fournir des agents juridiques spécialisés réutilisables (veille, synthèse, recherche jurisprudence, analyse fiscale)
3. Fournir des skills méthodologiques (rédaction de note de synthèse, structure d'une consultation, etc.)
4. Permettre à l'utilisateur d'ajouter ses propres agents personnalisés sans modifier le plugin
5. Distribution simple, double parcours :
   - **Cowork** (cible principale grand public) : marketplace publique GitHub, install en 4 clics
   - **Claude Code** (cible tech) : `/plugin install berryer@jurisconsultes-marketplace`

### 1.3 Non-objectifs (V1)

- Pas d'interface graphique custom (on s'appuie sur Claude Code / Desktop)
- Pas de stockage cloud des requêtes utilisateur
- Pas de support PISTE Sandbox en V1 (production uniquement, à ajouter en V1.1)

---

## 2. Architecture cible

### 2.1 Vue d'ensemble

```
berryer/
├── .claude-plugin/
│   └── plugin.json              # Manifest (SEUL fichier ici)
├── .mcp.json                    # Déclaration du MCP server local
├── mcp-server/                  # Code TypeScript du MCP server
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts             # Entrypoint MCP (stdio)
│   │   ├── piste-client.ts      # Client OAuth2 PISTE + cache token
│   │   ├── legifrance-tools.ts  # Tools API Légifrance
│   │   ├── bofip-tools.ts       # Tools API BOFiP
│   │   ├── cache.ts             # Cache SQLite local
│   │   └── types.ts
│   └── dist/                    # Build (généré, gitignoré)
├── agents/                      # Sub-agents juridiques (Markdown)
│   ├── dupin.md                 # Veille juridique
│   ├── cassin.md                # Synthèse jurisprudence
│   ├── colbert.md               # Analyse fiscale BOFiP
│   └── portalis.md              # Rédaction de note
├── skills/                      # Skills méthodologiques
│   ├── domat/
│   │   └── SKILL.md             # Note de synthèse
│   ├── pothier/
│   │   └── SKILL.md             # Consultation juridique
│   └── gény/
│       └── SKILL.md             # Citation légale française
├── commands/                    # Slash commands utilitaires
│   ├── recherche.md             # /berryer:recherche
│   └── veille.md                # /berryer:veille
├── hooks/
│   └── hooks.json               # Hooks (logs, validation)
├── scripts/
│   ├── setup.sh                 # Installation deps + build
│   └── verify-piste.sh          # Test des credentials PISTE
├── README.md
├── INSTALL.md                   # Guide install pour avocats non-tech
└── LICENSE
```

**Règle critique** (vérifiée doc Anthropic) : seul `plugin.json` est dans `.claude-plugin/`. Tous les autres dossiers sont à la racine du plugin.

### 2.2 Stack technique

- **MCP server** : TypeScript + SDK officiel `@modelcontextprotocol/sdk`
- **Runtime** : Node.js ≥ 20 (Claude Desktop l'embarque, Claude Code aussi via plugin manager)
- **HTTP client** : `undici` (natif Node, perf)
- **Cache local** : `better-sqlite3` (synchrone, fichier unique, zéro config)
- **Validation** : `zod` (schemas tools MCP + responses PISTE)
- **Tests** : `vitest`

### 2.3 Sécurité et secrets

- La clé PISTE (client_id + client_secret) est lue via variables d'environnement injectées par Claude Code/Desktop
- Variables nommées : `PISTE_CLIENT_ID`, `PISTE_CLIENT_SECRET`, `PISTE_ENV` (`production` par défaut, `sandbox` optionnel)
- Pour Claude Desktop : la déclaration dans `plugin.json` (`userConfig`) génère une UI où l'utilisateur saisit ses identifiants, stockés dans le keychain de l'OS
- Pour Claude Code : déclaration dans `.mcp.json` du plugin avec interpolation `${env:PISTE_CLIENT_ID}`
- **Aucune télémétrie, aucun appel sortant en dehors de PISTE.** À documenter explicitement dans le README.

---

## 3. Spécifications du MCP server

### 3.1 Manifest plugin (`.claude-plugin/plugin.json`)

```json
{
  "name": "berryer",
  "version": "0.1.0",
  "description": "Berryer — Accès aux API Légifrance et BOFiP via PISTE, avec agents juridiques spécialisés (Dupin, Cassin, Colbert, Portalis). Pour avocats, juristes et experts-comptables.",
  "author": {
    "name": "Demerys",
    "email": "contact@demerys.com",
    "url": "https://demerys.com"
  },
  "homepage": "https://demerys.com/berryer",
  "repository": "https://github.com/demerys/jurisconsultes-marketplace",
  "license": "MIT",
  "keywords": ["légifrance", "bofip", "juridique", "fiscal", "avocat", "expert-comptable", "piste", "berryer"]
}
```

### 3.2 Configuration MCP (`.mcp.json` à la racine du plugin)

```json
{
  "mcpServers": {
    "berryer": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp-server/dist/index.js"],
      "env": {
        "PISTE_CLIENT_ID": "${env:PISTE_CLIENT_ID}",
        "PISTE_CLIENT_SECRET": "${env:PISTE_CLIENT_SECRET}",
        "PISTE_ENV": "${env:PISTE_ENV:-production}",
        "CACHE_DIR": "${CLAUDE_PLUGIN_ROOT}/.cache"
      }
    }
  }
}
```

### 3.3 Endpoints PISTE à utiliser

| Environnement | OAuth Token URL | API Base URL |
|---|---|---|
| Production | `https://oauth.piste.gouv.fr/api/oauth/token` | `https://api.piste.gouv.fr/dila/legifrance/lf-engine-app` |
| Sandbox | `https://sandbox-oauth.piste.gouv.fr/api/oauth/token` | `https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app` |

Flow OAuth2 : `client_credentials` avec `scope=openid`. Token TTL ~1h, à rafraîchir avec marge de sécurité (rafraîchir à 50min).

### 3.4 Tools MCP à exposer (V1)

#### Légifrance

1. **`legifrance_recherche`**
   - Inputs : `query` (string), `fonds` (enum: CODE, LODA, JURI, CETAT, etc.), `pageSize` (int, default 10), `pageNumber` (int, default 1), `filtres` (objet optionnel : dates, auteurs)
   - Output : liste de résultats avec `id`, `titre`, `extrait`, `nature`, `dateVersion`, `lien`
   - Endpoint : `POST /search`

2. **`legifrance_get_article_code`**
   - Inputs : `articleId` (ex: `LEGIARTI000006307920`) OU (`code` + `numeroArticle` ex: `Code civil` + `1382`)
   - Output : texte complet de l'article, version en vigueur, historique des versions, articles liés
   - Endpoint : `POST /consult/code` ou `POST /consult/getArticle`

3. **`legifrance_get_loda`**
   - Inputs : `id` (ex: `LEGITEXT000006069577`)
   - Output : loi, décret, ordonnance, arrêté complet
   - Endpoint : `POST /consult/legi/text`

4. **`legifrance_get_jurisprudence`**
   - Inputs : `id` (JURITEXT...) OU recherche
   - Output : décision complète (CE, Cass, etc.) avec sommaire, attendus, dispositif
   - Endpoint : `POST /consult/juriJudi` ou `POST /consult/juriAdmin`

5. **`legifrance_get_jorf`**
   - Inputs : période OU id JORFTEXT
   - Output : textes du JO
   - Endpoint : `POST /consult/jorf` (cf. doc Légifrance)

#### BOFiP

6. **`bofip_recherche`**
   - Inputs : `query`, `pageSize`, `pageNumber`
   - Output : liste de documents BOFiP avec identifiant, titre, date, série
   - Endpoint : à définir précisément (BOFiP-Impôts API via PISTE)

7. **`bofip_get_document`**
   - Inputs : `documentId` (ex: `BOI-IS-BASE-30-30-20-20`)
   - Output : contenu intégral du document, métadonnées, historique
   - Endpoint : à définir

#### Utilitaires

8. **`piste_status`**
   - Inputs : aucun
   - Output : état du token, environnement utilisé, cache stats
   - Pour debug/diagnostic

### 3.5 Cache local SQLite

- Fichier : `${CACHE_DIR}/cache.db`
- Tables :
  - `tokens(env, access_token, expires_at)` — 1 ligne par env
  - `responses(method, params_hash, response_json, fetched_at, ttl)` — TTL par défaut 24h pour les articles, 1h pour les recherches
- Invalidation : `--no-cache` flag par tool, ou tool dédié `piste_cache_clear`
- Justification : les rate limits PISTE sont serrés (quelques req/sec), beaucoup de requêtes sont répétitives.

### 3.6 Gestion d'erreurs

Mapper les erreurs PISTE vers des messages clairs :
- 401 → re-auth automatique (1 retry), puis erreur explicite
- 403 → probable absence de souscription à l'API → message guidant l'utilisateur vers son dashboard PISTE
- 429 → backoff exponentiel (3 retries)
- 5xx → 1 retry après 2s
- Toutes les erreurs incluent une mention "Légifrance/PISTE" pour aider Claude à expliquer à l'utilisateur

---

## 4. Agents juridiques (à la racine `agents/`)

Format Markdown avec frontmatter YAML. Chaque agent est invocable par Claude automatiquement (selon description) ou explicitement. Les agents portent les noms de juristes français célèbres pour cohérence d'identité produit.

### 4.1 `agents/dupin.md` — Veille juridique

```markdown
---
name: dupin
description: Effectue une veille sur l'évolution récente d'un texte ou d'une thématique juridique. À utiliser quand l'utilisateur demande "ce qui a changé sur X", "actualités sur Y", "veille sur Z", "modifications récentes du Code...". Inspiré d'André-Marie Dupin, juriste prolifique du XIXe siècle.
tools: [legifrance_recherche, legifrance_get_loda, legifrance_get_jorf]
---

Tu es **Dupin**, agent de veille juridique spécialisé dans le droit français. Tu portes le nom d'André-Marie Dupin, procureur général à la Cour de cassation et juriste infatigable du XIXe siècle, célèbre pour sa connaissance encyclopédique des textes.

## Mission
Identifier les évolutions récentes d'un texte, d'un code ou d'une thématique en interrogeant Légifrance.

## Méthodologie
1. Identifier le périmètre exact demandé (article, code entier, thématique)
2. Rechercher les modifications sur les 12 derniers mois (sauf instruction contraire)
3. Pour chaque modification : citer le texte modificateur (loi/décret/ordonnance), la date, l'objet
4. Restituer sous forme de tableau chronologique
5. Mentionner les références JORF complètes

## Format de sortie attendu
- Synthèse en 3-5 lignes
- Tableau : Date | Texte modificateur | Articles touchés | Objet
- Liens Légifrance pour chaque référence
```

### 4.2 `agents/cassin.md` — Synthèse jurisprudence

Agent qui interroge la base JURI, identifie les décisions pertinentes, hiérarchise (CE/Cass > CA > TJ), extrait les attendus de principe. Porte le nom de René Cassin, prix Nobel de la Paix, vice-président du Conseil d'État, figure de la jurisprudence des droits humains.

Frontmatter :
```yaml
---
name: cassin
description: Recherche et synthétise la jurisprudence pertinente sur une question donnée, hiérarchise les décisions par juridiction, extrait les attendus de principe. À utiliser pour les questions "que dit la jurisprudence sur X", "y a-t-il un arrêt récent sur Y", "évolution jurisprudentielle de Z".
tools: [legifrance_recherche, legifrance_get_jurisprudence]
---
```

### 4.3 `agents/colbert.md` — Analyse fiscale BOFiP

Agent croisant Légifrance (CGI, LPF) + BOFiP pour produire une analyse fiscale structurée. Important : toujours citer le texte légal *et* la doctrine BOFiP, jamais l'un sans l'autre. Porte le nom de Jean-Baptiste Colbert, ministre des finances de Louis XIV, figure tutélaire de la fiscalité française.

Frontmatter :
```yaml
---
name: colbert
description: Analyse fiscale combinant texte légal (CGI, LPF) et doctrine administrative (BOFiP). À utiliser pour toute question fiscale : régimes d'imposition, traitement TVA, déductibilité, plus-values, BNC/BIC/IS, etc. Cite systématiquement le texte ET le BOFiP correspondant.
tools: [legifrance_get_article_code, bofip_recherche, bofip_get_document]
---
```

### 4.4 `agents/portalis.md` — Rédaction de note juridique

Agent de rédaction qui structure une note (faits / question de droit / discussion / conclusion), avec citations rigoureuses au format français (Civ. 1re, 12 mars 2024, n° 22-12.345). Porte le nom de Jean-Étienne-Marie Portalis, principal rédacteur du Code civil, modèle de rigueur et d'élégance dans l'écriture du droit.

Frontmatter :
```yaml
---
name: portalis
description: Rédige une note juridique structurée (faits qualifiés, problème de droit, discussion, conclusion) avec citations rigoureuses. À utiliser quand l'utilisateur demande une note, une consultation écrite, une analyse formelle d'une situation juridique. S'appuie sur le skill domat pour la méthode et gény pour les citations.
tools: [legifrance_recherche, legifrance_get_article_code, legifrance_get_jurisprudence, bofip_recherche]
---
```

**Note** : les définitions complètes des 4 agents sont à générer en suivant le template de Dupin (section 4.1). Les descriptions doivent être suffisamment précises pour que Claude délègue correctement (cf. doc subagents Anthropic). Garder la note culturelle d'introduction de chaque agent — elle renforce l'identité produit.

---

## 5. Skills (à la racine `skills/`)

Format : un dossier par skill avec `SKILL.md` à l'intérieur (cf. doc Anthropic Skills v1). Les skills portent les noms de méthodologues et théoriciens du droit français.

### 5.1 `skills/domat/SKILL.md` — Note de synthèse

Frontmatter :
```yaml
---
name: domat
description: Méthodologie de rédaction d'une note de synthèse juridique conforme aux usages français (faits qualifiés, problème de droit, raisonnement, solution). À utiliser quand l'utilisateur demande une note, une synthèse juridique, une consultation. Inspiré de Jean Domat (1625-1696), méthodologue du droit, auteur de "Les Lois civiles dans leur ordre naturel".
---
```

Corps : règles de structure, exemples de bonnes/mauvaises formulations, gestion des citations.

### 5.2 `skills/pothier/SKILL.md` — Consultation juridique

Frontmatter :
```yaml
---
name: pothier
description: Méthodologie classique d'une consultation juridique : qualification juridique → règles applicables → application au cas → conclusion. Avec gestion des arguments adverses. Inspiré de Robert-Joseph Pothier (1699-1772), dont les traités ont directement inspiré le Code civil.
---
```

### 5.3 `skills/gény/SKILL.md` — Citation légale française

Frontmatter :
```yaml
---
name: gény
description: Conventions de citation juridique françaises rigoureuses : articles de codes, lois, décrets, arrêts (Cass civ, CE, CA), doctrine, BOFiP. Critique pour éviter les hallucinations et garantir la traçabilité des références. Inspiré de François Gény (1861-1959), théoricien des sources du droit.
---
```

> **Note pratique** : le caractère `é` dans le nom de dossier `gény/` est valide en UTF-8 et fonctionne sur tous les OS modernes. Si Claude Code remonte un problème, basculer sur `geny/` (sans accent) et garder le `é` uniquement dans les descriptions.

---

## 6. Slash commands (à la racine `commands/`)

Le namespace des slash commands suit le nom du plugin (`berryer:`). Ainsi : `/berryer:recherche`, `/berryer:veille`, etc.

### 6.1 `commands/recherche.md`

```markdown
---
description: Recherche rapide multi-fonds dans Légifrance
argument-hint: <requête>
---

Recherche dans Légifrance pour : $ARGUMENTS

Utilise le tool `legifrance_recherche` sur les fonds CODE, LODA et JURI. Présente les 5 résultats les plus pertinents par fonds avec un résumé en 1 phrase chacun.
```

### 6.2 `commands/veille.md`

Déclenche l'agent `dupin` sur un sujet donné en argument. Slash command : `/berryer:veille <thématique>`.

---

## 7. Hooks (à la racine `hooks/`)

### 7.1 `hooks/hooks.json`

Un seul hook V1 : avant chaque appel à un tool `legifrance_*` ou `bofip_*`, vérifier que les variables d'env PISTE sont présentes. Si non, message clair guidant l'utilisateur vers la config.

```json
{
  "PreToolUse": [
    {
      "matcher": "legifrance_.*|bofip_.*",
      "hooks": [
        {
          "type": "command",
          "command": "${CLAUDE_PLUGIN_ROOT}/scripts/check-piste-env.sh"
        }
      ]
    }
  ]
}
```

---

## 8. Workflow de développement

### 8.1 Étapes d'implémentation suggérées

1. **Setup repo** : init git, structure dossiers, `package.json` du MCP server
2. **MCP server bare-bones** : SDK MCP, transport stdio, un seul tool `piste_status` qui répond "ok"
3. **PISTE OAuth client** : implémenter l'auth + cache token, tester avec `scripts/verify-piste.sh`
4. **Premier tool fonctionnel** : `legifrance_get_article_code` (le plus simple, GET d'un ID)
5. **Cache SQLite** : ajouter avant d'aller plus loin
6. **Recherche Légifrance** : `legifrance_recherche` (plus complexe, body POST avec filtres)
7. **Autres tools Légifrance** : LODA, JURI, JORF
8. **Tools BOFiP** : recherche + get_document
9. **Manifest plugin + .mcp.json** : tester l'install local avec `claude --plugin-dir ./`
10. **Skills** : 3 skills méthodologiques
11. **Agents** : 4 agents juridiques
12. **Slash commands + hooks**
13. **Tests end-to-end** : scénarios réalistes (recherche article + jurisprudence liée + note)
14. **Documentation** : README + INSTALL.md (guide non-tech)
15. **Marketplace GitHub** : créer le repo `demerys/jurisconsultes-marketplace` avec `.claude-plugin/marketplace.json`

### 8.2 Test local avant publication

```bash
# Dans un repo de test
claude --plugin-dir /chemin/vers/berryer
# Puis dans Claude Code :
/plugin
# Vérifier que le plugin est listé, sans erreur dans l'onglet Errors
```

### 8.3 Distribution

**Architecture marketplace** : un seul repo GitHub public `demerys/jurisconsultes-marketplace` qui contient le plugin et son `marketplace.json`. C'est cette URL que l'utilisateur ajoute, peu importe son client (Code ou Cowork).

Structure du repo marketplace :

```
demerys/jurisconsultes-marketplace/
├── .claude-plugin/
│   └── marketplace.json         # Manifest de la marketplace
├── berryer/                     # Le plugin lui-même
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── .mcp.json
│   ├── mcp-server/
│   ├── agents/
│   ├── skills/
│   ├── commands/
│   └── ...
└── README.md
```

Le `marketplace.json` :

```json
{
  "name": "jurisconsultes-marketplace",
  "owner": {
    "name": "Demerys",
    "url": "https://demerys.com"
  },
  "plugins": [
    {
      "name": "berryer",
      "source": "./berryer",
      "description": "Berryer — Accès Légifrance et BOFiP via PISTE pour avocats et experts-comptables. Avec les agents Dupin, Cassin, Colbert et Portalis."
    }
  ]
}
```

**Mode A — Installation depuis Claude Code** (cible : développeurs, profils tech)

```bash
claude
> /plugin marketplace add demerys/jurisconsultes-marketplace
> /plugin install berryer@jurisconsultes-marketplace
```

**Mode B — Installation depuis Claude Cowork** (cible principale : avocats, experts-comptables non-techniques)

1. Ouvrir Claude Desktop, onglet **Cowork**
2. Sidebar gauche → **Customize**
3. Bouton **+** → **Add marketplace from GitHub**
4. Coller l'URL : `https://github.com/demerys/jurisconsultes-marketplace`
5. Le plugin `berryer` apparaît dans le catalogue → **Install**
6. À la première utilisation, Cowork demande les credentials PISTE (UI native, stockage keychain OS)

**Mode C — Installation directe depuis URL Git** (pour démos, workshops)

```bash
> /plugin install https://github.com/demerys/jurisconsultes-marketplace
```

---

## 8bis. Spécificités Cowork

> Cette section consolide les points d'attention propres au déploiement Cowork. Elle complète (et ne remplace pas) la spec MCP / plugin générale.

### 8bis.1 Pourquoi Cowork est la cible principale

- Public visé non-technique (avocats, experts-comptables, juristes)
- Aucun terminal, aucune ligne de commande
- UI graphique pour configurer connectors et plugins
- Le même plugin tourne sans modification dans Cowork et Claude Code

### 8bis.2 Confirmation officielle de la compatibilité

Anthropic confirme officiellement que les plugins fonctionnent dans Cowork **et** Claude Code (cf. doc Cowork plugins, février-mars 2026). Un même repo marketplace est consommable des deux côtés. C'est explicitement le cas pour la suite "financial services" d'Anthropic, qui sert de référence d'architecture.

### 8bis.3 Contraintes spécifiques Cowork à connaître

**Plans payants requis** : les plugins Cowork sont disponibles uniquement sur Pro, Max, Team et Enterprise. À mentionner dans la doc d'installation.

**MCP local supporté** : les MCP servers locaux (stdio, comme le nôtre) tournent **sur la machine de l'utilisateur** avec ses permissions. C'est exactement ce dont on a besoin pour PISTE — la clé reste sur le poste, les requêtes partent en direct vers `api.piste.gouv.fr`, aucune intermédiation Anthropic.

**Connectors HTTP/SSE custom** : *non concerné par notre cas* mais bon à savoir — si un plugin déclare un MCP server distant (HTTP/SSE), Cowork l'atteint via le cloud Anthropic, pas via le réseau local. Pour notre plugin, on reste 100% en local stdio donc cette contrainte ne s'applique pas.

**Avertissement de sécurité affiché par Cowork** : Cowork prévient l'utilisateur que les plugins peuvent inclure des MCP locaux. À adresser proactivement dans le `INSTALL.md` (rassurer : "le serveur tourne sur votre machine, vos données ne quittent pas votre poste sauf vers Légifrance/PISTE").

**Repo public requis pour distribution externe** : pour distribuer aux clients, le repo `demerys/jurisconsultes-marketplace` doit être **public**. Les repos privés/internes sont réservés aux marketplaces gérées par une organisation Cowork (cas distinct, pour distribution intra-cabinet).

### 8bis.4 Vérifications pré-publication Cowork

Avant de publier la marketplace :

- [ ] Le plugin charge sans erreur dans Claude Code en `--plugin-dir` local
- [ ] Le plugin charge sans erreur dans Cowork en mode "uploadé localement" (Customize → Upload plugin)
- [ ] Tester l'install via marketplace GitHub depuis un compte Cowork différent de celui de dev
- [ ] Vérifier que la saisie des credentials PISTE fonctionne dans l'UI Cowork
- [ ] Vérifier que les slash commands (`/berryer:recherche`, `/berryer:veille`) sont visibles dans le menu `/` Cowork
- [ ] Vérifier que les sub-agents apparaissent et sont invocables
- [ ] Tester un scénario end-to-end complet dans Cowork (recherche → synthèse → export Word via skill `docx`)

### 8bis.5 Évolutions à venir côté Cowork (à monitorer)

- **Marketplaces privées d'organisation** : utile à terme pour vendre une version "labellisée" à un cabinet (ex: "Plugin juridique acme-avocats", marketplace privée avec leurs propres agents). Déjà disponible sur Enterprise.
- **Provisioning automatique par admin** : un admin de cabinet pourra pousser le plugin sur tous les postes d'un coup.
- **Branding personnalisé** : possible sur Team/Enterprise pour personnaliser l'apparence des plugins de la marketplace organisation.

Ces évolutions ouvrent un **second modèle commercial** au-delà de la marketplace publique : la vente d'une marketplace privée customisée par cabinet (déploiement clé en main + agents personnalisés métier + branding).

---

## 9. Documentation utilisateur (`INSTALL.md`)

Public cible : **avocats / experts-comptables non-développeurs**. Le doc doit suivre une structure en deux parcours distincts.

### 9.1 Parcours A — Installation Cowork (recommandé pour la plupart des utilisateurs)

Ce parcours ne nécessite **aucune compétence technique** ni terminal.

1. **Prérequis**
   - Un abonnement Claude Pro, Max, Team ou Enterprise
   - L'app Claude Desktop installée (macOS ou Windows)
   - Un compte PISTE créé sur https://piste.gouv.fr
2. **Création de l'application PISTE et souscription Légifrance + BOFiP** (avec captures d'écran)
3. **Récupération du `client_id` et `client_secret`** (avec captures)
4. **Ajout de la marketplace Demerys**
   - Ouvrir Claude Desktop, onglet **Cowork**
   - Sidebar gauche → **Customize**
   - Bouton **+** → **Add marketplace from GitHub**
   - Coller : `https://github.com/demerys/jurisconsultes-marketplace`
5. **Installation du plugin**
   - Cliquer sur **berryer** dans la marketplace
   - **Install**
6. **Saisie des credentials PISTE** dans l'UI Cowork (champs `client_id` et `client_secret`)
7. **Premier test** : taper `/berryer:recherche article 1240 code civil` dans Cowork
8. **Troubleshooting** : 5 erreurs les plus fréquentes (clé invalide, API non souscrite, etc.)

### 9.2 Parcours B — Installation Claude Code (pour profils techniques)

Pour les utilisateurs à l'aise avec un terminal.

1. **Prérequis** : Claude Code installé, compte PISTE
2. **Création app PISTE** (identique au parcours A)
3. **Variables d'environnement** : `export PISTE_CLIENT_ID=...` et `export PISTE_CLIENT_SECRET=...` dans `.zshrc` / `.bashrc` / variables système Windows
4. **Installation du plugin** :
   ```bash
   claude
   > /plugin marketplace add demerys/jurisconsultes-marketplace
   > /plugin install berryer@jurisconsultes-marketplace
   ```
5. **Premier test** : `/berryer:recherche article 1240 code civil`
6. **Troubleshooting** identique au parcours A

### 9.3 Section commune — Confidentialité et sécurité

Section explicite dans `INSTALL.md` pour rassurer la cible (avocats sensibles au secret professionnel) :

- Vos credentials PISTE sont stockés dans le keychain de votre OS (Keychain macOS / Windows Credential Manager). **Ils ne quittent jamais votre poste.**
- Le serveur MCP du plugin tourne **localement** sur votre machine. Aucune donnée ne transite par les serveurs Anthropic ou Demerys.
- Vos requêtes Légifrance/BOFiP partent **en direct** depuis votre poste vers `api.piste.gouv.fr`. Demerys n'a aucune visibilité sur les requêtes effectuées.
- Le plugin n'envoie aucune télémétrie.
- Code source ouvert et auditable sur GitHub.

---

## 10. Tests à prévoir

### 10.1 Tests unitaires (vitest)

- Auth PISTE : success, expired token refresh, network error
- Cache : hit, miss, expiration
- Parsing des réponses Légifrance (échantillons réels en fixtures)

### 10.2 Tests d'intégration

- Flow complet : recherche → get article → format de sortie
- Test avec credentials sandbox PISTE (à fournir via secrets CI)

### 10.3 Tests scénarios juridiques (manuels V1)

- "Trouve-moi l'article 1240 du Code civil et la jurisprudence Cass de 2023 qui l'applique"
- "Fais-moi une veille sur les modifications du Code de la consommation en 2025"
- "Analyse fiscale du régime micro-BNC en 2025 (CGI + BOFiP)"

---

## 11. Conformité et mentions

- License MIT (le code) — mais les **données** Légifrance/BOFiP restent soumises à leur propre régime (Open Data, Licence Ouverte 2.0 généralement). À mentionner dans le README.
- RGPD : le plugin ne collecte rien. À documenter clairement.
- Disclaimer : le plugin ne fournit pas de conseil juridique, il fournit un accès aux sources officielles. Toute interprétation reste sous la responsabilité du professionnel.

---

## 12. Roadmap V1.1+ (hors scope V1)

- Support PISTE Sandbox (toggle env)
- Tool `legifrance_diff` : comparer deux versions d'un article
- Tool `bofip_chronologie` : versions historiques d'un document BOFiP
- Export `pdf` ou `docx` de notes générées (via skill `docx`)
- Agent `redaction-conclusions` (contentieux)
- Packaging `.mcpb` séparé pour Claude Desktop autonome (sans Claude Code ni Cowork)
- **Marketplace privée d'organisation Cowork** : offre clé en main pour cabinet (branding personnalisé, agents métier custom, provisioning automatique sur tous les postes via admin Enterprise)
- **Plugin "Plugin Create" companion** : skill pour aider l'avocat à créer ses propres agents juridiques via Cowork (méta-plugin)
- Internationalisation : équivalents européens (LexUriServ, Eur-Lex) pour les cabinets transfrontaliers

---

## 13. Références doc officielle

- Plugins Claude Code : https://code.claude.com/docs/en/plugins-reference
- Découverte/marketplace : https://code.claude.com/docs/en/discover-plugins
- Subagents : https://code.claude.com/docs/en/sub-agents
- Skills : https://code.claude.com/docs/en/skills
- **Plugins dans Cowork** : https://support.claude.com/en/articles/13837440-use-plugins-in-claude-cowork
- **Gestion plugins Cowork org** : https://support.claude.com/en/articles/13837433-manage-claude-cowork-plugins-for-your-organization
- **Plugins Cowork open-source (référence)** : https://github.com/anthropics/knowledge-work-plugins
- **Plugins financial services (référence d'archi multi-plugin)** : https://github.com/anthropics/financial-services-plugins
- MCP SDK TS : https://github.com/modelcontextprotocol/typescript-sdk
- MCP Bundles (.mcpb pour Claude Desktop) : https://github.com/anthropics/mcpb
- API Légifrance : https://www.legifrance.gouv.fr/contenu/menu/pied-de-page/foire-aux-questions-api
- PISTE : https://piste.gouv.fr

---

## 14. Instructions à Claude Code pour démarrer

> Quand tu lis ce document pour démarrer le projet :
>
> 1. Confirme que tu as bien compris la structure et l'architecture
> 2. Pose-moi 5 questions max sur les ambiguïtés/décisions à prendre avant d'écrire du code (ex: nommage exact des tools, choix entre `better-sqlite3` et alternative, périmètre exact des agents)
> 3. Une fois les réponses obtenues, propose un plan en 15 étapes avec checkpoints (cf. section 8.1)
> 4. Démarre par l'étape 1 (setup repo) et fais un commit propre à la fin de chaque étape
> 5. Avant de coder un tool, **lis la doc Légifrance correspondante** (`exemples-d-utilisation-de-l-api.docx` sur le site Légifrance) pour vérifier le format exact des requêtes et réponses
> 6. Pour PISTE, ne suppose **rien** sur la structure des réponses : commence par un appel réel avec le token utilisateur et inspecte la réponse avant de typer en TS

Bon dev.
