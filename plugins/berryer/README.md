# Berryer — votre cabinet juridique français dans Claude

> Un plugin Claude (Code, Cowork, Desktop) qui met à disposition une équipe de juristes spécialisés, branchée en direct sur **Légifrance** et le **BOFiP**, sans qu'aucune donnée ne quitte votre poste.

---

## Le concept — un cabinet d'experts français à la demande

Quand vous avez une question juridique, vous ne consultez pas un généraliste. Vous appelez le **bon spécialiste**.

Berryer reproduit ce schéma. Le plugin embarque une équipe de juristes virtuels, chacun spécialisé dans un domaine, chacun portant le nom d'une figure du droit français. Vous parlez à Claude en langage naturel — Claude délègue automatiquement à l'expert pertinent, qui interroge Légifrance ou le BOFiP avec **vos** identifiants PISTE et vous restitue le travail signé de sa main.

C'est une équipe que vous n'avez pas à manager. Elle se coordonne d'elle-même.

---

## L'équipe

### **Berryer** — *Le patron du cabinet*
**Pierre-Antoine Berryer** (1790-1868), grand orateur du barreau, parlementaire. Il donne son nom au plugin tout entier — c'est l'identité du cabinet, la signature commune.

### **Dupin** — *L'agent de veille juridique*
**André-Marie Dupin** (1783-1865), procureur général à la Cour de cassation, juriste prolifique du XIXᵉ siècle, surnommé « le procureur infatigable ». Il suivait à la trace l'évolution de tous les textes de son temps.

> **Quand il intervient** : « Qu'est-ce qui a changé dans le Code de la consommation depuis 2024 ? », « Quoi de neuf au JO sur le démarchage à domicile ? », « Veille fiscale 2026 ».
>
> **Ce qu'il livre** : un tableau ou une prose chronologique des modifications, avec NOR, lien Légifrance, articles touchés et objet — directement utilisable dans une note de pratique.

### **Cassin** — *L'agent de jurisprudence*
**René Cassin** (1887-1976), prix Nobel de la paix, vice-président du Conseil d'État, président de la Cour européenne des droits de l'homme. Figure tutélaire de la jurisprudence des droits humains.

> **Quand il intervient** : « Que dit la Cour de cassation sur la responsabilité du fait des choses ? », « Y a-t-il un arrêt récent sur la prescription quinquennale ? », « Évolution de la jurisprudence du CE sur les marchés publics ».
>
> **Ce qu'il livre** : 3 à 7 décisions hiérarchisées (Assemblée plénière > section > restreinte ; FS-B+R > Bull. > diffusion), avec **l'attendu de principe cité mot pour mot** entre guillemets, le numéro de pourvoi et le lien Légifrance.

### **Colbert** — *L'agent fiscal*
**Jean-Baptiste Colbert** (1619-1683), contrôleur général des finances de Louis XIV, fondateur de l'État fiscal moderne. Le nom est convoqué en clin d'œil mais aussi parce qu'il rappelle la **rigueur** attendue en fiscalité.

> **Quand il intervient** : « Régime micro-BNC en 2026 », « TVA déductible sur véhicule de fonction », « Plus-value de cession d'actions de société », « Contrôle fiscal et droit à l'erreur ».
>
> **Ce qu'il livre** : pour chaque question, **systématiquement le texte légal (CGI, LPF) ET la doctrine BOFiP correspondante**. Une analyse fiscale qui ne croise pas les deux sources est incomplète, c'est sa règle. Toujours assortie d'un disclaimer sur la sécurisation par rescrit (LPF L. 80 B).

### **Portalis** — *Le rédacteur en chef*
**Jean-Étienne-Marie Portalis** (1746-1807), principal rédacteur du Code civil, dont le *Discours préliminaire* reste un modèle de rigueur et d'élégance dans l'écriture du droit.

> **Quand il intervient** : « Rédige-moi une note pour mon client sur cette affaire », « J'ai besoin d'une consultation écrite », « Mémo sur le risque contentieux ».
>
> **Ce qu'il livre** : une note structurée *prête à être envoyée à un client*. Faits qualifiés, problème de droit, discussion (avec arguments adverses), conclusion + recommandation opérationnelle + niveau de confiance + disclaimer. Il **intègre** les retours de Dupin, Cassin, Colbert et David sans refaire leur travail.

