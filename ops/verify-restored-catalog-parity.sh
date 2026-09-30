#!/bin/sh
set -eu
: "${1:?source catalog directory required}"
: "${2:?restored catalog directory required}"
source_dir=$1
restored_dir=$2
for file in roles.csv role-memberships.csv table-grants.csv routine-grants.csv object-owners-rls.csv effective-catalog-acls.csv column-acls.csv default-acls.csv; do
  test -r "$source_dir/$file" && test -r "$restored_dir/$file" || { echo "missing catalog: $file" >&2; exit 66; }
  if [ "$file" = effective-catalog-acls.csv ] || [ "$file" = routine-grants.csv ]; then
    source_normalized=$(mktemp); restored_normalized=$(mktemp)
    if [ "$file" = effective-catalog-acls.csv ]; then
      sed 's/^DATABASE,,[^,]*/DATABASE,,<DATABASE>/' "$source_dir/$file" > "$source_normalized"
      sed 's/^DATABASE,,[^,]*/DATABASE,,<DATABASE>/' "$restored_dir/$file" > "$restored_normalized"
    else
      awk -F, 'BEGIN{OFS=","} NR>1{$3="<SPECIFIC_NAME>"} {print}' "$source_dir/$file" > "$source_normalized"
      awk -F, 'BEGIN{OFS=","} NR>1{$3="<SPECIFIC_NAME>"} {print}' "$restored_dir/$file" > "$restored_normalized"
    fi
    cmp -s "$source_normalized" "$restored_normalized" || { rm -f "$source_normalized" "$restored_normalized"; echo "catalog drift: $file" >&2; exit 67; }
    rm -f "$source_normalized" "$restored_normalized"
  else
    cmp -s "$source_dir/$file" "$restored_dir/$file" || { echo "catalog drift: $file" >&2; exit 67; }
  fi
done
echo RESTORED_SECURITY_CATALOG_PARITY_PASS
