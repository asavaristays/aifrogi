# Customer operations button refinement

- Scope: Super Admin → Customers action controls only.
- Balanced two-column layout; rounded buttons; consistent 42px minimum height and 14px labels.
- Black primary Open action, soft gold Pause/Restore, neutral Suspend/Reactivate, restrained red Remove.
- Icons supplement visible labels. Keyboard focus, reduced-motion, busy announcement and error alert included.
- Scoped CSS module explicitly sets foreground/background colours to prevent inherited dark-on-dark text.
- Existing endpoints, action names, disabled conditions and removal-reason prompt preserved. No customer, bot, knowledge, billing or connector data changed.
- Validation: TypeScript check and whitespace check passed. Browser visual testing was not performed.
- Deployment uses the existing staging build, readiness check, backup and rollback path. Release: `customer-actions-20260906`; previous release: `bucket4-sheet-recovery-20260906`.
