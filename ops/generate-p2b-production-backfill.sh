#!/usr/bin/env bash
set -euo pipefail
: "${1:?Pass approved change-record path}"
: "${2:?Pass new output directory path}"
record="$1"; output_dir="$2"
[[ -f "$record" ]] || { echo "Change record not found" >&2; exit 64; }
[[ ! -e "$output_dir" ]] || { echo "Output path already exists" >&2; exit 65; }
mode="$(stat -c '%a' "$record" 2>/dev/null || stat -f '%Lp' "$record")"
[[ "$mode" == 600 || "$mode" == 400 ]] || { echo "Change record must be mode 0400 or 0600" >&2; exit 66; }
read_value(){
  local key="$1" count value
  count="$(grep -Ec "^${key}=" "$record" || true)"
  [[ "$count" == 1 ]] || { echo "Change record requires exactly one ${key}" >&2; exit 67; }
  value="$(sed -n "s/^${key}=//p" "$record")"
  [[ -n "$value" && "$value" != *$'\n'* && "$value" != *$'\r'* ]] || { echo "Invalid ${key}" >&2; exit 68; }
  printf '%s' "$value"
}
change_id="$(read_value CHANGE_ID)"
target_kind="$(read_value TARGET_KIND)"
database_name="$(read_value DATABASE_NAME)"
server_addr="$(read_value SERVER_ADDR)"
database_role="$(read_value DATABASE_ROLE)"
wrapper_owner="$(read_value WRAPPER_OWNER)"
inventory_path="$(read_value INVENTORY_PATH)"
inventory_owner="$(read_value INVENTORY_OWNER)"
inventory_mode="$(read_value INVENTORY_MODE)"
inventory_sha256="$(read_value INVENTORY_SHA256)"
commit_token_sha256="$(read_value COMMIT_TOKEN_SHA256)"
[[ "$change_id" =~ ^[A-Za-z0-9._-]{3,80}$ ]] || { echo "Invalid CHANGE_ID" >&2; exit 69; }
[[ "$target_kind" == REHEARSAL || "$target_kind" == PRODUCTION ]] || { echo "TARGET_KIND must be REHEARSAL or PRODUCTION" >&2; exit 69; }
[[ "$database_name" =~ ^[A-Za-z_][A-Za-z0-9_-]{0,62}$ ]] || { echo "Invalid DATABASE_NAME" >&2; exit 70; }
[[ "$database_role" =~ ^[A-Za-z_][A-Za-z0-9_-]{0,62}$ ]] || { echo "Invalid DATABASE_ROLE" >&2; exit 71; }
[[ "$server_addr" =~ ^[0-9A-Fa-f:.]+$ || "$server_addr" == LOCAL_SOCKET ]] || { echo "Invalid SERVER_ADDR" >&2; exit 72; }
[[ "$wrapper_owner" =~ ^[A-Za-z_][A-Za-z0-9_-]{0,62}$ && "$inventory_owner" =~ ^[A-Za-z_][A-Za-z0-9_-]{0,62}$ ]] || { echo "Invalid approved file owner" >&2; exit 72; }
[[ "$inventory_mode" =~ ^[0-7]{3,4}$ ]] || { echo "Invalid INVENTORY_MODE" >&2; exit 72; }
[[ "$inventory_path" =~ ^/[A-Za-z0-9._/-]+$ ]] || { echo "INVENTORY_PATH must be an absolute path using safe characters" >&2; exit 73; }
[[ "$inventory_sha256" =~ ^[0-9a-f]{64}$ && "$commit_token_sha256" =~ ^[0-9a-f]{64}$ ]] || { echo "Invalid SHA-256 value" >&2; exit 74; }
script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
part5="$script_dir/../deliverables/p2a-corrected-v6/05-BACKFILL-AND-ABORT.sql"
part5_sha256="$(shasum -a 256 "$part5" | awk '{print $1}')"
umask 077
mkdir "$output_dir"
cp "$record" "$output_dir/approved-change-record"
cat > "$output_dir/run-production-backfill.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
: "\${AIFROGI_PRODUCTION_BACKFILL_DATABASE_URL:?Explicit production or restored-production target URL required}"
mode="\${1:-dry-run}"
case "\$mode" in dry-run) commit=false;; commit) commit=true;; *) echo 'Usage: run-production-backfill.sh dry-run|commit' >&2; exit 64;; esac
approved_change_id='$change_id'
approved_target_kind='$target_kind'
approved_database='$database_name'
approved_server_addr='$server_addr'
approved_role='$database_role'
approved_wrapper_owner='$wrapper_owner'
approved_inventory='$inventory_path'
approved_inventory_owner='$inventory_owner'
approved_inventory_mode='$inventory_mode'
approved_inventory_sha256='$inventory_sha256'
approved_commit_token_sha256='$commit_token_sha256'
approved_part5_sha256='$part5_sha256'
part5="\${AIFROGI_P2B_PART5_PATH:?Path to reviewed 05-BACKFILL-AND-ABORT.sql required}"
stat_owner(){ stat -c '%U' "\$1" 2>/dev/null || stat -f '%Su' "\$1"; }
stat_mode(){ stat -c '%a' "\$1" 2>/dev/null || stat -f '%Lp' "\$1"; }
[[ "\$(stat_owner "\$0")" == "\$approved_wrapper_owner" && "\$(stat_mode "\$0")" == 500 ]] || { echo 'Generated wrapper owner/mode mismatch' >&2; exit 65; }
[[ "\$(shasum -a 256 "\$part5" | awk '{print \$1}')" == "\$approved_part5_sha256" ]] || { echo 'Part 5 hash mismatch' >&2; exit 65; }
[[ -f "\$approved_inventory" ]] || { echo 'Approved inventory missing' >&2; exit 66; }
[[ "\$(stat_owner "\$approved_inventory")" == "\$approved_inventory_owner" && "\$(stat_mode "\$approved_inventory")" == "\$approved_inventory_mode" ]] || { echo 'Inventory owner/mode mismatch' >&2; exit 66; }
work_dir="\$(mktemp -d)"; trap 'rm -rf "\$work_dir"' EXIT
verified_inventory="\$work_dir/verified-inventory.csv"
cp "\$approved_inventory" "\$verified_inventory"
chmod 0400 "\$verified_inventory"
[[ "\$(shasum -a 256 "\$verified_inventory" | awk '{print \$1}')" == "\$approved_inventory_sha256" ]] || { echo 'Inventory hash mismatch' >&2; exit 67; }
identity="\$(psql "\$AIFROGI_PRODUCTION_BACKFILL_DATABASE_URL" -X -v ON_ERROR_STOP=1 -At -F \$'\\t' -c 'SELECT current_database(),COALESCE(host(inet_server_addr()),chr(76)||chr(79)||chr(67)||chr(65)||chr(76)||chr(95)||chr(83)||chr(79)||chr(67)||chr(75)||chr(69)||chr(84)),session_user')"
IFS=\$'\\t' read -r actual_database actual_server_addr actual_role <<<"\$identity"
[[ "\$actual_database" == "\$approved_database" && "\$actual_server_addr" == "\$approved_server_addr" && "\$actual_role" == "\$approved_role" ]] || { echo 'Approved database identity mismatch' >&2; exit 68; }
if [[ "\$commit" == true ]]; then
 : "\${AIFROGI_BACKFILL_COMMIT_TOKEN:?Commit approval token required}"
 actual_token_sha256="\$(printf '%s' "\$AIFROGI_BACKFILL_COMMIT_TOKEN" | shasum -a 256 | awk '{print \$1}')"
 [[ "\$actual_token_sha256" == "\$approved_commit_token_sha256" ]] || { echo 'Commit approval token mismatch' >&2; exit 69; }
