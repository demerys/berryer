# Programme beta Berryer — Guide testeur

Bienvenue dans le programme de test privé du plugin Berryer.

Vous testez **avant tout le monde** un cabinet juridique virtuel français branché sur Légifrance et le BOFiP. Vos retours nous serviront à corriger les derniers bugs et à ajuster le comportement des agents avant la mise à disposition publique.

---

## Ce qu'on attend de vous

**Tester en conditions réelles** sur 2-3 dossiers concrets de votre cabinet pendant 2 à 4 semaines :
- Quelques recherches d'articles ou d'arrêts
- 1 ou 2 notes de synthèse complètes (Portalis avec Cassin et/ou Colbert en amont)
- Si pertinent : 1 traduction d'une clause de contrat anglo-saxon (David)
- Si pertinent : 1 veille thématique (Dupin)

**Ce qu'on cherche à apprendre** :
- Les agents délèguent-ils correctement quand vous parlez en langage naturel ?
- Les citations sont-elles toujours exactes (à vérifier sur Légifrance) ?
- Les notes sont-elles directement utilisables dans votre pratique, ou nécessitent-elles trop de retouche ?
- Y a-t-il des cas d'usage récurrents non couverts ?

**Ce qu'on ne vous demande PAS** :
- Tester l'exhaustivité de chaque tool techniquement
- Documenter formellement vos sessions
- Nous envoyer le contenu de vos dossiers (par sécurité, restez sur des cas anonymisés)

---

## Pré-requis indispensables

Avant tout, vérifiez ces 3 éléments. Sans eux, le plugin ne fonctionnera pas — ce ne sont pas des suggestions.

### 1. Node.js ≥ 20 installé sur votre poste

**Pourquoi** : le plugin contient un petit serveur écrit en JavaScript qui tourne sur votre machine pour parler à Légifrance. Sans Node, ce serveur ne démarre pas, qu'on soit sur Cowork ou Claude Code.

**Comment vérifier** : ouvrez un terminal et tapez `node --version`. Vous devez voir `v20.x.x` ou supérieur. Si la commande retourne « not found » ou une version inférieure, installez :

