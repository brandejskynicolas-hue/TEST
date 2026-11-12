---
name: saisie-compromis-pl
description: Process validé par le siège ProjetLocatif (Marine SCOUBART / Odile GUYON) pour saisir un avant-contrat / compromis sur app.projetlocatif.fr - document signé uniquement, acquéreur inconnu créé via la vente en « hors parcours », mandat de vente rattaché, répartition des honoraires Nicolas/Florian. À charger AVANT toute création ou mise à jour de vente, d'acquéreur ou de pièce jointe sur la plateforme, et dès que Nicolas transmet un compromis, une promesse ou un avant-contrat.
---

# Saisie d'un avant-contrat sur ProjetLocatif — process siège

Ce process remplace toute habitude antérieure. Il code les retours de Marine/Odile ; le journal
complet est dans `projetlocatif-mcp/docs/retours-siege.md`. Accès technique : `../../CLAUDE.md`.

> Marine, 12/11/2026 : « l'IA n'a pas suivi le cheminement qu'elle aurait dû pour cette affaire […]
> cela nous met le bazar car nous avons pleins d'anomalies ». Objectif : **zéro retour du siège**.

## Étape 0 — Relire les consignes du siège (à chaque fois)

1. Gmail : `from:(marine.scoubart@projetlocatif.fr OR odile.guyon@projetlocatif.fr) newer_than:30d`.
   Lire en entier les fils qui contiennent une consigne, une anomalie ou une demande de document.
2. Comparer avec `projetlocatif-mcp/docs/retours-siege.md`. Consigne nouvelle → l'appliquer tout de
   suite, l'ajouter au journal **et** à ce fichier (voir « Boucle d'amélioration »).
3. Ne jamais répondre à Marine/Odile à la place de Nicolas sans son feu vert.

## Étape 1 — Gate « compromis SIGNÉ » (bloquant)

La plateforme reçoit les compromis **après signature uniquement**. Pas signé → on ne crée **rien**
(ni vente, ni acquéreur), on prévient Nicolas, on attend.

Contrôler le PDF page par page (le lire, ne pas se fier au nom du mail) :

| Contrôle | Signé = OK | Projet = STOP |
|---|---|---|
| Page de signature | signatures manuscrites, ou certificat / mention « signé électroniquement le … » (DocuSign, Yousign, notaire) | blocs de signature vides |
| Date de l'acte | date réelle renseignée (« Fait à …, le 12/11/2026 ») | « le ____ », « [date] », date absente |
| Paraphes | présents en bas de page | absents |
| Mentions | aucune | « PROJET », « projet de compromis », filigrane, « version de travail », commentaires / suivi de modifications |
| Fichier | — | nom contenant « projet », « draft », « v2 » envoyé par le notaire **avant** le RDV de signature |

Doute → ne pas déposer ; demander à Nicolas « le compromis signé (exemplaire authentique) » à
réclamer au notaire. Erreur déjà commise **deux fois** : SCI RIUS / DESTOUCHES (10/09/2026) et
EMJ1 / MAYER + EMJ1 / SCI DAN DUBACH (12/11/2026).

**Si c'est un PROJET (avant signature)** : rien sur la plateforme, mais une relecture utile.
Le siège relit volontiers les projets par mail : Odile a repéré le 28/07 un mauvais n° de mandat
avant signature. Contrôler sur le projet :
- le **n° de mandat** cité au paragraphe « négociation » = le mandat de vente du lot. Il a déjà été
  faux deux fois : n° 6032 au lieu de 6029, et n° 5961 d'un autre bien. Le notaire copie-colle d'une
  autre vente ;
- le mandat est **en vigueur à la date de signature**. Les anciens mandats n'ont pas de droit de
  suite : un mandat expiré se renouvelle **avant** de signer. C'est arrivé 4 fois ;
- la **charge des honoraires** est celle du mandat. Elle ne change plus une fois l'acquéreur
  identifié (Marine, 27/10) ;
- les honoraires respectent le barème (étape 2).
Proposer à Nicolas un brouillon de mail à Marine + Odile (Florian en copie) avec le projet. Le
brouillon n'est jamais envoyé sans son feu vert.

## Étape 2 — Lire le compromis et préparer la fiche

Relever, avec la page source : vendeur(s) (personne morale + représentant), acquéreur(s) (identité,
adresse, email/tél s'ils figurent), bien et lot, prix, **honoraires** (montant TTC, qui les paie, et
**répartition entre agences** Fief / ProjetLocatif), notaire(s), date de signature, date butoir de
réitération, conditions suspensives (prêt : montant, durée, date limite).