fi
awk -v inventory="\$verified_inventory" 'BEGIN{guard=0;setting=0;copy=0;q=sprintf("%c",39);bs=sprintf("%c",92)} /SELECT set_config\('\''app.migration_batch_id'\''/ {print; print "SELECT set_config('\''app.approved_database'\'', :'\''approved_database'\'', true);"; setting++; next} /IF current_database\(\) !~ '\''_p2b_rehearsal\\\$'\'' THEN RAISE EXCEPTION '\''DISPOSABLE_DATABASE_SUFFIX_REQUIRED'\''; END IF;/ {print " IF current_database() IS DISTINCT FROM current_setting('\''app.approved_database'\'') THEN RAISE EXCEPTION '\''APPROVED_DATABASE_IDENTITY_MISMATCH'\''; END IF;"; guard++; next} /^COPY p2a_filesystem_inventory\(property_id,legacy_id,absolute_path,byte_size,content_sha256,source_id,consent_id\) FROM :'\''filesystem_inventory'\'' WITH \(FORMAT csv,HEADER true\);$/ {print bs "copy p2a_filesystem_inventory(property_id,legacy_id,absolute_path,byte_size,content_sha256,source_id,consent_id) FROM " q inventory q " WITH (FORMAT csv,HEADER true);"; copy++; next} {print} END{if(guard!=1||setting!=1||copy!=1) exit 42}' "\$part5" > "\$work_dir/production-backfill.sql"
psql "\$AIFROGI_PRODUCTION_BACKFILL_DATABASE_URL" -X -v ON_ERROR_STOP=1 -v migration_batch_id="\$approved_change_id" -v commit_backfill="\$commit" -v approved_database="\$approved_database" -f "\$work_dir/production-backfill.sql"
EOF
chmod 0500 "$output_dir/run-production-backfill.sh"
(cd "$output_dir" && shasum -a 256 approved-change-record run-production-backfill.sh > SHA256SUMS)
printf '%s\n' "$output_dir"
