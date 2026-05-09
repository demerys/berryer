# Template — Mail d'invitation au programme beta Berryer

À adapter selon le destinataire (cabinet d'avocats / expertise comptable, niveau technique du contact). Trois variantes ci-dessous.

---

## Variante A — Cabinet d'avocats, contact non-tech (associé / juriste)

**Objet** : Programme beta privé — un cabinet juridique virtuel français connecté à Légifrance

> Cher Maître [Nom],
>
> Nous lançons en beta privée **Berryer**, un plugin pour Claude (l'IA d'Anthropic) que nous avons développé chez Demerys et que nous aimerions vous proposer de tester avant sa sortie publique.
>
> En quelques mots : Berryer met à disposition une **équipe de juristes virtuels** branchée en direct sur Légifrance et le BOFiP, via votre propre clé PISTE. Vous parlez à Claude en langage naturel, et selon votre question, c'est Cassin qui cherche la jurisprudence, Colbert qui croise CGI et BOFiP, Portalis qui rédige une note structurée, ou David qui traduit un contrat anglo-saxon — le tout sans qu'aucune donnée ne quitte votre poste.
>
> Ce que nous vous proposons :
>
> 1. **2 à 4 semaines** d'accès gratuit au plugin sur 1 ou 2 postes de votre cabinet
> 2. **6 prompts test** que vous lancez quand vous avez 5 minutes (recherche d'arrêt, note de synthèse, analyse fiscale, etc.)
> 3. **Vos retours** par email — pas de formulaire, pas de questionnaire, juste vos remarques au fil de l'eau
>
> Pré-requis :
> - Un compte sur [piste.gouv.fr](https://piste.gouv.fr) (gratuit, 5 minutes de création) avec souscription à l'API Légifrance — qu'on peut vous aider à configurer si besoin
> - Un abonnement Claude (Pro, Max, Team ou Enterprise) — la version Pro à 22€/mois suffit pour le test
> - Node.js ≥ 20 installé sur votre poste (téléchargement gratuit en 4 clics sur nodejs.org/fr — c'est le moteur que le plugin utilise pour parler à Légifrance, indispensable même avec Cowork)
>
> Confidentialité : vos credentials PISTE et vos requêtes restent **localement** sur votre poste. Demerys n'a accès à aucune donnée client. Le code source est ouvert et auditable. Cet engagement est documenté techniquement dans le plugin.
>
> Si vous êtes intéressé, je vous fais parvenir le package d'installation (1 fichier, install en 4 clics depuis Claude Desktop) ainsi qu'un guide d'1 page expliquant les 6 tests et comment nous remonter vos retours.
>
> Bien à vous,
>
> [Votre nom]
> Demerys — formulaire de contact sur demerys.com — site officiel : berryer-landing.netlify.app

---

## Variante B — Cabinet d'expertise comptable

**Objet** : Beta privée — accès Légifrance + BOFiP via Claude pour vos analyses fiscales

> Cher [Civilité Nom],
>
> Nous lançons une beta privée d'un plugin que nous aimerions vous proposer de tester avant sa sortie publique : **Berryer**, un assistant juridique et fiscal pour Claude (l'IA d'Anthropic), avec un focus particulier sur la fiscalité française.
>
> Concrètement, sur une question fiscale, le plugin va automatiquement :
>
> 1. Rechercher l'article applicable du **CGI** ou du **LPF** sur Légifrance
> 2. Croiser avec la **doctrine BOFiP** correspondante (BOI-…)
> 3. Vous restituer une analyse structurée avec citations rigoureuses et disclaimer rescrit (LPF L. 80 B)
>
> L'agent fiscal s'appelle **Colbert** — un clin d'œil au surintendant des finances de Louis XIV. Il y a aussi des agents pour la veille (Dupin), la jurisprudence (Cassin), la traduction de contrats (David) et la rédaction de notes (Portalis).
>
> Ce qu'on vous propose : 2 à 4 semaines d'accès gratuit, 6 prompts test à dérouler quand vous voulez, vos retours par email. Pré-requis : compte gratuit [piste.gouv.fr](https://piste.gouv.fr) avec souscription API Légifrance et BOFiP, abonnement Claude (à partir de 22€/mois), et Node.js installé sur le poste (téléchargement gratuit nodejs.org/fr en 4 clics — moteur indispensable au plugin).
>
> **Confidentialité** : aucune donnée ne quitte votre poste. Vos clés PISTE sont stockées dans le keychain de votre OS, le serveur MCP du plugin tourne localement, vos requêtes partent en direct vers les serveurs de la DILA. Demerys n'a aucune visibilité.
>
> Si l'idée vous intéresse, répondez à ce mail et je vous envoie le package d'installation (4 clics) plus le guide testeur.
>
> Bien cordialement,
>
> [Votre nom]
> Demerys — formulaire de contact sur demerys.com — site officiel : berryer-landing.netlify.app

---

## Variante C — Contact technique (DSI cabinet, associé tech-savvy, juriste-développeur)

**Objet** : Beta — plugin Claude open-source pour Légifrance + BOFiP, accès GitHub privé

> Bonjour [Prénom],
>
> Je te contacte parce qu'on lance la beta privée de **Berryer**, un plugin Claude (compatible Code, Cowork et Desktop) qu'on a développé pour les cabinets juridiques et comptables. Il branche Claude sur Légifrance et le BOFiP via PISTE, avec une équipe de sub-agents spécialisés (jurisprudence, fiscal, traduction, rédaction, veille).
>
> **Stack** : TypeScript / MCP SDK officiel / undici / better-sqlite3 / zod / vitest. ~2k lignes de TS, 42 tests passing, 5 fixtures réelles capturées sur PISTE prod. Architecture documentée dans `CLAUDE.md` et un guide de construction de plugins (`CLAUDE_PLUGIN_GUIDE.md`) tirera les leçons que tu trouveras peut-être utiles si tu construis tes propres plugins.
>
> Repo privé pour la beta, je peux t'inviter en read-only sur GitHub si tu me donnes ton handle. Tu clones, `npm install && npm run build` dans `mcp-server/`, puis `claude --plugin-dir .` ou install via marketplace locale — c'est le parcours classique.
>
> Ce qu'on cherche : ton retour technique (qualité du code, robustesse face aux hoquets de l'API DILA, ergonomie des tools, choix d'architecture) ET ton retour métier sur les sub-agents (les bons faux-amis EN/FR sont-ils dans le lexique de David ? Cassin hiérarchise-t-il bien les décisions ? Colbert a-t-il les bons réflexes CGI+BOFiP ?).
>
> Côté confidentialité, le serveur MCP tourne en local stdio, aucune télémétrie, les credentials PISTE sont passés en variables d'env. Pas de risque de fuite vers Anthropic ou Demerys.
>
> Si t'es partant, ton handle GitHub et je t'invite. Sinon dis-moi, on enverra en zip à un de tes associés.
>
> [Votre nom] / Demerys — formulaire sur demerys.com

---

## Suivi recommandé

Après envoi du mail, séquence type :

| J | Action |
|---|---|
| J0 | Envoi du mail d'invitation |
| J+3 | Si pas de réponse : relance courte (« simple relance, est-ce que tu as eu le temps de regarder ? »). Pas plus d'1 fois. |
| J+0 (à la réponse OK) | Envoi du package : `berryer-vX.Y.Z.zip` + `BETA_TESTING.md` (pièce jointe) ; rappel des 3 informations critiques (PISTE, Claude Pro, où envoyer les retours) |
| J+7 | Check-in court (« est-ce que tu as eu le temps de l'installer ? besoin d'aide ? »). À ce stade certains n'ont pas encore installé — c'est normal. |
| J+14 | Premier point qualitatif (« qu'est-ce qui marche, qu'est-ce qui ne marche pas, qu'est-ce qui te fait hésiter à l'utiliser sur un dossier réel ? »). Court, max 15 min de visio si proposé. |
| J+28 | Bilan final (« est-ce que tu utiliserais ça en production ? à quel prix ? quelles seraient les fonctionnalités manquantes pour que tu paies ? »). C'est le retour le plus important commercialement. |

## Règles d'or pour les retours

- **Ne pas filtrer** ce que les beta testeurs disent, surtout les retours négatifs : ils sont les plus précieux. Si un avocat dit « j'ai pas envie de l'utiliser parce que je trouve l'interface confuse », c'est un signal commercial fort.
- **Distinguer les bugs des préférences** : un bug se corrige (gratuit), une préférence se priorise (à arbitrer en V1.x).
- **Mémoriser les citations en erreur** : si un beta testeur trouve une citation Cassin/Portalis qui ne pointe pas vers le bon arrêt, c'est critique → reproductible localement, à fixer en priorité absolue.
