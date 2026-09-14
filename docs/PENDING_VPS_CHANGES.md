# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

| ID | Change | Local evidence | Remaining action |
| --- | --- | --- | --- |
| `OPS-002` | Mandatory release gates plus scheduled encrypted backup and isolated restore drill | Shell syntax, Node syntax, TypeScript and Core regression passed locally. GitHub workflow now runs Core and tenant/fleet unit gates. | Deploy operational scripts, generate and verify the first encrypted backup, run the first disposable-Postgres restore drill, install monitored cron entries and verify the production fleet gate. |
