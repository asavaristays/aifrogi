#!/bin/sh
set -eu
: "${AIFROGI_EDGE_STATE_FILE:?edge state file required}"
: "${AIFROGI_ROLLBACK_COMPATIBILITY_COMMAND:?compatibility command required}"
: "${AIFROGI_ROLLBACK_COMMAND:?rollback command required}"
test "$(tr -d '[:space:]' < "$AIFROGI_EDGE_STATE_FILE")" = CLOSED || { echo 'edge must be CLOSED before rollback' >&2; exit 64; }
sh -c "$AIFROGI_ROLLBACK_COMPATIBILITY_COMMAND"
sh -c "$AIFROGI_ROLLBACK_COMMAND"
test "$(tr -d '[:space:]' < "$AIFROGI_EDGE_STATE_FILE")" = CLOSED || { echo 'rollback changed closed edge state' >&2; exit 65; }
echo EDGE_CLOSED_ROLLBACK_PASS
