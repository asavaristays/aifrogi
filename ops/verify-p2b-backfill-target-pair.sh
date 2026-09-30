#!/usr/bin/env bash
set -euo pipefail
: "${1:?Pass generated REHEARSAL directory}"
: "${2:?Pass generated PRODUCTION directory}"
rehearsal="$1"; production="$2"
for dir in "$rehearsal" "$production"; do
  [[ -d "$dir" ]] || { echo "Generated target directory missing: $dir" >&2; exit 64; }
  (cd "$dir" && shasum -a 256 -c SHA256SUMS >/dev/null)
done
value(){ local file="$1" key="$2"; local count; count="$(grep -Ec "^${key}=" "$file" || true)"; [[ "$count" == 1 ]] || { echo "Invalid ${key} in $file" >&2; exit 65; }; sed -n "s/^${key}=//p" "$file"; }
r_record="$rehearsal/approved-change-record"; p_record="$production/approved-change-record"
[[ "$(value "$r_record" TARGET_KIND)" == REHEARSAL ]] || { echo "First target is not REHEARSAL" >&2; exit 66; }
[[ "$(value "$p_record" TARGET_KIND)" == PRODUCTION ]] || { echo "Second target is not PRODUCTION" >&2; exit 67; }
for key in CHANGE_ID INVENTORY_SHA256; do
  [[ "$(value "$r_record" "$key")" == "$(value "$p_record" "$key")" ]] || { echo "Target pair differs in pinned $key" >&2; exit 68; }
done
r_part5="$(sed -n "s/^approved_part5_sha256='\([0-9a-f]*\)'$/\1/p" "$rehearsal/run-production-backfill.sh")"
p_part5="$(sed -n "s/^approved_part5_sha256='\([0-9a-f]*\)'$/\1/p" "$production/run-production-backfill.sh")"
[[ ${#r_part5} -eq 64 && "$r_part5" == "$p_part5" ]] || { echo "Target pair differs in pinned Part 5" >&2; exit 69; }
[[ "$(value "$r_record" DATABASE_NAME)|$(value "$r_record" SERVER_ADDR)" != "$(value "$p_record" DATABASE_NAME)|$(value "$p_record" SERVER_ADDR)" ]] || { echo "Rehearsal and production targets must be distinct" >&2; exit 70; }
stat_owner(){ stat -c '%U' "$1" 2>/dev/null || stat -f '%Su' "$1"; }
stat_mode(){ stat -c '%a' "$1" 2>/dev/null || stat -f '%Lp' "$1"; }
for dir in "$rehearsal" "$production"; do
  record="$dir/approved-change-record"; wrapper="$dir/run-production-backfill.sh"; inventory="$(value "$record" INVENTORY_PATH)"
  [[ "$(stat_owner "$wrapper")" == "$(value "$record" WRAPPER_OWNER)" && "$(stat_mode "$wrapper")" == 500 ]] || { echo "Wrapper owner/mode finalization failed: $wrapper" >&2; exit 71; }
  [[ "$(stat_owner "$inventory")" == "$(value "$record" INVENTORY_OWNER)" && "$(stat_mode "$inventory")" == "$(value "$record" INVENTORY_MODE)" ]] || { echo "Inventory owner/mode finalization failed: $inventory" >&2; exit 72; }
done
printf 'PASS target pair change=%s part5=%s inventory=%s\n' "$(value "$r_record" CHANGE_ID)" "$r_part5" "$(value "$r_record" INVENTORY_SHA256)"
