# Journal des retours du siège (Marine SCOUBART / Odile GUYON)

Chaque remarque du siège sur une saisie devient une règle. Ce journal garde la trace : quoi, quand,
quelle règle en découle. Les règles sont appliquées dans le skill `saisie-compromis-pl`
(`../../.claude/skills/saisie-compromis-pl/SKILL.md`) et résumées dans `../../CLAUDE.md`.

Mise à jour : à chaque nouveau mail de Marine/Odile contenant une consigne ou une anomalie
(recherche Gmail : `from:(marine.scoubart@projetlocatif.fr OR odile.guyon@projetlocatif.fr)`).

## Retours traités

| Date | Affaire / fil | Erreur constatée | Règle retenue | Statut |
|---|---|---|---|---|
| 12/11/2026 | Avant-contrats EMJ1 / MAYER + EMJ1 / SCI DAN DUBACH | Acquéreurs créés par l'IA via l'onglet **Acquéreurs** → affichés « en attente d'accompagnement », anomalies (pas de mandat rattaché…) | Acquéreur inconnu sur un mandat de vente = créé **depuis la vente** (bonhomme +) en **hors parcours** (`POST /api/prospects?horsParcours=true`). Création classique bloquée dans `pl-live.sh` | Process corrigé. Requalification des 2 acquéreurs : à faire (siège ou accord Nicolas) |
| 12/11/2026 | idem | Documents joints = **projets** de compromis, pas les versions signées | Gate « compromis signé » : pas de signature → rien n'est saisi. Contrôle signatures / date / paraphes / mention PROJET | Process corrigé. Nicolas réclame les compromis signés au notaire |
| 10/09/2026 | SCI RIUS / DESTOUCHES (7 rue Albert Einstein) | PDF transmis = projet au lieu du signé (Odile) | Même règle que ci-dessus (1ʳᵉ occurrence) | Clos : signé transmis par Daniéla le 10/09 |
| 30/10/2026 | EMUNAH TRANSACTION / Partouche (27 rue du Kronthal) | Compromis sans détail de la répartition des honoraires Fief / ProjetLocatif → doute sur qui facturer | Vérifier sur le compromis la part de chaque agence et le débiteur (vendeur ou Fief) ; sinon le signaler avant saisie | Clos : 21 k€ PL / 9 k€ Fief, facture au nom du vendeur |
| 30/10/2026 | idem | Saisie bloquée : bien créé par Florian, sélection du conseiller impossible côté Daniéla | Vérifier en amont qui a créé le bien / porte le mandat ; mettre les bons conseillers sur la vente | Clos : saisi par Marine (accès admin) |
| 21/09/2026 | SAS EMJ1 / STOEFFLER (+ RIUS / DESTOUCHES, RIUS SC1 / REY) | Florian absent de la répartition des commissions sur Stoeffler | Répartition Nicolas / Florian confirmée dossier par dossier, jamais 100 % Nicolas par défaut (Stoeffler : 80 % Florian / 20 % Nicolas) | Clos : corrigé par Marine |
| 21/09/2026 | idem | — (info) | Le siège envoie un mail « financement » aux acquéreurs à chaque offre / avant-contrat (demande de Robin) | Info |
| 01/10/2026 | Convention de partage d'honoraires Fief / Girard | Demande de faire signer les conventions par Daniéla | Impossible légalement : Nicolas signe lui-même (redirection Gmail des mails DocuSign possible). Claude ne signe jamais | Règle |
| 10-11/09/2026 | 220 rte d'Oberhausbergen / Einstein | Confusion de notifications entre deux compromis | Toujours nommer l'affaire (vendeur / acquéreur / adresse) dans les échanges et les noms de fichiers | Info |
| 27/10/2026 | Avenants lots 3, 4, 7, 8 – 14 rue Laegert | Charge des honoraires changée alors que l'acquéreur était identifié ; compromis citant le mandat n° 5961, qui appartient à un autre bien | Charge des honoraires figée dès qu'un acquéreur est identifié. Contrôler le n° de mandat au § négociation. Une baisse de prix négociée ou un écart de surface Carrez n'exige pas d'avenant, sauf annonce publiée | Règle |
| 28/07/2026 | Projet de compromis lot 5 – 185 Schirmeck | Mandat n° 6032 cité au lieu du n° 6029 (copier-coller du notaire) | Faire relire le projet par le siège avant signature (par mail, pas sur la plateforme) | Règle |
| 07/07, 24/08, 01/09, 27/10/2026 | Porteurs lots 11, 12, 13 ; Heidenberg lot 7 | Mandat expiré au moment de l'annonce ou du compromis (4 fois) | Mandat en vigueur le jour du compromis (pas de droit de suite sur les anciens). Saisir la vente vite après la signature | Règle |
| 09/11/2026 | Avenants Fief – restructuration des prix | Honoraires au-delà de 8 % | Honoraires ≤ 8 % TTC, net vendeur arrondi à la hausse. Mandant = la société réellement propriétaire, justificatif de propriété joint | Règle |
| 20/08/2026 | Dérogation honoraires | Honoraires sous le minimum de 5 900 € | Minimum 5 900 €. La dérogation de Robin couvre Merckel et les garages ; un appartement demande un accord au cas par cas | Règle |
| 10/11/2026 | Mandats Fief – regroupement | — | Un bien = un mandat = une vente. Regroupement par immeuble et par propriétaire accepté pour les projets à venir ; les mandats en vigueur restent sur l'ancienne formule | Ouvert (voir ci-dessous) |
| 01/10/2026 | Mandat lot 6 – 185 route de Schirmeck | Avenant PDF retouché par l'assistante | Seul le siège rédige mandats et avenants (Protexa, loi Hoguet). Ne jamais modifier un PDF | Règle |
| 11/06, 28/08, 01/09/2026 | Annonces LBC | Annonce non conforme au mandat ou publiée sans mandat valide | Annonce strictement conforme au mandat ou à l'avenant signé. Baisse de prix publique = avenant signé. Pas d'annonce sans mandat en vigueur | Règle |
| 07/09/2026 | Facture lot 7 – 76 rue Heidenberg | Date de vente périmée sur la plateforme | Notifier la date d'acte après la convocation du notaire ; corriger toute date dépassée | Règle |
| 04/06, 23/09/2026 | Factures conseiller | Libellé ou montant faux, convention de partage manquante | Libellé = nom complet de la vente. Montant = répartition saisie. Convention de partage obligatoire si Florian est co-conseiller | Règle |

