#!/usr/bin/env bash
# Regenerate the embedded @font-face block in vale.html.
#
# Downloads the Latin subset of each face from Google Fonts and inlines it as a
# data URI, so the game carries its own type and asks the network for nothing.
# Run this only when a face or weight changes; the output is committed inside
# vale.html and no build step exists at runtime.
#
#   bash tools/fonts.sh          # prints the @font-face CSS to stdout
#
# Faces (Ministry Precise, docs/AGREEMENT.md): Marcellus 400 · Archivo Narrow
# 500/600 · Public Sans 400/600 · IBM Plex Mono 400/600.
set -euo pipefail
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

emit() { # family  weight  css-query
  local fam="$1" wt="$2" q="$3"
  curl -sS -H "User-Agent: $UA" "https://fonts.googleapis.com/css2?family=${q}&display=swap" > "$TMP/f.css"
  local url
  url=$(python3 -c "
import re,sys
css=open('$TMP/f.css').read()
for b in re.findall(r'@font-face\s*\{(.*?)\}', css, re.S):
    ur=re.search(r'unicode-range:\s*([^;]+);', b); src=re.search(r'url\((https://[^)]+\.woff2)\)', b)
    if src and ur and 'U+0000-00FF' in ur.group(1): print(src.group(1)); break
")
  [ -n "$url" ] || { echo "no latin subset for $fam $wt" >&2; exit 1; }
  curl -sS -H "User-Agent: $UA" "$url" -o "$TMP/f.woff2"
  printf "@font-face{font-family:'%s';font-style:normal;font-weight:%s;font-display:swap;src:url(data:font/woff2;base64,%s) format('woff2')}\n" \
    "$fam" "$wt" "$(base64 -w0 "$TMP/f.woff2")"
}

echo "/* Embedded Latin subsets — the file carries its own type and asks the"
echo "   network for nothing. Regenerate with tools/fonts.sh. */"
emit 'Marcellus'      400 'Marcellus'
emit 'Archivo Narrow' 500 'Archivo+Narrow:wght@500'
emit 'Archivo Narrow' 600 'Archivo+Narrow:wght@600'
emit 'Public Sans'    400 'Public+Sans:wght@400'
emit 'Public Sans'    600 'Public+Sans:wght@600'
emit 'IBM Plex Mono'  400 'IBM+Plex+Mono:wght@400'
emit 'IBM Plex Mono'  600 'IBM+Plex+Mono:wght@600'
