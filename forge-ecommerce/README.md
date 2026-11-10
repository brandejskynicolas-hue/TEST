# Forge e-commerce — mémoire de pilotage Google Ads

Boutiques de la société Forge suivies ici : **Ma Tresse de Lit** (ma-tresse-de-lit.com) et
**Rideaux Déco**. Objectif : piloter Google Ads (KPI, optimisation, contenus, concurrents) en
rapprochant toujours les chiffres Google Ads des ventes réelles Shopify.

## Accès (session cloud Claude)

| Donnée | Accès | Identifiant |
|---|---|---|
| Google Ads Ma Tresse de Lit | Composio, compte `googleads_norse-arsle` (alias « GADS MTDL ») | client `634-534-6041` |
| Google Ads Rideaux Déco | Composio, compte `googleads_lawing-stadic` | client `297-138-0019` (fuseau Europe/Budapest) |
| Merchant Center Rideaux | lié au compte Ads Rideaux | `5902108999` |
| GA4 Ma Tresse de Lit | Composio `google_analytics_lotase-topaz` | `properties/507864562` |
| Shopify Ma Tresse de Lit | connecteur Shopify (claude.ai) | `8f34bd.myshopify.com` |
| Semrush | connecteur Semrush : rapports mots-clés OK, rapports « domaine » souvent à 0 unité | — |

- Outil Google Ads : `COMPOSIO_MULTI_EXECUTE_TOOL` → `GOOGLEADS_SEARCH_STREAM_GAQL` (GAQL).
  Les dates doivent être bornées (`BETWEEN 'a' AND 'b'` ou `DURING LAST_30_DAYS`).
- Les connecteurs AdCopilot/Synter échouent dans cette session (proxy) : passer par Composio.
- Le connecteur Shopify ne voit qu'une boutique à la fois (`switch-shop` révoque l'accès courant).

## Tableau de bord KPI (live)

https://claude.ai/artifact/YEnfzWuNpsxrXXgCWAqABq — « Pilotage Google Ads Forge ».
12 requêtes live (9 Google Ads via Composio, 3 Shopify), recalculées à chaque ouverture avec
les accès de la personne qui l'ouvre. Indicateurs : dépense, ventes attribuées, ROAS, coût par
vente, ventes nettes Shopify, MER, part des commandes attribuées, campagnes, produits, thèmes
de recherche PMax, sources de visites, état Rideaux Déco.

## Règles de pilotage

- **Rien qui dépense ou modifie une campagne sans validation explicite de Nicolas**, action par
  action (budgets, statuts, enchères, nouvelles campagnes). Lecture et rapports : libres.
- Juger la rentabilité au **MER** (ventes nettes Shopify ÷ dépense Ads) en plus du ROAS :
  GA4 laisse une grosse part des ventes « Unassigned » et l'attribution Google est partielle.
- Pas d'allégation santé/sécurité bébé dans les annonces (tours de lit = sujet sensible,
  cf. article Magicmaman « tresse de lit : pourquoi est-elle dangereuse » en 1ʳᵉ page).

## Fichiers

- `google-ads/audit-2026-11-10.md` — audit initial chiffré + plan d'action.
- `google-ads/contenus-annonces.md` — annonces prêtes à coller, titres de flux, négatifs.
