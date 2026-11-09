# Mémoire projet — Connecteur ProjetLocatif (Nicolas)

## Ce que c'est
Accès programmatique à l'espace conseiller **app.projetlocatif.fr** (appli **Laravel + Passport**).
Permet à Claude de **lire ET écrire** les données de Nicolas (prospects, biens/properties,
ventes/compromis, mandats) comme s'il le faisait dans l'interface.

Deux usages, voir `projetlocatif-mcp/LIVE-USAGE.md` :
- **Live en chat (session cloud)** : via le script `projetlocatif-mcp/scripts/pl-live.sh` + un cookie de session.
- **Claude Desktop (quotidien)** : le serveur MCP `projetlocatif-mcp/src/index.js` (voir README).

## Recette de reconnexion live (pour une future session)
1. Nicolas fournit la valeur du cookie **`projetlocatif_session`** (Chrome Mac : ⌥⌘I →
   Application → Cookies → app.projetlocatif.fr). Le cookie **expire** (quelques heures/jours) :
   si une requête renvoie `{"message":"Unauthenticated."}`, en redemander un frais.
2. L'écrire dans `~/.projetlocatif-mcp/cookie.txt` sous la forme `projetlocatif_session=<valeur>`
   (jamais committer ce fichier — secret).
3. Utiliser `scripts/pl-live.sh GET|POST <chemin> [json]`. Le script amorce seul le jeton
   Passport `laravel_token` (via un GET sur /prospects) et l'en-tête `X-XSRF-TOKEN` décodé.

### Détail technique qui a tout débloqué
Les routes `/api/*` ne s'authentifient PAS avec le seul cookie de session : il faut aussi le
cookie `laravel_token` (Passport CreateFreshApiToken, délivré automatiquement en chargeant une
page web avec le cookie de session) **et** l'en-tête `X-XSRF-TOKEN` = valeur **url-décodée** du
cookie `XSRF-TOKEN`. Sans ça → `Unauthenticated`.

## Endpoints utiles
- Identité : `GET /auth/user`
- Prospects : `POST /api/prospects/search {"page":N}` · détail `GET /api/prospects/{id}`
  - statut dans `prospect.status_display` (en_attente, a_contacter, en_cours, en_accompagnement, en_proposition, archive…)
- Biens : `POST /api/properties/search {"page":N,"orderBy":"id","orderDesc":true}` · détail `GET /api/properties/{id}`
  - filtres : departement[], budget_min, budget_max, rentabilite_brute[], rentabilite_nette[], ville_code_postal, status[], type[]
  - prix dans `financier.prix_vente` ; `rentabilite_brute`/`rentabilite_nette` au niveau racine
  - créer brouillon privé : `POST /api/properties/draft` (mettre `visibility:"me"`, `draft:true`)
  - supprimer : `DELETE /api/properties/{id}` (soft-delete = archivé). Purge définitive
    `PUT /api/properties/{id}/delete` = **403 pour le rôle conseiller** (siège only).
- Ventes/compromis : `POST /api/sales/search {"page":N}` · détail `GET /api/sales/{id}` ·
  update `POST /api/sales/{id}` · créer `POST /api/sales`
  - `statut` : "Avant-contrat" (= compromis) → "En attente de signature" → "Vente" (acte signé)
  - `date_signature` = date du compromis (YYYY-MM-DD) ; `date_acte` (format objet {date,timezone}) ;
    `honoraires` = {prix_vente, honoraire_pl_ttc, honoraire_pl, charge, distribution, ...}
- Carte complète des 348 routes : `projetlocatif-mcp/docs/api-routes-projetlocatif.txt`

## Demande de mandat (procédure validée le 09/11/2026)
Une « demande de mandat » = statut `unsigned` (« En cours de signature ») ; le siège (Marine) la
reprend ensuite dans Protexa et l'envoie en signature. Trois appels par lot :
1. **Fiche bien** : `POST /api/properties` (`visibility:"all"`, `precisions:"<adresse> - Lot N"`,
   `financier:{prix_vente:<net vendeur>, honoraires_pl_montant, honoraires_pl:"acquereur"}`,
   `sellers:[<id vendeur>]`, `logements:[{pieces, surface, niveau, loyer_prev, charges}]`).
2. **Mandat** : `POST /api/mandats` `{type:"simple", seller_id, property_id, advisor_id:null,
   property:{...fiche relue..., lots:"N", charge:"acquereur", prix_net, honorairesa, copropriete:true}}`
   (si charge vendeur : `prix_vente` + `honoraires`).
3. **Justificatif de propriété** (obligatoire côté appli pour un vendeur pro) :
   `scripts/pl-upload.sh /api/mandats/documents <pdf> mandat_id=<id> type=justificatif_propriete "name=Justificatif de propriété"`.
   Pièce attendue = acte d'acquisition, compromis ou attestation notariée de l'immeuble
   (dataroom Fief sur le Drive partagé « Datarooms »).
- Vendeurs : `GET /api/mandats/options?value=sellers&text=merckel` (fiche « SAS FIEF » utilisée : 3184).
  Vérifier l'entité propriétaire sur le justificatif (FIEF, DM PATRIMOINE, FIEF ASSET MANAGEMENT, EMJ1…).
- Lookup d'un bien pour un mandat : `GET /api/mandats/options?value=properties&include[]=<id>`.
- Le rôle conseiller **ne peut ni supprimer ni clôturer** un mandat (403) : vérifier AVANT de créer.
- Barème : honoraires ≤ 8 % du net vendeur → net = FAI / 1,08 **arrondi à la centaine supérieure**.

## Piège script
`pl-live.sh` : ne jamais écrire `"${BODY:-{}}"` (bash ajoute un `}` → JSON invalide, ignoré
silencieusement par Laravel : filtres/tri ignorés). Corrigé ; corps volumineux : passer `@fichier.json`.

## Règles de prudence (plateforme RÉSEAU partagée : Fief, Florian, siège)
- Mode convenu avec Nicolas : **écriture autonome sur les ventes** ; pour le reste, lecture.
- Toute création de bien de test → en **brouillon `visibility:"me"`** puis supprimé.
- Pour une 1ʳᵉ écriture d'un type nouveau : lire → modifier → envoyer → **relire pour vérifier**.
- Ne jamais committer le cookie ni aucune donnée client.

## Droits du compte (rôle advisor, user id 8570)
properties.create/read/update/delete · sales.create/read/update/delete · mandats.* ·
PAS de forceDelete (purge définitive).
