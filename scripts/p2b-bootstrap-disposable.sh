#!/bin/sh
set -eu
: "${DATABASE_URL:?DATABASE_URL must target an empty disposable database}"
case "$DATABASE_URL" in *p2b_rehearsal*) ;; *) echo 'refusing non-rehearsal database' >&2; exit 64;; esac
root_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
set -- \
  "$root_dir/prisma/p2b-baseline/runtime-roles.sql" \
  "$root_dir/prisma/p2b-baseline/baseline.sql" \
  "$root_dir/ops/tenant-rls-policies.sql" \
  "$root_dir/prisma/migrations/20260929090000_p2a_v6_canonical_authority/migration.sql" \
  "$root_dir/prisma/migrations/20260929170000_canonical_owner_publication_bridge/migration.sql" \
  "$root_dir/prisma/migrations/20260929183000_record_authorized_website_snapshot/migration.sql" \
  "$root_dir/prisma/migrations/20260929233000_signed_bot_release_activation/migration.sql" \
  "$root_dir/prisma/migrations/20260929234500_multisource_knowledge_release/migration.sql" \
  "$root_dir/prisma/migrations/20260929193000_multibot_crawl_index/migration.sql" \
  "$root_dir/prisma/migrations/20260929194500_multibot_retrieval_or_terms/migration.sql" \
  "$root_dir/prisma/migrations/20260929200000_crawl_answer_audit/migration.sql" \
  "$root_dir/prisma/migrations/20260929220000_active_crawl_no_legacy_fallback/migration.sql" \
  "$root_dir/prisma/migrations/20260930000500_material_claim_enforcement/migration.sql" \
  "$root_dir/prisma/migrations/20260930003500_retention_payload_disposal/migration.sql" \
  "$root_dir/prisma/migrations/20260930005000_compatible_knowledge_rollback/migration.sql" \
  "$root_dir/prisma/migrations/20260930006500_per_bot_factual_closure/migration.sql" \
  "$root_dir/prisma/migrations/20260930010000_governed_control_plane/migration.sql" \
  "$root_dir/prisma/migrations/20261001010000_public_active_release_evidence/migration.sql" \
  "$root_dir/prisma/migrations/20261001020000_shared_spreadsheet_evidence/migration.sql" \
  "$root_dir/prisma/migrations/20261001030000_search_canonical_public_claims/migration.sql" \
  "$root_dir/prisma/migrations/20261001040000_canonical_excel_crawl_evidence/migration.sql" \
  "$root_dir/prisma/migrations/20261003090000_unified_rag/migration.sql" \
  "$root_dir/prisma/migrations/20261017090000_business_crawl_review/migration.sql" \
  "$root_dir/prisma/migrations/20261017100000_answer_runtime_provisioning/migration.sql"
for required_file do
  if [ ! -r "$required_file" ]; then
    echo "required bootstrap input missing: $required_file" >&2
    exit 66
  fi
done
database_timezone=$(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -Atqc "SHOW timezone")
case "$database_timezone" in UTC|Etc/UTC) ;; *) echo 'rehearsal database must use UTC before bootstrap' >&2; exit 67;; esac
existing_relations=$(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -Atqc "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname !~ '^pg_toast' AND c.relkind IN ('r','p','v','m','S')")
if [ "$existing_relations" -ne 0 ]; then
  echo 'refusing non-empty bootstrap target' >&2
  exit 65
fi

# The operational RLS script owns a transaction when run directly. Strip only
# its outer transaction markers so this rehearsal remains one atomic bootstrap.
rls_file=$(mktemp "${TMPDIR:-/tmp}/aifrogi-rehearsal-rls.XXXXXX")
trap 'rm -f "$rls_file"' EXIT HUP INT TERM
sed '/^BEGIN;$/d; /^COMMIT;$/d' "$root_dir/ops/tenant-rls-policies.sql" > "$rls_file"

# One transaction covers the baseline and every canonical migration. A failure
# leaves no partial schema, so the corrected procedure can be rerun safely.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 \
  -f "$root_dir/prisma/p2b-baseline/runtime-roles.sql" \
  -f "$root_dir/prisma/p2b-baseline/baseline.sql" \
  -f "$rls_file" \
  -f "$root_dir/prisma/migrations/20260929090000_p2a_v6_canonical_authority/migration.sql" \
  -f "$root_dir/prisma/migrations/20260929170000_canonical_owner_publication_bridge/migration.sql" \
  -f "$root_dir/prisma/migrations/20260929183000_record_authorized_website_snapshot/migration.sql" \
  -f "$root_dir/prisma/migrations/20260929233000_signed_bot_release_activation/migration.sql" \
  -f "$root_dir/prisma/migrations/20260929234500_multisource_knowledge_release/migration.sql" \
  -f "$root_dir/prisma/migrations/20260929193000_multibot_crawl_index/migration.sql" \
  -f "$root_dir/prisma/migrations/20260929194500_multibot_retrieval_or_terms/migration.sql" \
  -f "$root_dir/prisma/migrations/20260929200000_crawl_answer_audit/migration.sql" \
  -f "$root_dir/prisma/migrations/20260929220000_active_crawl_no_legacy_fallback/migration.sql" \
  -f "$root_dir/prisma/migrations/20260930000500_material_claim_enforcement/migration.sql" \
  -f "$root_dir/prisma/migrations/20260930003500_retention_payload_disposal/migration.sql" \
  -f "$root_dir/prisma/migrations/20260930005000_compatible_knowledge_rollback/migration.sql" \
  -f "$root_dir/prisma/migrations/20260930006500_per_bot_factual_closure/migration.sql" \
  -f "$root_dir/prisma/migrations/20260930010000_governed_control_plane/migration.sql" \
  -f "$root_dir/prisma/migrations/20261001010000_public_active_release_evidence/migration.sql" \
  -f "$root_dir/prisma/migrations/20261001020000_shared_spreadsheet_evidence/migration.sql" \
  -f "$root_dir/prisma/migrations/20261001030000_search_canonical_public_claims/migration.sql" \
  -f "$root_dir/prisma/migrations/20261001040000_canonical_excel_crawl_evidence/migration.sql" \
  -f "$root_dir/prisma/migrations/20261003090000_unified_rag/migration.sql" \
  -f "$root_dir/prisma/migrations/20261017090000_business_crawl_review/migration.sql" \
  -f "$root_dir/prisma/migrations/20261017100000_answer_runtime_provisioning/migration.sql"
