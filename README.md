# Berryer — plugin Claude pour le droit français

> Accès aux API **Légifrance** et **BOFiP** via PISTE, avec agents juridiques spécialisés (Dupin, Cassin, Colbert, Portalis), pour avocats, juristes et experts-comptables.

`berryer` est un plugin Claude (Code, Cowork, Desktop) édité par [Demerys](https://demerys.com). Il connecte Claude aux sources juridiques officielles françaises et fournit des agents méthodologiques pour la recherche, la veille, l'analyse fiscale et la rédaction.

## Pourquoi ce plugin ?

- **Vos sources** : interrogation directe de Légifrance et BOFiP via votre propre clé PISTE.
- **Vos données** : aucune intermédiation Demerys. Le serveur MCP tourne **localement**, vos credentials restent dans le keychain de votre OS, vos requêtes partent en direct vers `api.piste.gouv.fr`.
- **Agents spécialisés** : Dupin (veille), Cassin (jurisprudence), Colbert (fiscal CGI + BOFiP), Portalis (rédaction).
- **Méthodologie française** : skills Domat (note de synthèse), Pothier (consultation), Gény (citations rigoureuses).

## Identité

Tous les composants portent le nom de juristes français célèbres :

| Composant | Personnalité |
|---|---|
| `berryer` (plugin) | Pierre-Antoine Berryer (1790-1868), grand orateur du barreau |
| `dupin` (agent veille) | André-Marie Dupin (1783-1865), procureur général à la Cour de cassation |
| `cassin` (agent jurisprudence) | René Cassin (1887-1976), prix Nobel, vice-président du Conseil d'État |
| `colbert` (agent fiscal) | Jean-Baptiste Colbert (1619-1683), figure tutélaire des finances |
| `portalis` (agent rédaction) | Jean-Étienne-Marie Portalis (1746-1807), rédacteur du Code civil |
| `domat` (skill note) | Jean Domat (1625-1696), méthodologue du droit |
| `pothier` (skill consultation) | Robert-Joseph Pothier (1699-1772), inspirateur du Code civil |
| `gény` (skill citations) | François Gény (1861-1959), théoricien des sources du droit |

## Installation rapide

Voir [INSTALL.md](./INSTALL.md) pour le guide complet (parcours Cowork pour avocats non-tech, parcours Claude Code pour les profils techniques).

**TL;DR Claude Code** :
```bash
claude
> /plugin marketplace add demerys/jurisconsultes-marketplace
> /plugin install berryer@jurisconsultes-marketplace
```

**TL;DR Cowork** : `Customize → + → Add marketplace from GitHub → https://github.com/demerys/jurisconsultes-marketplace → Install berryer`.

Dans tous les cas, vous aurez besoin d'un compte PISTE ([piste.gouv.fr](https://piste.gouv.fr)) avec souscription aux API Légifrance et BOFiP.

## Tools MCP exposés

| Tool | Description |
|---|---|
| `legifrance_recherche` | Recherche unifiée multi-fonds (CODE, LODA, JURI, JORF, **CIRC** pour BOFiP, etc.) |
| `legifrance_get_article` | Article d'un code par ID ou par couple code+num |
| `legifrance_get_code` | Sommaire d'un code |
| `legifrance_get_loda` | Loi/décret/ordonnance/arrêté complet |
| `legifrance_get_jurisprudence` | Décision Cass / CE / CA |
| `legifrance_get_jorf` | Texte du Journal officiel |
| `legifrance_get_circulaire` | Circulaire ou fiche BOFiP (`BOI-…`) |
| `legifrance_suggest` | Autocomplete cross-fond |
| `piste_status` | Diagnostic (env, credentials, cache) |
| `piste_cache_clear` | Vide le cache local |

## Slash commands

- `/berryer:recherche <termes>` — recherche rapide multi-fonds
- `/berryer:veille <thème>` — délègue à Dupin pour une veille thématique

## Confidentialité et sécurité

- Les credentials PISTE (`PISTE_CLIENT_ID`, `PISTE_CLIENT_SECRET`) sont stockés dans le **keychain de votre OS** (Keychain macOS, Credential Manager Windows). **Ils ne quittent jamais votre poste.**
- Le serveur MCP **tourne localement** (stdio). Aucune donnée ne transite par les serveurs Anthropic ou Demerys.
- Vos requêtes Légifrance/BOFiP partent **en direct** depuis votre poste vers `api.piste.gouv.fr`.
- Le plugin **n'envoie aucune télémétrie**.
- **Code source ouvert et auditable** sur GitHub.
- Cache local SQLite dans `${CLAUDE_PLUGIN_ROOT}/.cache/cache.db` (ignoré par git).

## Licences et conformité

- **Code** : MIT, voir [LICENSE](./LICENSE).
- **Données** : Légifrance et BOFiP sont diffusés sous **Licence ouverte v2.0** ([Etalab](https://www.etalab.gouv.fr/wp-content/uploads/2017/04/ETALAB-Licence-Ouverte-v2.0.pdf)). Cette licence s'applique aux contenus que vous récupérez via le plugin.
- **RGPD** : le plugin ne collecte ni ne transmet aucune donnée personnelle. Vos requêtes ne sont stockées qu'en cache local.
- **Disclaimer** : Berryer fournit un accès aux sources officielles. Il ne fournit pas de conseil juridique. Toute interprétation reste sous la responsabilité du professionnel utilisateur.

## Développement

```bash
cd mcp-server
npm install
npm run build
npm test           # tests vitest (25+ tests)
npm run typecheck
```

Pour capturer une réponse PISTE réelle en fixture :

```bash
PISTE_CLIENT_ID=… PISTE_CLIENT_SECRET=… \
  bash scripts/capture-fixture.sh POST /consult/getArticle \
  '{"id":"LEGIARTI000006417707"}' article-1240-code-civil
```

Pour vérifier la connectivité PISTE :

```bash
PISTE_CLIENT_ID=… PISTE_CLIENT_SECRET=… bash scripts/verify-piste.sh
```

## Support

- Issues GitHub : [demerys/jurisconsultes-marketplace](https://github.com/demerys/jurisconsultes-marketplace/issues)
- Email : contact@demerys.com
- Site : [demerys.com](https://demerys.com)

## Roadmap V1.1+

- Support PISTE Sandbox (toggle env)
- Tool `legifrance_diff` (compare deux versions d'un article)
- Tool `bofip_chronologie` (versions historiques d'une fiche)
- Export PDF/DOCX des notes générées (skill `docx`)
- Marketplace privée d'organisation Cowork (clé en main pour cabinet, branding personnalisé)
- Internationalisation (Eur-Lex pour les cabinets transfrontaliers)