- **macOS / Windows / Linux** : téléchargez la version LTS sur [nodejs.org/fr](https://nodejs.org/fr) et lancez l'installeur (4 clics, ~30 secondes). Validez tous les défauts proposés.
- **Alternative macOS via Homebrew** : `brew install node`
- **Alternative Windows via winget** : `winget install OpenJS.NodeJS.LTS`

Après installation, fermez et rouvrez votre terminal pour que Node soit reconnu.

### 2. Compte PISTE actif avec API Légifrance souscrite

Voir étape « Créer une application PISTE » plus bas.

### 3. Pour Cowork uniquement : abonnement Claude Pro/Max/Team/Enterprise

Les plugins Cowork ne sont pas accessibles sur le plan gratuit. Pour Claude Code (terminal), pas de contrainte.

---

## Installation

Selon votre profil et votre outil principal, choisissez le parcours.

### Étape commune préalable : configurer vos credentials PISTE

Le plugin a besoin de votre **Client ID** et **Client Secret** PISTE. Le moyen le plus simple, valable pour tous les parcours :

```bash
node scripts/setup-credentials.mjs
```

Ce script interactif vous demande vos credentials, les enregistre dans `~/.config/berryer/credentials.json` (mode 600 — lecture/écriture pour vous uniquement), et fait un test de connexion immédiat. **Aucune donnée n'est envoyée sur Internet hors de l'appel test à PISTE.**

Avantage : ça marche dans **tous les contextes** — Cowork lancé en GUI sur macOS, Claude Code en terminal, Claude Desktop. Vous configurez une fois, vous oubliez.

> Si vous préférez utiliser des variables d'environnement (`PISTE_CLIENT_ID` / `PISTE_CLIENT_SECRET` dans votre shell), c'est aussi supporté. Le plugin lit en priorité l'environnement, et fait fallback sur le fichier.

### Parcours 1 — Cowork (recommandé pour les avocats sans terminal)

**Pré-requis** : abonnement Claude Pro/Max/Team/Enterprise + Claude Desktop installé + compte PISTE avec souscription API Légifrance.

1. Décompressez le zip que vous avez reçu (ex: `~/berryer`).
2. Ouvrez un terminal dans ce dossier (Finder → clic droit sur le dossier → « Nouveau terminal au dossier » sur macOS) et lancez :
   ```bash
   node scripts/setup-credentials.mjs
   ```
   Saisissez votre Client ID et Client Secret PISTE quand le script vous le demande.
3. Ouvrez **Claude Desktop** → onglet **Cowork** → **Customize**.
4. Bouton **+** → **Upload plugin** → sélectionnez le dossier `berryer` décompressé.
5. Cliquez **Install** sur le plugin Berryer dans la liste.
6. Premier test : tapez `piste_status` dans une conversation Cowork. Vous devez voir `"diagnostic": "✅ Plugin opérationnel"`.
7. Deuxième test : tapez `/berryer:recherche article 1240 code civil`.

Si le plugin ne charge pas ou si `piste_status` retourne une erreur, voir [Troubleshooting](#troubleshooting).

### Parcours 2 — Claude Code (pour les profils techniques ou DSI cabinet)

**Pré-requis** : Claude Code installé + Node.js ≥ 20 + compte PISTE.

1. Décompressez le zip où vous voulez (ex: `~/berryer`).
2. Lancez le script de configuration :
   ```bash
   cd ~/berryer && node scripts/setup-credentials.mjs
   ```
3. Lancez Claude Code en pointant sur le plugin :
   ```bash
   claude --plugin-dir ~/berryer
   ```
4. Dans Claude Code, vérifiez : `piste_status` doit retourner `"diagnostic": "✅ Plugin opérationnel"`.
5. Premier test fonctionnel : `/berryer:recherche article 1240 code civil`.

> **Alternative env vars** : si vous préférez ne pas utiliser le fichier de credentials, vous pouvez exporter `PISTE_CLIENT_ID` et `PISTE_CLIENT_SECRET` dans votre `~/.zshrc` (ou `~/.bashrc`), puis `source ~/.zshrc` avant de lancer Claude Code. Le plugin lit l'env en priorité.

### Parcours 3 — Accès au repo GitHub privé (cabinets avec dev/IT)

Si vous avez reçu une invitation GitHub sur le repo `demerys/berryer` :

```bash
git clone https://github.com/demerys/berryer
cd berryer/mcp-server && npm install && npm run build
cd .. && node scripts/setup-credentials.mjs
claude --plugin-dir .
```

Pour mettre à jour à chaque release : `git pull` à la racine + `cd mcp-server && npm run build` + redémarrer Claude.

---

## Que tester en priorité ?

Voici **6 prompts** qui couvrent l'essentiel des capacités. Donnez-nous votre retour sur chacun.

### Test 1 — Recherche simple
```
Quel est le texte exact de l'article 1240 du Code civil ?
```
*Attendu : texte intégral + état (VIGUEUR) + dates + lien Légifrance.*

### Test 2 — Recherche complexe avec délégation à Cassin
```
Quels sont les arrêts récents de la Cour de cassation (depuis 2024) 
sur la prescription de l'action en nullité d'une transaction ?
```
*Attendu : délégation auto à Cassin, 3-5 arrêts cités au format français rigoureux, attendus en blockquote, liens Légifrance vérifiables.*

### Test 3 — Analyse fiscale avec Colbert
```
Mon client passe en micro-BNC en 2026. Donne-moi les seuils, 
les conditions, et explique-moi le risque vis-à-vis de la franchise TVA.
```
*Attendu : délégation auto à Colbert, citation simultanée du CGI (art. 102 ter, 293 B) ET de la doctrine BOFiP (BOI-BNC-DECLA-…), disclaimer rescrit.*

### Test 4 — Note de synthèse complète avec Portalis
```
Sur la base de l'arrêt Cass. soc. du 8 octobre 2025 n° 23-23.501, 
rédige-moi une note client : un employeur peut-il encore contester 
la nullité d'une transaction signée en 2018 ?
```
*Attendu : délégation à Portalis, structure en 4 sections (faits / question / discussion / conclusion), niveau de confiance explicite, disclaimer.*

### Test 5 — Traduction de contrat avec David
```
Décrypte cette clause d'un SaaS agreement Delaware : "Customer shall 
indemnify and hold Provider harmless from any third-party claims arising 
from Customer's misuse of the Service, including reasonable attorneys' 
fees and court costs." Risques côté droit français ?
```
*Attendu : délégation à David, signalement explicite du faux-ami `indemnification`, mention de l'art. 1231-3 C. civ. sur la prévisibilité, identification des risques (pas de cap, attorneys' fees inclus).*

### Test 6 — Veille thématique avec Dupin
```
Veille sur les modifications du Code de la consommation depuis 2025.
```
*Attendu : délégation à Dupin, tableau ou prose chronologique avec NOR + lien Légifrance pour chaque texte, synthèse en 5 axes.*

---

## Comment nous remonter les bugs et retours

### Bug technique (le plugin crashe, message d'erreur incompréhensible, etc.)

**Canal privilégié — issue GitHub** : ouvrir une issue sur [demerys/berryer/issues](https://github.com/demerys/berryer/issues) avec le label `beta` et en titre `[BETA] <résumé court>`. Joindre :
- Le prompt qui a déclenché le bug
- La sortie complète de Claude (copier-coller du texte)
- Si possible : la sortie de `piste_status` pour confirmer que la connexion PISTE fonctionne
- Le parcours d'install (Cowork / Claude Code / GitHub)

**Alternative** : formulaire de contact sur [demerys.com](https://demerys.com), objet `[BERRYER BETA]`. À privilégier si vos exemples contiennent des éléments de dossier client que vous ne voulez pas mettre en clair sur GitHub.

### Retour qualitatif (les agents délèguent mal, citations à confirmer, etc.)

Idem : `[BERRYER BETA] <retour>`. Pas besoin d'être structuré, on prend en l'état.

### Citation suspecte ou incorrecte

**Critique** — c'est le pire défaut possible pour notre produit. Si vous trouvez une citation qui ne pointe pas vers le bon texte / arrêt sur Légifrance, dites-le-nous immédiatement. Cela nous permet de corriger un éventuel bug d'extraction.

---

## Confidentialité — engagements de Demerys

Engagements pris vis-à-vis de vous en tant que beta testeur :

1. **Vos credentials PISTE** sont stockés dans le keychain de votre OS. Ils ne quittent jamais votre poste.
2. **Le serveur MCP** du plugin tourne localement sur votre machine. Aucune intermédiation.
3. **Vos requêtes** Légifrance/BOFiP partent en direct depuis votre poste vers `api.piste.gouv.fr`. Demerys n'a aucune visibilité.
4. **Aucune télémétrie** dans le plugin.
5. **Code source ouvert** et auditable pour les testeurs ayant accès au repo GitHub.
6. **Vos retours** : les bugs et suggestions que vous nous envoyez ne contiennent pas de données client (sauf si vous nous les envoyez explicitement). Restez sur des cas anonymisés ou des prompts génériques quand vous documentez.

Si vous décidez de ne pas continuer le programme beta, votre version locale du plugin continue de fonctionner avec vos propres credentials PISTE — il n'y a rien à désinstaller côté serveur (puisqu'il n'y a pas de serveur).

---

## Troubleshooting

### Erreur 403 ou « API non souscrite »

→ Allez sur [piste.gouv.fr](https://piste.gouv.fr) → Mes applications → onglet APIs souscrites → vérifiez que **Légifrance** est dans la liste avec statut actif. Si manquante, souscrivez (validation immédiate à quelques heures).

### Le plugin ne se charge pas dans Claude Code

→ Lancez `claude --plugin-dir . --debug` pour voir les logs. Souvent : oubli de `npm install && npm run build` dans `mcp-server/`.

### Cowork affiche un avertissement sécurité sur les MCP locaux

→ C'est normal et attendu. Ce message indique que le plugin embarque un serveur MCP qui tournera sur votre machine — c'est précisément l'effet recherché pour la confidentialité (vos données ne quittent pas votre poste). Voir section Confidentialité.

### Une citation dans la réponse de Cassin/Portalis n'a pas de lien Légifrance fonctionnel

→ Bug critique. Ouvrez une issue GitHub immédiate avec le label `beta-citation` et joignez le prompt + la citation erronée + la sortie complète de la réponse. Si le prompt contient des éléments confidentiels, passez par le formulaire de contact sur [demerys.com](https://demerys.com) à la place.

### Hoquet PISTE — message « Hoquet temporaire de l'infrastructure PISTE »

→ Comportement attendu. La passerelle PISTE a des micro-pannes. Le plugin retry automatiquement jusqu'à 5 fois. Si le message persiste après 1 minute, **reposez la même question** — ça fonctionnera.

### Mon Claude Code dit « le plugin n'a pas accès aux outils MCP »

→ Vérifiez que le serveur MCP est bien construit (`mcp-server/dist/index.js` existe), et qu'au moins une des deux sources de credentials est configurée :
- Soit le fichier `~/.config/berryer/credentials.json` existe (lancez `node scripts/setup-credentials.mjs` si non)
- Soit les env vars `PISTE_CLIENT_ID` / `PISTE_CLIENT_SECRET` sont chargées dans le shell

Tapez `piste_status` dans Claude Code, le champ `credentialsSource` doit valoir `"env"` ou `"file"` (jamais `"none"`).

### Cowork a installé le plugin mais `piste_status` dit `credentialsSource: "none"`

→ Vous n'avez pas (encore) lancé `setup-credentials.mjs`. Ouvrez un terminal, allez dans le dossier du plugin (celui que vous avez uploadé dans Cowork), et lancez :
```bash
node scripts/setup-credentials.mjs
```
Puis quittez Cowork complètement (Cmd+Q) et relancez. Cowork va relire le fichier de credentials au prochain démarrage du serveur MCP.

---

## Calendrier indicatif du programme beta

| Phase | Durée | Action |
|---|---|---|
| Onboarding | semaine 1 | Réception du zip + premiers tests sur les 6 prompts type |
| Usage en conditions réelles | semaines 2-3 | Vous utilisez le plugin sur vos dossiers en cours, vous remontez les retours au fil de l'eau |
| Bilan & ajustements | semaine 4 | Demerys consolide les retours, fait les ajustements urgents, communique sur la sortie publique |
| Sortie publique | après | Le plugin passe en marketplace publique. Vous pouvez basculer sur l'install marketplace officielle si vous le souhaitez. |

---

## Contact

- **Issues GitHub** : [demerys/berryer/issues](https://github.com/demerys/berryer/issues) — canal privilégié pour bugs et retours non sensibles
- **Formulaire éditeur** : [demerys.com](https://demerys.com) — objet `[BERRYER BETA]`, à privilégier pour les retours qui contiennent des éléments confidentiels
- **Site officiel** : [berryer-landing.netlify.app](https://berryer-landing.netlify.app/)

Merci pour votre temps et votre confiance.