### **David** — *Le traducteur et comparatiste*
**René David** (1906-1990), comparatiste, auteur des *Grands Systèmes de Droit Contemporains*, qui a participé à des codifications dans plusieurs pays.

> **Quand il intervient** : « Traduis-moi cette clause d'indemnification », « Décrypte ce SaaS agreement Delaware », « Audit de risque sur ce NDA en anglais », « Version bilingue de mon avenant ».
>
> **Ce qu'il livre** : la traduction faithful + un signalement explicite des **faux-amis** (consideration ≠ contrepartie, warranty ≠ garantie, indemnification ≠ indemnisation, estoppel = ?, *liquidated damages* vs clause pénale art. 1231-5 C. civ.). Embarque un lexique de 14 concepts non équivalents avec leur base légale française la plus proche.

---

## Les méthodologistes — *les skills derrière les agents*

Trois méthodes de travail sont chargées automatiquement par les agents quand le contexte l'exige. Ce sont les **règles de l'art** françaises, codifiées une fois pour toutes :

### **Domat** — *La méthode de la note de synthèse*
**Jean Domat** (1625-1696), méthodologue du droit, auteur des *Lois civiles dans leur ordre naturel*. La structure imposée : **faits qualifiés → problème de droit → discussion → conclusion**. Pas négociable. Toute note de Portalis suit ce squelette.

### **Pothier** — *La méthode de la consultation*
**Robert-Joseph Pothier** (1699-1772), dont les traités ont directement inspiré le Code civil. Sa méthode : **qualification → règles applicables → application au cas → discussion contradictoire → conclusion + recommandation**, avec un **niveau de confiance explicite** (« certain », « probable », « discuté », « incertain », « risqué »).

### **Gény** — *Les conventions de citation*
**François Gény** (1861-1959), théoricien des sources du droit. Il garantit que **chaque citation est rigoureuse** : `art. 1240 C. civ.`, `Cass. civ. 1ʳᵉ, 12 mars 2024, n° 22-12.345, FS-B+R`, `BOI-IS-BASE-30-30-20-20, publié le 12 mai 2023, n° 50`. Aucune référence inventée n'est tolérée — si l'agent n'a pas vérifié sur Légifrance, il dit « à confirmer » plutôt que d'inventer.

---

## Pourquoi le plugin est fiable

### Aucune référence inventée

Chaque article cité, chaque arrêt mentionné, chaque fiche BOFiP référencée a été **réellement consultée sur Légifrance** au moment de la réponse. Le plugin a été conçu autour d'un principe : si l'agent n'a pas pu vérifier, il le dit explicitement. Pas d'hallucination déguisée en certitude.

Concrètement :
- Tous les schémas de réponse sont calés sur des **captures réelles** de l'API Légifrance (pas sur la doc qui ment), avec 5 fixtures réelles servant de filet anti-régression.
- Les attendus de jurisprudence sortent **mot pour mot** du texte officiel, en blockquote — pas paraphrasés.
- Les liens Légifrance sont systématiquement fournis : si vous doutez, vous cliquez et vous vérifiez.

### Aucune donnée ne sort de votre poste

C'est l'argument central pour avocats et experts-comptables :

- **Vos credentials PISTE** sont stockés dans le **keychain de votre OS** (Keychain macOS, Credential Manager Windows). Ils ne quittent jamais votre poste.
- **Le serveur MCP du plugin tourne localement** sur votre machine. Aucune intermédiation Demerys ou Anthropic.
- **Vos requêtes** Légifrance/BOFiP partent **en direct** depuis votre poste vers `api.piste.gouv.fr`. Demerys n'a **aucune visibilité** sur les questions que vous posez à Berryer.
- **Aucune télémétrie**.
- **Code source ouvert** et auditable.

### Robuste face aux hoquets de l'infrastructure publique

Les API publiques françaises (DILA notamment) ont des hoquets transitoires connus. Le plugin **retry automatiquement jusqu'à 5 fois** avec backoff exponentiel (jusqu'à ~40 sec), et ses messages d'erreur sont conçus pour ne **pas** induire les agents en erreur de diagnostic.

