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
