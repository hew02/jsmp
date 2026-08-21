#!/bin/sh
HTML="$(cat ./src/jsmp.html | minify --type html)"
CSS="$(cat ./src/style.css | minify --type css)"
JS="$(cat ./src/jsmp.js | minify --type js)"

escape_sed_repl() {
  printf '%s' "$1" \
    | sed -e 's/[\/&|\\]/\\&/g'
}

HTML_E="$(escape_sed_repl "$HTML")"
CSS_E="$(escape_sed_repl "$CSS")"

MINI="$(printf '%s' "$JS" \
  | awk -v css="<style>$CSS</style>" -v html="$HTML" '
      { gsub(/\{\{CSS\}\}/, css) }
      { gsub(/\{\{HTML\}\}/, html) }
      { print }
    ')"
    
echo "$MINI" > "./jsmp.min.js"