Honoraires : si le compromis ne détaille pas la part de chaque agence (Fief vs ProjetLocatif) ni
qui est facturé (vendeur ou Fief) → le signaler à Nicolas avant saisie. Marine en a besoin pour
facturer au bon débiteur (cas EMUNAH TRANSACTION / Partouche, 30/10/2026).

Barème à contrôler, sinon signaler :
- **≤ 8 % TTC**. On arrondit le net vendeur à la hausse, jamais à la baisse : au-delà de 8 %,
  c'est interdit (Marine, 09/11) ;
- **minimum 5 900 €**. Exception : la dérogation de Robin, qui couvre Merckel et les petits biens
  comme les garages. Pour un appartement, il faut l'accord de Robin sur ce bien précis ;
- la **charge** (vendeur ou acquéreur) doit être identique au mandat.

## Étape 3 — L'acquéreur : règle « hors parcours » (le point de Marine)

```
Acquéreur déjà présent sur la plateforme ?  (POST /api/prospects/search par nom)
├── OUI, client accompagné par Nicolas/Florian (mandat de recherche)
│      → le SÉLECTIONNER dans la vente + rattacher son mandat de recherche (mandat_recherche_id)
└── NON (cas normal sur les mandats de vente Fief : acheteur venu de l'annonce)
       → le CRÉER DEPUIS LA VENTE (bouton « bonhomme + ») = statut « hors parcours »
```

**Interdit** : créer l'acquéreur par l'onglet **Acquéreurs** (création classique). Il atterrit
« en attente d'accompagnement », sans mandat rattaché → anomalies côté siège, faux client à
accompagner. `scripts/pl-live.sh` refuse désormais cet appel (code retour 3).

Équivalent API exact du bonhomme + (lu dans le code de la plateforme, `app.js`) :

1. `GET /api/public/prospects/init?horsParcours=true` → modèle `user` vierge. Mettre
   `user.prospect.status = "hors_parcours"`.
2. Remplir l'identité d'après le compromis (civilité, nom, prénom, email, téléphone, adresse ;
   personne morale : raison sociale + représentant).
3. `POST /api/prospects?horsParcours=true` avec ce `user` + `password` et `password_confirmation`
   (même chaîne aléatoire, comme le formulaire). **Pas** de `force:true`.
   - Réponse avec `duplicate` → l'acquéreur existe déjà : NE PAS forcer, reprendre l'existant et
     le dire à Nicolas.
