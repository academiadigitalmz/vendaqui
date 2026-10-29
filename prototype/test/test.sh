#!/bin/sh
# Renderiza todas as rotas, modais e gavetas de cada variante e falha se algo der erro.
set -e
cd "$(dirname "$0")/.."
python3 src/build.py
fail=0
for f in dist/artifact/*.html; do
  out=$(node test/run.js "$f")
  echo "$out" | grep -E "FAIL|undefined|NaN" && fail=1
  echo "$(basename "$f"): $(echo "$out" | tail -1)"
done
exit $fail
