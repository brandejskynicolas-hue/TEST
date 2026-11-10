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
  - **Créer/modifier une vente = multipart, pas JSON** (comme le front Vue) :
    `pl-live.sh FORM /api/sales -F 'sale=<sale.json' -F 'documents=<docs.json' -F 'files[0]=@compromis.pdf;type=application/pdf'`
    - `sale` = objet complet (partir de `GET /api/sales/init`) ; `documents` = `[{"created_at":<ms>,"name":"…","type":"sale","file":{}}]`
    - **Un document est obligatoire** (sinon « Veuillez ajouter un document. ») ; en JSON pur → 500.
    - Modèle qui marche : `property_id`, `mandat_vente_id`, `rdv{date_signature,date_vente_prevue}`, `date_signature`,
      `date_acte` ("YYYY-MM-DD"), `honoraires{distribution:"perso",charge,prix_vente,honoraire_pl_ttc,honoraire_pl(=TTC/1,2),numero_mandat_vente,…}`,
      `sellers_id[]`, `notaires_id[]`, `prospects_id[]` (id **prospect**, pas user), `advisors[{advisor_id,honoraires{pourcentage,honoraire,commission(=70 %)}}]`
    - IDs conseillers : Nicolas `advisor_id 544` · Florian BICHET `advisor_id 492`. Notaire SEYLER Valentin = 5207.
    - Vendeur Fief : vérifier le `seller_id` **du mandat** (EMJ1 existe en double : #3172 et #3337).
- Prospects : `GET /api/prospects/{id}` → `{id}` = **id user** (ex. #11030), le prospect est dans `.prospect.id`.
  - Recherche : `POST /api/prospects/search {"page":N,"status":["hors_parcours"]}` (sans `status` → seulement « en accompagnement »).
  - Créer : `POST /api/prospects` (JSON) avec `nom,prenom,adresse,code_postal,ville,tel,email,password,password_confirmation`
    + `prospect{type,civilite,situation,visibility:"perso",advisors_id:[544],…}` (mot de passe aléatoire, non conservé).
    Le statut part toujours en « Validation siège en cours ».
- Mandats : `GET /api/mandats/{id}` (le `search` ne renvoie pas tous les mandats signés).
- Carte complète des 348 routes : `projetlocatif-mcp/docs/api-routes-projetlocatif.txt`
- ⚠️ Bug corrigé dans `pl-live.sh` (nov. 2026) : `"${BODY:-{}}"` ajoutait une `}` → JSON invalide → filtres/champs ignorés.
- ⚠️ **Pare-feu CrowdSec** : balayer des IDs en parallèle (xargs -P 8, centaines de GET) déclenche un
  ban temporaire (page HTML « CrowdSec Ban », ou réponse vide). → requêtes **séquentielles**, ciblées,
  jamais de scan en rafale. Retrouver un mandat via `GET /api/mandats/{id}` au cas par cas.
- Envoi multipart (création de vente) : si la réponse est vide (timeout 30 s / ban), **vérifier via
  `POST /api/sales/search` que la vente n'existe pas avant de renvoyer** (éviter les doublons).
- Programme Schirmeck (SAS EMJ1, vendeur #3172) : mandats #691→#695 (lots 5,6,7,12), #719 (lot 8).
  Programme Libération : lot 1 = mandat #808 (vendeur #3337). Les fiches biens peuvent garder
  l'ancien prix (avant avenant) : se fier au **mandat**.

## Règles de prudence (plateforme RÉSEAU partagée : Fief, Florian, siège)
- Mode convenu avec Nicolas : **écriture autonome sur les ventes** ; pour le reste, lecture.
- Toute création de bien de test → en **brouillon `visibility:"me"`** puis supprimé.
- Pour une 1ʳᵉ écriture d'un type nouveau : lire → modifier → envoyer → **relire pour vérifier**.
- Ne jamais committer le cookie ni aucune donnée client.

## Droits du compte (rôle advisor, user id 8570)
properties.create/read/update/delete · sales.create/read/update/delete · mandats.* ·
PAS de forceDelete (purge définitive).