4. Relire `GET /api/prospects/{user_id}` : statut `hors_parcours` obligatoire, sinon STOP.
5. Garder `prospect.id` (pas l'id user) pour la vente : `sale.prospects_id = [prospect.id, …]`.

Vendeur ou notaire absent de la plateforme → même logique : le créer depuis la vente (+ du bloc
vendeurs / notaires), jamais depuis un autre onglet.

## Étape 4 — La vente (avant-contrat)

Partir de `GET /api/sales/init` (création) ou `GET /api/sales/{id}` (mise à jour) et remplir :

| Champ | Règle |
|---|---|
| `property_id` | le bien / lot exact du compromis. **Un bien = un mandat = une vente** : un bien déjà rattaché à une autre vente → STOP, le siège duplique le bien |
| `mandat_vente_id` + `honoraires.numero_mandat_vente` | **toujours** rattacher le mandat de vente (recherche : `GET /api/sales/options?value=mandats_vente&text=…`). Même n° que celui cité dans le compromis, et mandat en vigueur à la date de signature. Mandat introuvable, expiré ou n° différent → STOP, demander à Nicolas |
| `mandat_recherche_id` | uniquement si acquéreur accompagné ; vide pour un hors parcours |
| `sellers_id` | le mandant (ex. SAS EMJ1, SCI RIUS… côté Fief) |
| `prospects_id` | id(s) **prospect** de l'étape 3 |
| `notaires_id`, `agences_id` | notaire(s) ; agence partenaire si inter-agence |
| `advisors[]` + honoraires | répartition Nicolas / Florian **confirmée dossier par dossier** — jamais 100 % Nicolas par défaut (Stoeffler : 80 % Florian / 20 % Nicolas). Inconnue → demander avant d'enregistrer |
| `rdv.date_signature` | date de signature lue sur le compromis signé (YYYY-MM-DD) |
| date d'acte | date butoir / prévisionnelle de réitération |
| statut | « Avant-contrat » |
| documents | le **PDF signé** uniquement, nommé « Compromis signé – <vendeur> / <acquéreur> – <adresse> » |

Envoi (= bouton Enregistrer, multipart comme le formulaire) :

```bash
scripts/pl-live.sh FORM /api/sales            -F 'sale=<sale.json' -F 'documents=<documents.json' -F 'files[0]=@compromis-signe.pdf'   # création
scripts/pl-live.sh FORM /api/sales/{id}       -F 'sale=<sale.json' -F 'documents=<documents.json' -F 'files[0]=@compromis-signe.pdf'   # mise à jour
```

`documents.json` = `[{"name":"Compromis signé – …","type":"sale","created_at":<timestamp ms>}]`
(une entrée par fichier, même ordre que `files[i]`). Lire les `warnings` de la réponse.

## Étape 5 — Contrôle après saisie (obligatoire)

Relire `GET /api/sales/{id}` puis chaque `GET /api/prospects/{id}` et cocher :

- [ ] acquéreur(s) en `hors_parcours` (ou accompagné avec son mandat de recherche)
- [ ] `mandat_vente_id` renseigné
- [ ] répartition des honoraires conseillers conforme à ce que Nicolas a validé
- [ ] date de signature = celle du compromis signé ; date d'acte cohérente
- [ ] PDF joint = version signée ; aucun projet en pièce jointe
- [ ] aucun doublon d'acquéreur / de vendeur créé

Puis récap à Nicolas : vente créée (id), acquéreur(s) et statut, mandat, répartition, point(s) en
suspens (ex. répartition Fief/PL absente du compromis).

Saisir **dans les jours qui suivent la signature**. Un mandat a déjà expiré entre la signature et
l'enregistrement (Heidenberg lot 7, 24/08).

## Étape 6 — De l'avant-contrat à l'acte

- **Florian co-conseiller → convention de partage d'honoraires obligatoire.** Elle arrive par
  DocuSign et c'est Nicolas qui la signe. Le rappeler à Nicolas.
- **Date de signature de l'acte** : la notifier sur la vente **seulement après** la convocation du
  notaire. Une date périmée doit être corrigée : le siège suit les règlements dessus (08/09).
- **Factures d'honoraires** : la demande se fait sur la plateforme, onglet Ventes. Le siège les émet
  une semaine avant le rendez-vous. Si le notaire les veut plus tôt, le dire par mail. Le conseiller
  les transmet ensuite au notaire.
- **Facture du conseiller au siège** : le libellé reprend le nom complet de la vente (ex.
  « FIEF / DELLE DONNE »). Elle précise l'entité à payer et facture le montant de la répartition
  saisie, rien d'autre. Le siège ne reverse qu'après avoir reçu les fonds du notaire.
- **Après l'acte** : saisir la date réelle dans le 3ᵉ onglet de la vente (statut « Vente ») et
  envoyer l'acte ou l'attestation de vente.

## Ce que Claude ne fait jamais

- Déposer un projet de compromis, ou créer la vente avant la signature.
- Créer un acquéreur par l'onglet Acquéreurs, ou forcer (`force:true`) un doublon.
- Signer ou faire signer une convention de partage d'honoraires (DocuSign) : c'est Nicolas,
  personnellement (Marine, 01/10/2026 : impossible légalement de déléguer).
- Supprimer / archiver une vente ou un acquéreur pour « réparer » sans accord de Nicolas : on
  signale l'anomalie et on propose la correction.
- Retoucher un PDF de mandat ou d'avenant. Seul le siège les rédige, dans Protexa (loi Hoguet,
  registre des mandats).
- Changer la charge des honoraires une fois l'acquéreur identifié, ou dépasser 8 % TTC.

## Corriger une anomalie déjà créée

Acquéreur créé par erreur via l'onglet Acquéreurs et déjà lié à une vente : ne pas le supprimer
(la vente y est liée). Le signaler à Nicolas avec l'id ; la requalification en « hors parcours »
se fait par le siège (bloc admin) ou, avec accord de Nicolas, par `PUT /api/prospects/{id}` puis
relecture du statut.

## Boucle d'amélioration

Chaque nouveau retour de Marine/Odile → dans le même commit :
1. une ligne dans `projetlocatif-mcp/docs/retours-siege.md` (date, fil Gmail, erreur, règle) ;
2. la règle intégrée à l'étape concernée de ce fichier ;
3. le résumé « Règles siège » de `CLAUDE.md` mis à jour si c'est une règle bloquante.