## Erreurs récurrentes (balayage Gmail du 12/11/2026)

| Erreur | Occurrences |
|---|---|
| Mandat expiré au moment de l'annonce ou du compromis | 4 |
| Charge des honoraires incohérente ou changée trop tard | 4 |
| Prix contradictoires ou changés en cours de route | 3 |
| Factures conseiller fausses | 3 |
| Projet de compromis déposé au lieu du signé | 2 |
| Mauvais n° de mandat dans le compromis | 2 |
| Honoraires hors barème (> 8 % ou < 5 900 €) | 2 |
| Délégation ou convention non alignée sur le mandat | 2 |
| Acquéreur créé par l'onglet Acquéreurs au lieu de « hors parcours » | 1 (2 acquéreurs) |

## Points ouverts au 12/11/2026

1. Les acquéreurs des ventes EMJ1 / MAYER et EMJ1 / SCI DAN DUBACH sont à requalifier en
   « hors parcours ». Les compromis signés doivent remplacer les projets joints.
2. Burkel lot 10 : Florian demande une fourchette de 110 à 132 k€ (prêt à décorer ou clés en
   main). Marine n'a pas répondu.
3. Regroupement des mandats Fief : la réponse de Marine (projets à venir seulement) ne colle pas
   au plan de Nicolas (clôturer les demandes n° 847 à 882 et faire 10 mandats). À clarifier.
4. Côté Nicolas : Kbis et attestations, fiches vendeur des sociétés Fief, SIREN de la fiche
   « SAS FIEF » à corriger.
5. Daniéla est en pause : il faut décider qui suit les retours du siège.
6. Points du 23/09 (Odile) : signature de la convention de partage avec Florian et facture
   réémise à 901,25 € HT. Aucune confirmation dans la boîte.
