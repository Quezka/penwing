#!/usr/bin/env bash
# Architecture check: domain and drawing modules must not depend on GNOME/GI.
set -euo pipefail
cd "$(dirname "$0")/.."
fail=0
for f in lib/pet.js lib/pose.js lib/art.js; do
  if grep -nE "from '(gi|resource)://|imports\.gi" "$f"; then
    echo "FAIL: $f imports GNOME/GI modules" >&2
    fail=1
  fi
done
if grep -nE "penguinActor|extension\.js" lib/pet.js lib/pose.js lib/art.js; then
  echo "FAIL: inner layer imports outer layer" >&2
  fail=1
fi
[ $fail -eq 0 ] && echo "layers ok"
exit $fail
