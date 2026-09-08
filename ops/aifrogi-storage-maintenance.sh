#!/usr/bin/env bash
set -euo pipefail

# Dry-run is the default. The systemd service is the only caller that passes --apply.
MODE="dry-run"
[[ "${1:-}" == "--apply" ]] && MODE="apply"
[[ "${1:-}" == "--dry-run" || -z "${1:-}" || "$MODE" == "apply" ]] || {
  echo "Usage: $0 [--dry-run|--apply]" >&2
  exit 2
}

BACKUP_ROOT="${AIFROGI_BACKUP_ROOT:-/var/backups/aifrogi}"
WWW_ROOT="${AIFROGI_WWW_ROOT:-/var/www}"
TMP_ROOT="${AIFROGI_TMP_ROOT:-/tmp}"
APP_ROOT="${AIFROGI_APP_ROOT:-/var/www/lead-os-ai}"
PM2_LOG_ROOT="${AIFROGI_PM2_LOG_ROOT:-/root/.pm2/logs}"
NPM_CACHE_ROOT="${AIFROGI_NPM_CACHE_ROOT:-/root/.npm/_cacache}"
KEEP_RELEASE_BACKUPS="${AIFROGI_KEEP_RELEASE_BACKUPS:-5}"
KEEP_DB_BACKUPS="${AIFROGI_KEEP_DB_BACKUPS:-7}"
KEEP_STAGES="${AIFROGI_KEEP_STAGES:-2}"
KEEP_TMP_ARTIFACTS="${AIFROGI_KEEP_TMP_ARTIFACTS:-10}"
VERBOSE="${AIFROGI_VERBOSE:-0}"
REMOVE_COUNT=0
CACHE_COUNT=0
LOG_COUNT=0

log() { printf '%s [%s] %s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$MODE" "$*"; }

safe_remove() {
  local target="$1" root="$2"
  [[ -e "$target" || -L "$target" ]] || return 0
  [[ "$target" == "$root"/* && "$target" != "$root" ]] || {
    log "REFUSED unsafe target: $target"
    return 1
  }
  if [[ -e "$target/.keep" || -e "$target.keep" ]]; then
    log "KEEP protected: $target"
    return 0
  fi
  REMOVE_COUNT=$((REMOVE_COUNT + 1))
  [[ "$VERBOSE" == "1" ]] && log "REMOVE $target"
  [[ "$MODE" == "apply" ]] && rm -rf -- "$target"
  return 0
}

prune_newest() {
  local root="$1" keep="$2" kind="$3" pattern="$4"
  [[ -d "$root" ]] || return 0
  local index=0 line target
  while IFS= read -r line; do
    target="${line#* }"
    index=$((index + 1))
    (( index <= keep )) && continue
    safe_remove "$target" "$root"
  done < <(find "$root" -mindepth 1 -maxdepth 1 -type "$kind" -name "$pattern" \
    -printf '%T@ %p\n' | sort -rn)
}

log "storage before: $(df -h / | awk 'NR==2 {print $3 " used, " $4 " free (" $5 ")"}')"

# Timestamped deployment rollback directories are distinct from the permanent releases archive.
prune_newest "$BACKUP_ROOT" "$KEEP_RELEASE_BACKUPS" d '*-20??????.*'
prune_newest "$BACKUP_ROOT" "$KEEP_DB_BACKUPS" f '*.dump'

# Encrypted database sets, checksums, environment snapshots and the permanent releases
# archive are deliberately excluded until a restore-tested policy exists for each format.

# Never match the live /var/www/lead-os-ai directory.
prune_newest "$WWW_ROOT" "$KEEP_STAGES" d 'aifrogi-*'

if [[ -d "$TMP_ROOT" ]]; then
  tmp_index=0
  while IFS= read -r line; do
    target="${line#* }"
    tmp_index=$((tmp_index + 1))
    (( tmp_index <= KEEP_TMP_ARTIFACTS )) && continue
    safe_remove "$target" "$TMP_ROOT"
  done < <(find "$TMP_ROOT" -mindepth 1 -maxdepth 1 \
    \( -name 'aifrogi-*' -o -name '*aifrogi*.tar.gz' \) -printf '%T@ %p\n' | sort -rn)
fi

for cache in "$NPM_CACHE_ROOT" "$APP_ROOT/.next/cache"; do
  if [[ -d "$cache" ]]; then
    CACHE_COUNT=$((CACHE_COUNT + 1))
    [[ "$VERBOSE" == "1" ]] && log "CLEAR cache contents: $cache"
    if [[ "$MODE" == "apply" ]]; then
      find "$cache" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
    fi
  fi
done

# Keep active logs bounded even if host logrotate is unavailable.
if [[ -d "$PM2_LOG_ROOT" ]]; then
  while IFS= read -r logfile; do
    LOG_COUNT=$((LOG_COUNT + 1))
    [[ "$VERBOSE" == "1" ]] && log "TRIM PM2 log to latest 10 MB: $logfile"
    if [[ "$MODE" == "apply" ]]; then
      tail -c 10485760 "$logfile" > "$logfile.trim"
      cp -- "$logfile.trim" "$logfile"
      rm -f -- "$logfile.trim"
    fi
  done < <(find "$PM2_LOG_ROOT" -type f -size +25M -print)
fi

log "summary: $REMOVE_COUNT retained-cycle items, $CACHE_COUNT caches and $LOG_COUNT oversized logs selected"
log "storage after: $(df -h / | awk 'NR==2 {print $3 " used, " $4 " free (" $5 ")"}')"
