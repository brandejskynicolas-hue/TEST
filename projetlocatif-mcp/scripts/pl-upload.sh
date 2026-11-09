#!/usr/bin/env bash
# Envoi multipart (pièce jointe) vers ProjetLocatif, même auth que pl-live.sh.
#
# Usage :
#   pl-upload.sh <chemin_api> <fichier> champ=valeur [champ=valeur ...]
#
# Exemple (justificatif de propriété sur une demande de mandat) :
#   pl-upload.sh /api/mandats/documents ./acte.pdf \
#       mandat_id=847 type=justificatif_propriete "name=Justificatif de propriété"
# Le fichier est envoyé dans le champ "document" (champ attendu par l'appli).
set -euo pipefail

BASE="https://app.projetlocatif.fr"
DATA_DIR="${PL_DATA_DIR:-$HOME/.projetlocatif-mcp}"
COOKIE_FILE="$DATA_DIR/cookie.txt"
JAR="$DATA_DIR/jar.txt"

[ -s "$COOKIE_FILE" ] || { echo "Cookie absent : écris 'projetlocatif_session=...' dans $COOKIE_FILE" >&2; exit 1; }
SESSION="$(cat "$COOKIE_FILE")"
APIP="${1:?chemin /api/...}"; FILE="${2:?fichier}"; shift 2
[ -f "$FILE" ] || { echo "Fichier introuvable : $FILE" >&2; exit 1; }

if [ ! -s "$JAR" ] || [ -n "$(find "$JAR" -mmin +10 2>/dev/null || true)" ]; then
  curl -sS -m 30 -o /dev/null -c "$JAR" -b "$SESSION" "$BASE/prospects" >/dev/null
fi
LAR="$(awk '/laravel_token/{print $6"="$7}' "$JAR")"
XSRAW="$(awk '/XSRF-TOKEN/{print $7}' "$JAR" | tail -1)"
XSDEC="$(python3 -c "import urllib.parse,sys;print(urllib.parse.unquote(sys.argv[1]))" "$XSRAW")"

FORM=()
for kv in "$@"; do FORM+=(-F "$kv"); done

curl -sS -m 180 \
  -H "Accept: application/json" -H "X-Requested-With: XMLHttpRequest" \
  -H "X-XSRF-TOKEN: $XSDEC" -H "Referer: $BASE/mandats" \
  -H "Cookie: $SESSION; $LAR; XSRF-TOKEN=$XSRAW" \
  "${FORM[@]}" -F "document=@$FILE;type=application/pdf" \
  -X POST "$BASE$APIP"
