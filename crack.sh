#!/usr/bin/env bash
#
# Tries all passwords of the form:
#   [1–10 lowercase letters] + [0–5 digits]
# against bcrypt.hash, exiting immediately if a match is found.

HASH_FILE="bcrypt.hash"
MODE=3200        # bcrypt
ATTACK=3         # mask

for L in $(seq 1 10); do
  for D in $(seq 0 5); do
    # build mask: L × '?l' then D × '?d'
    MASK=""
    for i in $(seq 1 $L); do MASK="${MASK}?l"; done
    for i in $(seq 1 $D); do MASK="${MASK}?d"; done

    echo "→ trying letters length=$L  digits=$D  mask=[$MASK]"

    hashcat \
      -m $MODE -a $ATTACK \
      --potfile-disable \
      --quiet \
      "$HASH_FILE" "$MASK" \
      && {
        echo -e "\n🎉 FOUND!"; 
        exit 0; 
      }
  done
done

echo "❌ Exhausted all combos up to 10 letters + 5 digits."
exit 1
