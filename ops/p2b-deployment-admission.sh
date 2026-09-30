#!/bin/sh
# The executable deployment control is kept byte-for-byte aligned with the
# reviewed Part 17 artifact by the admission verification suite.
exec "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)/deliverables/p2a-corrected-v6/17-PROPOSED-DEPLOYMENT-ADMISSION.sh" "$@"
