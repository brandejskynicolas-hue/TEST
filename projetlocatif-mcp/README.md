# Connecteur ProjetLocatif pour Claude (MCP)

Branche ton espace conseiller ProjetLocatif sur Claude (Desktop ou Claude Code) :
tu demandes « trouve-moi les biens > 7 % de rendement à moins de 200 k€ dans le 59 »
et Claude va chercher directement sur la plateforme, puis peut pousser le résultat dans Google Sheets.

**Lecture seule** : aucun outil ne modifie quoi que ce soit sur la plateforme.
**Tourne sur ton ordinateur** : tes identifiants et les données clients ne sortent pas de ta machine
(hormis ce que Claude lit pour te répondre).

## Outils exposés à Claude

| Outil | Ce que ça fait |
|---|---|
| `pl_statut` | Vérifie la connexion |
| `pl_rechercher_biens` | Biens filtrés : ville / CP, prix, rendement, surface, statut, tri |
| `pl_detail_bien` | Fiche complète d'un bien |
| `pl_lister_dossiers` | Tes dossiers clients (étape, budget, commission…) |
| `pl_detail_dossier` | Détail d'un dossier |
| `pl_exporter` | CSV + tableau prêt pour Google Sheets |
| `pl_lire_page` | Lit n'importe quelle page de l'espace (actus, docs…) |
| `pl_appel_api` | GET brut sur un endpoint JSON interne |

## Installation (une fois, ~10 min)

Prérequis : [Node.js 20+](https://nodejs.org).

```bash
cd projetlocatif-mcp
npm install
npx playwright install chromium
cp config.example.json config.json
```

Dans `config.json`, mets l'adresse de ton espace conseiller dans `baseUrl` (et `loginPath` si la page de
connexion n'est pas `/login`).

### 1. Connexion

```bash
npm run login
```

Un navigateur s'ouvre : connecte-toi (2FA/captcha OK), puis ferme-le. La session est gardée dans
`~/.projetlocatif-mcp/`.

### 2. Découverte de l'API interne (l'astuce)

La plupart des plateformes récentes chargent leurs données via une API JSON cachée. On s'en sert
directement : plus rapide et plus fiable que lire le HTML.

```bash
npm run discover
```

Navigue normalement : liste des biens, quelques fiches, liste des dossiers, un ou deux dossiers. Ferme
ensuite le navigateur. Le script produit `~/.projetlocatif-mcp/discovery/endpoints-schema.json`, qui
contient **uniquement les URL et les noms de champs, aucune valeur**. Envoie-moi ce fichier et je remplis
`apiPath`, `itemsPath` et `fieldMap` dans `config.json`.

Si le site n'a pas d'API JSON (pages HTML classiques), passe la ressource en `"mode": "dom"` avec
`pagePath` : le connecteur lit alors le tableau de la page.

### 3. Brancher sur Claude Desktop

Fichier `claude_desktop_config.json` (Réglages → Développeur → Modifier la config) :

```json
{
  "mcpServers": {
    "projetlocatif": {
      "command": "node",
      "args": ["/CHEMIN/VERS/projetlocatif-mcp/src/index.js"],
      "env": {
        "PL_EMAIL": "ton.email@projetlocatif.fr",
        "PL_PASSWORD": "ton-mot-de-passe"
      }
    }
  }
}
```

`PL_EMAIL` et `PL_PASSWORD` sont facultatifs : ils servent seulement à se reconnecter tout seul quand la
session expire. Sans eux, relance `npm run login` quand Claude te le demande.

Pour Claude Code :

```bash
claude mcp add projetlocatif -- node /CHEMIN/VERS/projetlocatif-mcp/src/index.js
```

## Exemples de demandes

- « Liste les biens dispo à Lille / Roubaix avec plus de 8 % brut, triés par rendement »
- « Quels dossiers sont bloqués en financement ? Prépare-moi les relances »
- « Exporte tous les biens dispo dans mon Google Sheet *Pipe biens* » (combine `pl_exporter` et le connecteur Google Sheets)
- « Pour mon client X (budget 150 k€, cash-flow positif), propose les 3 meilleurs biens »

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `PL_EMAIL` / `PL_PASSWORD` | Reconnexion automatique |
| `PL_BASE_URL` | Remplace `baseUrl` |
| `PL_CONFIG` | Chemin d'un autre config.json |
| `PL_DATA_DIR` | Dossier de session et d'exports (défaut `~/.projetlocatif-mcp`) |
| `PL_HEADLESS=false` | Voir le navigateur travailler (debug) |
| `PL_CACHE_TTL_MS` | Durée du cache des listes (défaut 5 min) |
| `PL_CHROMIUM_PATH` | Chromium personnalisé |

## Tests

```bash
npm test
```

Les tests tournent contre une fausse plateforme locale (`test/mock-server.js`).

## À savoir

Ce connecteur utilise ton propre accès, comme si tu naviguais toi-même, à un rythme raisonnable
(un cache de 5 min limite les appels). Vérifie quand même la charte d'utilisation de l'espace conseiller.
L'idéal à terme : demander à l'équipe tech ProjetLocatif un accès API officiel. Il suffira alors de
changer `apiPath` et l'authentification.
