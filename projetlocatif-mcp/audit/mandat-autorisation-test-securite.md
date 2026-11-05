# Autorisation de test de sécurité (mandat)

> Modèle à adapter et à faire signer par la personne habilitée chez ProjetLocatif.
> Ce document n'est pas un avis juridique ; faites-le valider par le responsable concerné.

---

**Entre les soussignés :**

- **Le commanditaire / responsable du système et des données** :
  Société : ……………………………………………………… (éditrice / exploitante de la plateforme `app.projetlocatif.fr`)
  Représentée par : ……………………………………… (nom, qualité — ex. dirigeant)
  Ci-après « le Commanditaire ».

- **L'intervenant** :
  Nom : **Nicolas BRANDEJSKY** (conseiller, compte utilisateur id 8570)
  Ci-après « l'Intervenant ».

## 1. Objet
Le Commanditaire autorise l'Intervenant à réaliser un **test de sécurité** (évaluation des
contrôles d'accès) sur la plateforme `app.projetlocatif.fr`, afin de vérifier la bonne
étanchéité des droits entre comptes (notamment accès à des données hors du périmètre d'un
conseiller : IDOR, élévation de privilèges, contrôle d'autorisation objet par objet).

## 2. Périmètre autorisé
- Cibles : …………………………………………………………………… (URLs / endpoints / modules concernés)
- Environnement : ☐ Recette/staging dédié (recommandé) ☐ Production
  URL de l'environnement : ………………………………………………………………
- Comptes de test fournis : ………………………………………………………………
- Types de tests autorisés : contrôle d'accès / IDOR / élévation de privilèges / CSRF /
  exposition d'information. (Cocher/compléter.)

## 3. Exclusions (sauf accord écrit complémentaire)
- Pas de déni de service (DoS), pas de test de charge destructif.
- Pas d'extraction massive de données ; en cas d'accès non autorisé démontré, **l'accès est
  constaté sur un échantillon minimal** suffisant à la preuve, puis **cessé immédiatement**.
- Pas de modification/suppression de données de production appartenant à des tiers.
- Pas d'ingénierie sociale sur les salariés/clients, pas d'accès aux comptes de tiers réels.

## 4. Données personnelles (RGPD)
Si des données personnelles de tiers sont rendues visibles par une faille, l'Intervenant :
ne les copie pas, ne les diffuse pas, les mentionne dans le rapport uniquement de façon
anonymisée/au strict nécessaire à la preuve, et les signale sans délai au Commanditaire.

## 5. Confidentialité et divulgation responsable
Les constats sont **confidentiels**, remis au seul Commanditaire via : ……………………………………
(contact technique + e-mail). Aucune publication sans accord écrit.

## 6. Durée
Du ……/……/……… au ……/……/……… , de ……h à ……h (fenêtre de test).

## 7. Responsabilité et bonne foi
L'Intervenant agit dans le seul cadre défini ci-dessus. Les actions menées dans ce périmètre
et cette fenêtre sont réputées **autorisées** par le Commanditaire, responsable du système et
des données testées.

---

Fait à ……………………………, le ……/……/………, en deux exemplaires.

**Le Commanditaire**                         **L'Intervenant**
(nom, qualité, signature)                    (Nicolas BRANDEJSKY, signature)
