# Installer le plugin Berryer

Deux parcours selon votre profil. Le **parcours A (Cowork)** est recommandé si vous n'utilisez pas de terminal au quotidien — c'est le cas de la plupart des avocats et experts-comptables. Le **parcours B (Claude Code)** s'adresse aux profils techniques.

---

## Parcours A — Installation Claude Cowork (recommandé)

Aucune compétence technique requise. Compter ~10 minutes.

### Prérequis

- Un abonnement **Claude Pro, Max, Team ou Enterprise** (les plugins Cowork sont réservés aux plans payants).
- L'app **Claude Desktop** installée (macOS ou Windows).
- Un compte **PISTE** créé sur [piste.gouv.fr](https://piste.gouv.fr).

### 1. Créer une application PISTE

1. Connectez-vous à [piste.gouv.fr](https://piste.gouv.fr).
2. Tableau de bord → **Applications** → **Créer une application**.
3. Donnez un nom à l'application (ex. « Cabinet Demerys — Berryer »).
4. Dans **Souscriptions**, ajoutez :
   - **API Légifrance** (production)
   - **API BOFiP-Impôts** (production) — *si disponible séparément ; sinon, l'API Légifrance couvre déjà le BOFiP via le fond CIRC.*
5. Validez.

### 2. Récupérer vos credentials

Sur la page de votre application :
- Notez le **Client ID** (`PISTE_CLIENT_ID`)
- Notez le **Client Secret** (`PISTE_CLIENT_SECRET`)

⚠️ Le Client Secret ne s'affiche qu'une fois. Stockez-le dans votre gestionnaire de mots de passe.

### 3. Ajouter la marketplace Demerys dans Cowork

1. Ouvrez **Claude Desktop**.
2. Onglet **Cowork** → **Customize** (sidebar gauche).
3. Bouton **+** → **Add marketplace from GitHub**.
4. Collez l'URL : `https://github.com/demerys/jurisconsultes-marketplace`
5. Validez.

### 4. Installer le plugin

1. Dans le catalogue de marketplaces, cliquez sur **berryer**.
2. **Install**.
3. Cowork vous demande vos credentials PISTE :
   - `PISTE_CLIENT_ID` : collez votre Client ID
   - `PISTE_CLIENT_SECRET` : collez votre Client Secret
4. Validez. Les credentials sont stockés dans le **Keychain macOS** (ou **Credential Manager** Windows) — Demerys et Anthropic n'y ont pas accès.

### 5. Premier test

Dans une conversation Cowork, tapez :

> `/berryer:recherche article 1240 code civil`

Vous devez voir 3 fonds (CODE, LODA, JURI) avec les résultats pertinents. Si rien ne s'affiche, voir [Troubleshooting](#troubleshooting).

### 6. Aller plus loin

- Demandez une **veille** : « fais-moi une veille sur le Code de la consommation pour 2025 » → Dupin prend la main.
- Demandez une **analyse fiscale** : « régime micro-BNC en 2026 » → Colbert répond avec CGI + BOFiP.
- Demandez une **consultation** : « rédige une note sur la responsabilité du fait des choses » → Portalis structure la note.

---

## Parcours B — Installation Claude Code (terminal)

Pour les utilisateurs à l'aise avec un terminal. Compter ~5 minutes.

### Prérequis

- **Claude Code** installé ([code.claude.com](https://code.claude.com))
- **Node.js ≥ 20**
- Un compte **PISTE** ([piste.gouv.fr](https://piste.gouv.fr)) avec souscription aux API Légifrance et BOFiP

### 1. Configurer les credentials PISTE

Ajoutez dans votre `~/.zshrc` (ou `~/.bashrc`) :

```bash
export PISTE_CLIENT_ID="votre_client_id"
export PISTE_CLIENT_SECRET="votre_client_secret"
# export PISTE_ENV="production"  # défaut, optionnel
```

Rechargez : `source ~/.zshrc`.

Vérifiez :
```bash
echo $PISTE_CLIENT_ID  # doit afficher votre ID
```

### 2. Installer le plugin

```bash
claude
> /plugin marketplace add demerys/jurisconsultes-marketplace
> /plugin install berryer@jurisconsultes-marketplace
```

Le plugin se charge. Vérifiez avec `/plugin` que `berryer` est listé sans erreur.

### 3. Premier test

```
> /berryer:recherche article 1240 code civil
```

ou directement appel d'un tool :

```
> Donne-moi l'article 1240 du Code civil
```

### 4. Test de connectivité (optionnel)

Pour vérifier que vos credentials PISTE fonctionnent en dehors de Claude Code :

```bash
git clone https://github.com/demerys/jurisconsultes-marketplace
cd jurisconsultes-marketplace/berryer
bash scripts/verify-piste.sh
```

Vous devez voir `✅ Connectivité PISTE/Légifrance OK.`

---

## Troubleshooting

### Erreur 403 — « Forbidden » / souscription requise

Votre application PISTE n'est pas souscrite à l'API. Allez sur [piste.gouv.fr](https://piste.gouv.fr) → votre application → **Souscriptions** → ajoutez l'API Légifrance.

### Erreur 401 — « Unauthorized »

Vos credentials sont invalides ou expirés. Vérifiez `PISTE_CLIENT_ID` et `PISTE_CLIENT_SECRET`. Régénérez le secret si besoin (le Client Secret est rotatif sur PISTE).

### Erreur 429 — « Too Many Requests »

Vous avez dépassé le quota PISTE. Le plugin retry automatiquement avec backoff exponentiel, mais si l'erreur persiste, attendez quelques minutes. Le **cache local** du plugin réduit fortement le risque pour les requêtes répétitives.

### Le hook bloque l'appel : « PISTE_CLIENT_ID est manquant »

Les variables d'environnement n'ont pas été propagées au serveur MCP. Vérifiez :
- **Cowork** : ré-ouvrez le panneau de config du plugin et resaissez les credentials.
- **Claude Code** : redémarrez Claude Code après avoir exporté les variables (`source ~/.zshrc` puis `claude`).

### Aucun résultat / résultats incohérents

- Essayez `legifrance_suggest query="…"` pour valider l'orthographe et trouver l'identifiant exact.
- Élargissez la fenêtre de date (`dateDebut="2020-01-01"` par exemple).
- Changez de fond : `fond=ALL` pour chercher dans toutes les bases.

### Le plugin ne se charge pas dans Claude Code

```bash
claude --plugin-dir /chemin/vers/berryer --debug
```

Regardez les logs. Une erreur de build TypeScript ? Lancez `cd mcp-server && npm run build` manuellement.

---

## Confidentialité — rappel essentiel

- Vos credentials PISTE sont stockés dans le **keychain de votre OS**. Ils ne quittent jamais votre poste.
- Le serveur MCP du plugin tourne **localement** sur votre machine. Aucune donnée ne transite par les serveurs Anthropic ou Demerys.
- Vos requêtes Légifrance/BOFiP partent **en direct** depuis votre poste vers `api.piste.gouv.fr`. Demerys n'a aucune visibilité sur les requêtes effectuées.
- Le plugin n'envoie aucune télémétrie.
- Le code source est **ouvert et auditable** sur GitHub.

Si Claude Cowork affiche un avertissement de sécurité concernant les MCP locaux, il fait référence à cette architecture : le serveur tourne sur votre machine, ce qui est précisément l'effet recherché pour le secret professionnel et la conformité RGPD.
