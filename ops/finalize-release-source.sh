#!/bin/sh
set -eu
: "${AIFROGI_RELEASE_ID:?required}"
: "${AIFROGI_RELEASE_SOURCE_PRIVATE_KEY_FILE:?required}"
: "${AIFROGI_RELEASE_SOURCE_KEY_ID:?required}"
: "${AIFROGI_RELEASE_TRUST_FILE:?required}"
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd); cd "$root"
inventory=ops/release-source-inventory.txt
while IFS= read -r path; do [ -n "$path" ] || continue; [ -f "$path" ] || { echo "missing release input: $path" >&2; exit 66; }; if ! git ls-files --error-unmatch "$path" >/dev/null 2>&1; then echo "untracked release input: $path" >&2; exit 67; fi; if ! git diff --quiet -- "$path" || ! git diff --cached --quiet -- "$path"; then echo "uncommitted release input: $path" >&2; exit 68; fi; done < "$inventory"
commit=$(git rev-parse HEAD); out=${AIFROGI_RELEASE_OUTPUT_DIR:-evidence}; umask 077; mkdir -p "$out"
manifest="$out/${AIFROGI_RELEASE_ID}.source-manifest.json"; signed="$out/${AIFROGI_RELEASE_ID}.signed-source.json"
node ops/build-release-source-manifest.mjs "$AIFROGI_RELEASE_ID" "$commit" "$inventory" "$manifest"
node ops/sign-release-source.mjs "$manifest" "$signed"
node ops/verify-signed-release-source.mjs "$signed" "$AIFROGI_RELEASE_TRUST_FILE"
echo "RELEASE_SOURCE_FINALIZATION_PASS $commit"
