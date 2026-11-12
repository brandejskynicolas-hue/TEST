#!/usr/bin/env bash
# Accès live ProjetLocatif (session cloud). Lecture ET écriture.
# Auth = cookie de session + jeton Passport laravel_token (auto) + X-XSRF-TOKEN décodé.
#
# Pré-requis : écrire le cookie dans ~/.projetlocatif-mcp/cookie.txt :
#     projetlocatif_session=<valeur copiée dans le navigateur>
# (fichier secret, jamais committé)
#
# Usage :
#   pl-live.sh GET    /api/prospects/search            # (search accepte aussi GET vide)
#   pl-live.sh POST   /api/prospects/search '{"page":1}'
#   pl-live.sh POST   /api/sales/123        '{...}'    # mise à jour d'une vente
#   pl-live.sh PUT    /api/properties/456/delete       # suppression (soft)
#   pl-live.sh DELETE /api/properties/456
#   pl-live.sh FORM   /api/sales/123 -F 'sale=<sale.json' -F 'documents=<docs.json' -F 'files[0]=@compromis-signe.pdf'
#                     # multipart (= bouton Enregistrer de la vente, avec pièces jointes)
#
# GARDE-FOU SIÈGE (retour Marine du 12/11/2026) :
#   la création d'acquéreur par l'onglet « Acquéreurs » (POST /api/prospects sans horsParcours=true)
#   est BLOQUÉE. Un acquéreur inconnu lié à une vente se crée via la vente (bonhomme +)
#   = POST /api/prospects?horsParcours=true  → statut « hors parcours ».
#   Voir .claude/skills/saisie-compromis-pl/SKILL.md. Dérogation explicite de Nicolas uniquement :
#   PL_ALLOW_PROSPECT_PARCOURS=1 (création d'un vrai client à accompagner, avec mandat de recherche).
set -euo pipefail

BASE="https://app.projetlocatif.fr"
DATA_DIR="${PL_DATA_DIR:-$HOME/.projetlocatif-mcp}"
COOKIE_FILE="$DATA_DIR/cookie.txt"
JAR="$DATA_DIR/jar.txt"

[ -s "$COOKIE_FILE" ] || { echo "Cookie absent : écris 'projetlocatif_session=...' dans $COOKIE_FILE" >&2; exit 1; }
SESSION="$(cat "$COOKIE_FILE")"
METHOD="${1:?methode GET|POST|PUT|DELETE|FORM}"; APIP="${2:?chemin /api/...}"; BODY="${3:-}"

# Garde-fou : jamais d'acquéreur « en parcours » créé par l'IA (cf. en-tête).
if [ "$METHOD" != "GET" ] && [[ "$APIP" =~ ^/api/prospects/?(\?.*)?$ ]] \
   && [[ "$APIP" != *"horsParcours=true"* ]] && [ "${PL_ALLOW_PROSPECT_PARCOURS:-0}" != "1" ]; then
  cat >&2 <<'MSG'
REFUSÉ : création d'acquéreur via l'onglet Acquéreurs.
Règle siège (Marine, 12/11/2026) : acquéreur inconnu sur un mandat de vente = créé VIA LA VENTE
(bonhomme +) avec le statut « hors parcours » :  POST /api/prospects?horsParcours=true
Voir .claude/skills/saisie-compromis-pl/SKILL.md (étape 3).
MSG
  exit 3
fi

# (ré)amorce laravel_token + XSRF-TOKEN si le jar est vide ou vieux de +10 min
if [ ! -s "$JAR" ] || [ -n "$(find "$JAR" -mmin +10 2>/dev/null || true)" ]; then
  curl -sS -m 30 -o /dev/null -c "$JAR" -b "$SESSION" "$BASE/prospects" >/dev/null
fi
LAR="$(awk '/laravel_token/{print $6"="$7}' "$JAR")"
XSRAW="$(awk '/XSRF-TOKEN/{print $7}' "$JAR" | tail -1)"
XSDEC="$(python3 -c "import urllib.parse,sys;print(urllib.parse.unquote(sys.argv[1]))" "$XSRAW")"

COMMON=(-sS -m 30
  -H "Accept: application/json" -H "X-Requested-With: XMLHttpRequest"
  -H "X-XSRF-TOKEN: $XSDEC" -H "Referer: $BASE/prospects"
  -H "Cookie: $SESSION; $LAR; XSRF-TOKEN=$XSRAW")

case "$METHOD" in
  GET)            curl "${COMMON[@]}" "$BASE$APIP" ;;
  DELETE)         curl "${COMMON[@]}" -X DELETE "$BASE$APIP" ;;
  POST|PUT|PATCH) curl "${COMMON[@]}" -X "$METHOD" "$BASE$APIP" -H "Content-Type: application/json" --data "${BODY:-{}}" ;;
  FORM)           shift 2; curl "${COMMON[@]}" -X POST "$BASE$APIP" "$@" ;;
  *) echo "Méthode non supportée: $METHOD" >&2; exit 2 ;;
esac
