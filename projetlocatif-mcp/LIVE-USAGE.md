# Utiliser ProjetLocatif avec Claude — au plus simple

Tu as **deux façons**. La plus simple au quotidien = la 1.

## 1. Directement dans la conversation (ce qu'on a fait)

Tu n'as rien à installer. Tu me parles en français, je fais le reste.

**La seule manip, une fois de temps en temps** (quand le cookie a expiré, je te le dirai) :
1. Va sur `https://app.projetlocatif.fr` (connecté).
2. Chrome sur Mac : **⌥ + ⌘ + I** → onglet **Application** → **Cookies** → `app.projetlocatif.fr`.
3. Copie la valeur de **`projetlocatif_session`** et colle-la moi.

C'est tout. Ensuite, demande-moi en langage normal, par exemple :

- « Montre-moi mes prospects en accompagnement, triés par budget. »
- « Quels biens dispo à moins de 200 k€ avec +8 % de rendement dans le 67 ? »
- « Le compromis de [acquéreur/ville] : signé le 12/11, acte prévu le 15/02 — mets-le à jour. »
- « Fais-moi le matching entre mes investisseurs et les biens dispo. »
- « Exporte mon pipeline dans un Google Sheet partageable avec Florian. »

> Le cookie est un accès temporaire à ton compte : il expire seul et tu peux l'invalider en te
> déconnectant. Il n'est jamais enregistré dans le dépôt.

## 2. Dans Claude Desktop (installation unique, usage local)

Pour l'avoir en permanence sur ton Mac sans recoller de cookie. Voir **README.md** :
`npm install` → `npx playwright install chromium` → `npm run login` (tu te connectes une fois dans
la fenêtre) → ajouter le serveur dans la config Claude Desktop. Ensuite ton Claude local interroge
la plateforme quand tu veux.

## Pour moi (Claude), techniquement
Script persistant : `scripts/pl-live.sh GET|POST|PUT|DELETE <chemin> [json]`.
Cookie attendu dans `~/.projetlocatif-mcp/cookie.txt`. Détails et endpoints : voir `../CLAUDE.md`.