---

## Pourquoi le plugin est efficace

### La délégation automatique — l'essentiel à retenir

**Vous n'avez pas à invoquer les agents explicitement.** Quand vous écrivez à Claude en langage naturel, il analyse votre intention et délègue à l'agent pertinent — exactement comme un assistant qui transfère votre appel au bon spécialiste du cabinet.

> Vous écrivez : *« Mon client a reçu un redressement TVA sur des prestations de conseil internationales, qu'est-ce qui s'applique ? »*
>
> Claude reconnaît la nature fiscale → **Colbert** prend la main → croise CGI, LPF et BOFiP → réponse complète avec les références.

> Vous écrivez : *« Y a-t-il eu une décision récente sur la responsabilité du dépositaire en garde-meuble ? »*
>
> Claude reconnaît la recherche jurisprudentielle → **Cassin** prend la main → recherche JURI + extraction d'attendus.

C'est même valable pour les **chaînages complexes** : si vous demandez « rédige-moi une note sur les modifications récentes du Code de la consommation et la jurisprudence associée », Claude orchestre **Dupin → Cassin → Portalis** sans que vous ayez à le piloter.

### Le cache local

Vos requêtes répétitives vers Légifrance/BOFiP sont mises en cache localement (SQLite, fichier `.cache/cache.db` dans le plugin). Une seconde consultation du même article est instantanée. TTL : 24 h pour les contenus stables, 1 h pour les recherches.

### Les slash commands — pour les utilisateurs power

Pour ceux qui veulent court-circuiter le langage naturel, deux commandes rapides :

```
/berryer:recherche <termes>
```
Lance une recherche multi-fonds (codes, lois, jurisprudence) en parallèle, top 5 par fond.

```
/berryer:veille <thématique>
```
Délègue directement à Dupin pour une veille sur 12 mois.

---

## Exemples de prompts

### Recherche d'article + jurisprudence
```
Donne-moi l'article 1240 du Code civil et les 5 décisions les plus 
récentes de la Cour de cassation qui l'appliquent en matière de 
préjudice moral.
```
→ tool `legifrance_get_article` + délégation à **Cassin** (recherche JURI + extraction des attendus).

### Veille thématique
```
Veille sur les modifications du Code de la consommation depuis 
janvier 2025. Synthèse en 5 lignes + tableau chronologique.
```
→ délégation à **Dupin** : recherche LODA + JORF, get_loda pour récupérer les NOR, restitution structurée.

### Analyse fiscale
```
Mon client est un consultant indépendant en informatique qui veut 
passer en micro-BNC en 2026. Quels sont les seuils, conditions, 
et le risque par rapport à la franchise TVA ?
```
→ délégation à **Colbert** : croisement CGI art. 102 ter + 293 B + LPF + BOFiP BOI-BNC-DECLA-… avec disclaimer rescrit.

### Note de synthèse complète
```
À partir de l'arrêt Cass. soc. du 8 octobre 2025 n° 23-23.501, 
rédige-moi une note pour un DRH client : peut-il encore contester 
la nullité d'une transaction signée en 2018 ?
```
→ délégation à **Portalis** qui charge automatiquement les skills **Domat** (structure) et **Gény** (citations), récupère l'arrêt via `legifrance_get_jurisprudence`, applique au cas, conclut avec niveau de confiance + recommandations.

