# ProjetLocatif — Note d'analyse sécurité (observations préliminaires)

**Auteur :** Nicolas BRANDEJSKY (conseiller) — **Statut :** préliminaire, à confirmer par un test autorisé
**Portée :** observations faites via un **accès légitime** (compte propre), par usage normal.
**Aucune donnée de tiers n'a été consultée.** Les points ci-dessous sont des *indices de risque*
à **vérifier** dans le cadre d'un test mandaté (voir `mandat-autorisation-test-securite.md`).

> ⚠️ Cette note se remet **uniquement** à l'éditeur de la plateforme (divulgation responsable).

---

## 1. Résumé pour la direction
La plateforme (stack **Laravel + Passport**) présente plusieurs **indices classiques** qui
justifient un test des contrôles d'accès. Rien ici ne prouve une faille : ce sont des signaux
qui orientent l'audit. Le sujet principal à trancher : **l'autorisation est-elle vérifiée
objet par objet côté serveur**, ou seulement par rôle/menu côté interface ?

## 2. Indices observés (via accès légitime)

| # | Observation | Pourquoi c'est un indice | Gravité potentielle |
|---|---|---|---|
| A | **Identifiants séquentiels** sur les ressources (`/api/prospects/{id}`, `/api/sales/{id}`, `/api/properties/{id}`) | Rend trivial le test d'**IDOR** (deviner des id voisins) si l'autorisation n'est pas vérifiée par objet | Élevée si non protégé |
| B | **Table des routes complète exposée** dans la page (variable Ziggy `namedRoutes`, ~348 routes) | Cartographie offerte à tout visiteur authentifié : facilite la reconnaissance | Faible/Moyenne (info disclosure) |
| C | Objets d'API **très riches** (une fiche prospect renvoie situation financière, contacts secondaires, documents…) | Si un IDOR existe, l'impact RGPD est fort (données sensibles) | Élevée (impact) |
| D | Contrôle d'accès **par rôle** (`authorisations` renvoyées au client) | Les droits visibles côté client ne garantissent pas une vérification côté serveur par ressource | À vérifier |
| E | Jeton **Passport `laravel_token`** délivré automatiquement + CSRF via `X-XSRF-TOKEN` | Schéma standard ; vérifier l'expiration de session, la portée des scopes, et l'absence de fuite de token | À vérifier |

## 3. Ce qu'un test autorisé devrait confirmer (hypothèses à valider)
- **H1 — IDOR en lecture** : un conseiller peut-il lire une ressource (prospect/vente/bien)
  rattachée à **un autre** conseiller en changeant l'`id` ? *(test : 1 objet témoin, preuve
  minimale, puis arrêt.)*
- **H2 — IDOR en écriture** : peut-il **modifier/supprimer** une ressource hors de son périmètre ?
- **H3 — Élévation de privilèges** : des actions réservées (ex. endpoints `stats`, admin,
  `forceDelete`) répondent-elles alors que le rôle ne devrait pas y accéder ?
- **H4 — Exposition d'info** : des endpoints renvoient-ils plus que nécessaire (sur-exposition
  de champs / de comptes tiers) ?

## 4. Recommandations (quel que soit le résultat)
1. **Autorisation côté serveur par objet** : sur chaque route `show/update/destroy`, vérifier
   que la ressource appartient bien au périmètre de l'utilisateur (Policies Laravel), pas
   seulement le rôle.
2. **Minimiser l'exposition** : ne pas publier la table de routes complète ; ne renvoyer que
   les champs nécessaires (API Resources filtrées selon le rôle).
3. **Tests automatisés d'autorisation** en CI (jeux de comptes A/B qui ne doivent pas se voir).
4. **Journalisation & alerte** sur les accès anormaux (énumération d'id, pics de lecture).
5. **Revue RGPD** des champs sensibles renvoyés par l'API.

## 5. Méthodologie proposée (référentiel OWASP)
- Cadre : **OWASP WSTG** (Testing Guide) + **OWASP API Security Top 10** (API1 Broken Object
  Level Authorization en priorité).
- Démarche : cartographie du périmètre autorisé → comptes de test A/B → vérification
  d'étanchéité objet par objet → preuve **minimale** → arrêt → rapport.
- Principe directeur : **prouver, pas exploiter.** On démontre qu'un accès est possible sur un
  cas témoin, sans extraire ni diffuser de données de tiers.

## 6. Modèle de fiche de constat (pour le rapport final)
```
[ID]  Titre court
Gravité : Critique / Élevée / Moyenne / Faible   |  Catégorie : OWASP API1 (BOLA) ...
Constat : ...
Pré-requis / périmètre : compte conseiller standard, dans la fenêtre autorisée
Preuve (minimale, anonymisée) : ...
Impact : (confidentialité / RGPD / intégrité) ...
Reproduction : étapes de haut niveau (sans données de tiers)
Recommandation : ...
Statut : à corriger / corrigé / accepté
```

---
*Note interne — ne pas diffuser hors ProjetLocatif. Les tests actifs (section 3) ne seront
menés qu'après signature du mandat, de préférence sur un environnement de recette.*
