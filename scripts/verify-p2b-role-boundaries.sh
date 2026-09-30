#!/bin/sh
set -eu
: "${DATABASE_URL:?DATABASE_URL must target the disposable rehearsal database}"
case "$DATABASE_URL" in *p2b_rehearsal*) ;; *) echo 'refusing non-rehearsal database' >&2; exit 64;; esac
root_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$root_dir/tests/p2b/seed-role-boundaries.sql"
role_url=$(printf '%s' "$DATABASE_URL" | sed 's#postgres@#aifrogi_web@#')

expect_fail() {
  name=$1
  sql=$2
  if psql "$role_url" -v ON_ERROR_STOP=1 -c "$sql" >/tmp/aifrogi-p2b-boundary.out 2>&1; then
    echo "FAIL $name unexpectedly succeeded" >&2
    cat /tmp/aifrogi-p2b-boundary.out >&2
    exit 1
  fi
  echo "PASS $name"
}

context="SET app.organization_id='p2b-org-a'; SET app.property_id='p2b-property-a'; SET app.security_actor='public-bot:p2b-property-a'; SET app.system_purpose='PUBLIC_GUEST'; SET app.guest_session_hash='session-a';"
psql "$role_url" -v ON_ERROR_STOP=1 -c "$context SELECT aifrogi_security.ensure_guest_session('p2b-property-a','p2b-conversation-a','session-a',clock_timestamp()+interval '1 hour','public-bot:p2b-property-a');" >/dev/null
echo 'PASS authorized guest session creation'
expect_fail 'direct guest-session insert denied' "$context INSERT INTO \"KnowledgeGuestSession\"(id,\"propertyId\",\"conversationId\",\"sessionHash\",\"expiresAt\") VALUES('forged','p2b-property-a','p2b-conversation-a','forged',clock_timestamp()+interval '1 hour');"
expect_fail 'cross-property authority denied' "$context SELECT aifrogi_security.ensure_guest_session('p2b-property-b','p2b-conversation-b','session-a',clock_timestamp()+interval '1 hour','public-bot:p2b-property-a');"
expect_fail 'forged principal denied' "SET app.organization_id='p2b-org-a'; SET app.property_id='p2b-property-a'; SET app.security_actor='attacker'; SET app.system_purpose='PUBLIC_GUEST'; SET app.guest_session_hash='session-x'; SELECT aifrogi_security.ensure_guest_session('p2b-property-a','p2b-conversation-a','session-x',clock_timestamp()+interval '1 hour','attacker');"
expect_fail 'guest-session reparent denied' "$context SELECT aifrogi_security.ensure_guest_session('p2b-property-a','missing-conversation','session-a',clock_timestamp()+interval '1 hour','public-bot:p2b-property-a');"
expect_fail 'answer audit mutation denied' "$context UPDATE \"KnowledgeAnswerAudit\" SET \"deliveryState\"='DELIVERED';"
expect_fail 'handover mutation denied' "$context UPDATE \"KnowledgeHandoverEvent\" SET state='RESOLVED';"

echo 'P2-B role and append-only boundary checks passed'