### Traduction d'un contrat anglo-saxon
```
J'ai reçu ce SaaS agreement gouverné par le droit du Delaware. 
La clause d'indemnification dit : "Customer shall indemnify and 
hold Provider harmless from any third-party claims arising from 
Customer's misuse of the Service, including reasonable attorneys' 
fees and court costs." Traduis et explique-moi le risque côté 
droit français si on contre-signe en France.
```
→ délégation à **David** : traduction littérale + signalement que `indemnification` ≠ `indemnisation` (plutôt **garantie de passif** sous art. 1231-3 C. civ., soumise à la prévisibilité). Identification du risque (pas de cap chiffré, attorneys' fees inclus = exposition illimitée).

### Diagnostic de la connexion
```
piste_status
```
→ retourne un diagnostic complet : credentials présents ? OAuth fonctionne ? API Légifrance répond ? État du cache.

---

## Installation

Voir [INSTALL.md](./INSTALL.md) pour le guide complet en deux parcours :
- **Parcours A — Cowork (sans terminal)** : `Customize → + → Add marketplace from GitHub → Install`. Recommandé pour avocats / experts-comptables non-tech.
- **Parcours B — Claude Code (terminal)** : `/plugin marketplace add demerys/berryer` puis `/plugin install berryer@berryer-suite`.

Dans tous les cas, vous aurez besoin d'un compte **PISTE** ([piste.gouv.fr](https://piste.gouv.fr)) avec souscription aux API Légifrance et BOFiP.

---

## Outils MCP exposés (référence technique)

Pour les développeurs qui veulent appeler directement les tools sans passer par les agents :

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
| `piste_status` | Diagnostic complet (credentials + OAuth + API live) |
| `piste_cache_clear` | Vide le cache local |

---

## Confidentialité — section essentielle pour la profession

Cette section répète les engagements en raison de leur importance pour les professions soumises au secret professionnel.

> Vos credentials PISTE sont stockés dans le **keychain de votre OS**. Ils ne quittent jamais votre poste.
>
> Le serveur MCP du plugin tourne **localement** sur votre machine. **Aucune donnée ne transite** par les serveurs Anthropic ou Demerys.
>
> Vos requêtes Légifrance/BOFiP partent **en direct** depuis votre poste vers `api.piste.gouv.fr`. **Demerys n'a aucune visibilité** sur les questions que vous posez ni sur les documents que vous traitez.
>
> Le plugin **n'envoie aucune télémétrie**.
>
> Le **code source est ouvert et auditable** sur GitHub.

Si Claude Cowork affiche un avertissement de sécurité concernant les MCP locaux, il fait référence à **cette architecture** — c'est précisément l'effet recherché pour le secret professionnel et la conformité RGPD.

---

## Licences et conformité

- **Code du plugin** : licence **EUPL-1.2** (Licence publique de l'Union européenne v1.2), voir [LICENSE](../../LICENSE) et [NOTICE](../../NOTICE) à la racine du monorepo. Politique d'usage du nom commercial Demerys : [TRADEMARK.md](../../TRADEMARK.md).
- **Données Légifrance et BOFiP** : diffusées par la DILA et la DGFiP sous **Licence Ouverte v2.0** ([Etalab](https://www.etalab.gouv.fr/wp-content/uploads/2017/04/ETALAB-Licence-Ouverte-v2.0.pdf)). Cette licence s'applique aux contenus que vous récupérez via le plugin.
- **RGPD** : le plugin ne collecte ni ne transmet aucune donnée personnelle. Vos requêtes ne sont stockées qu'en cache local.
- **Disclaimer** : Berryer fournit un **accès aux sources officielles** et une aide à la recherche/rédaction. **Il ne fournit pas de conseil juridique**. Toute interprétation reste sous la responsabilité du professionnel utilisateur.

---

## Roadmap V1.1+

- Récupération du **texte intégral** des fiches BOFiP via l'endpoint dédié (DGFiP)
- Tool `legifrance_diff` pour comparer deux versions d'un article
- Tool `bofip_chronologie` pour les versions historiques d'une fiche
- Export PDF/DOCX des notes générées
- **Marketplace privée d'organisation Cowork** : offre clé en main pour cabinet (branding personnalisé, agents métier custom, provisioning automatique)
- Internationalisation (Eur-Lex pour les cabinets transfrontaliers)

---

## Support

- **Issues GitHub** : [demerys/berryer/issues](https://github.com/demerys/berryer/issues) — bugs reproductibles, demandes de feature, questions techniques publiques
- **Site officiel** : [berryer-landing.netlify.app](https://berryer-landing.netlify.app/)
- **Site éditeur** : [demerys.com](https://demerys.com) — formulaire de contact en bas de page (préciser `[BERRYER]` en objet)

---

*« Un plugin n'est pas un outil. C'est une équipe. »*
