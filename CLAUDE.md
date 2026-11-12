# Mémoire projet — Connecteur ProjetLocatif (Nicolas)

## Ce que c'est
Accès programmatique à l'espace conseiller **app.projetlocatif.fr** (appli **Laravel + Passport**).
Permet à Claude de **lire ET écrire** les données de Nicolas (prospects, biens/properties,
ventes/compromis, mandats) comme s'il le faisait dans l'interface.

## ⚠️ Règles du siège (Marine SCOUBART / Odile GUYON) — à lire avant toute écriture
Le siège contrôle chaque saisie. Leurs consignes priment sur tout le reste de ce fichier.
Process complet : **skill `saisie-compromis-pl`** (`.claude/skills/saisie-compromis-pl/SKILL.md`).
Journal des retours : `projetlocatif-mcp/docs/retours-siege.md`.

1. **Compromis SIGNÉ uniquement.** Projet de compromis = on ne saisit rien (ni vente, ni acquéreur)
   et on attend la signature. Vérifier signatures, date, paraphes, absence de « PROJET ».
   (Erreur commise 2× : 10/09 et 12/11/2026.)
2. **Acquéreur inconnu sur un mandat de vente = créé via la vente (bonhomme +), statut
   « hors parcours ».** Jamais par l'onglet Acquéreurs (= faux client « en attente
   d'accompagnement », anomalies « pas de mandat rattaché »). API : `POST /api/prospects?horsParcours=true`.
   `scripts/pl-live.sh` bloque la création classique.
3. **Toujours rattacher le mandat de vente** à la vente (`mandat_vente_id`).
4. **Répartition des honoraires Nicolas / Florian confirmée par dossier** — jamais 100 % Nicolas
   par défaut. Vérifier que le compromis détaille la part Fief / ProjetLocatif et qui est facturé.
5. **Conventions de partage d'honoraires (DocuSign) : signées par Nicolas lui-même**, jamais par
   Claude ni par Daniéla (obligation légale).
6. **Barème** : honoraires ≤ 8 % TTC (net vendeur arrondi à la hausse), minimum 5 900 € sauf
   dérogation de Robin. **Charge des honoraires figée** une fois l'acquéreur identifié.
7. **Mandat valide et bon numéro** : un bien = un mandat = une vente. Le mandat doit être en
   vigueur le jour du compromis, car les anciens n'ont pas de droit de suite. Le n° cité dans le
   compromis doit être le bon.
8. **Mandats et avenants : seul le siège les rédige**, dans Protexa. Ne jamais retoucher un PDF.
   Une demande d'avenant indique le n° de mandat, le lot, le net vendeur, les honoraires, la
   charge et la surface. Une baisse de prix diffusée dans une annonce exige un avenant signé ;
   une baisse négociée dans le compromis n'en exige pas.
9. **Annonces** : pas d'annonce sans mandat valide et signé. L'annonce doit être strictement
   conforme au mandat ou à l'avenant, et n'est mise à jour qu'après l'avenant signé. Les demandes
   passent par le formulaire « Annonce LeBonCoin », avec le n° de mandat.
10. **À chaque tâche plateforme : relire les mails récents de Marine/Odile** (Gmail
   `from:(marine.scoubart@projetlocatif.fr OR odile.guyon@projetlocatif.fr) newer_than:30d`) et
   intégrer toute nouvelle consigne : journal + skill + ce résumé, dans le même commit.

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
  - acquéreur **hors parcours** (créé depuis une vente) : `GET /api/public/prospects/init?horsParcours=true`
    puis `POST /api/prospects?horsParcours=true` (user + password/password_confirmation aléatoires) ;
    réponse `duplicate` = existe déjà, ne pas forcer. Lier `prospect.id` dans `sale.prospects_id`.
- Ventes/compromis : `POST /api/sales/search {"page":N}` · détail `GET /api/sales/{id}` ·
  update `POST /api/sales/{id}` · créer `POST /api/sales` · init `GET /api/sales/init`
  - enregistrement = **multipart** comme le formulaire : `sale`=JSON, `documents`=JSON
    `[{name,type:"sale",created_at}]`, `files[i]`=PDF → `scripts/pl-live.sh FORM <chemin> -F …`
  - liens : `property_id`, `mandat_vente_id`, `mandat_recherche_id`, `sellers_id`, `prospects_id`,
    `notaires_id`, `agences_id`, `advisors[]` (répartition honoraires), `rdv.date_signature`
  - recherche d'options : `GET /api/sales/options?value=mandats_vente|mandats_recherche|advisors&text=…`
  - `statut` : "Avant-contrat" (= compromis) → "En attente de signature" → "Vente" (acte signé)
  - `date_signature` = date du compromis (YYYY-MM-DD) ; `date_acte` (format objet {date,timezone}) ;
    `honoraires` = {prix_vente, honoraire_pl_ttc, honoraire_pl, charge, distribution, ...}
- Carte complète des 348 routes : `projetlocatif-mcp/docs/api-routes-projetlocatif.txt`

## Règles de prudence (plateforme RÉSEAU partagée : Fief, Florian, siège)
- Mode convenu avec Nicolas : **écriture autonome sur les ventes** (en suivant le skill
  `saisie-compromis-pl`) ; seule création d'acquéreur autorisée = hors parcours depuis une vente ;
  pour le reste, lecture.
- Toute création de bien de test → en **brouillon `visibility:"me"`** puis supprimé.
- Pour une 1ʳᵉ écriture d'un type nouveau : lire → modifier → envoyer → **relire pour vérifier**.
- Ne jamais committer le cookie ni aucune donnée client.

## Droits du compte (rôle advisor, user id 8570)
properties.create/read/update/delete · sales.create/read/update/delete · mandats.* ·
PAS de forceDelete (purge définitive).
