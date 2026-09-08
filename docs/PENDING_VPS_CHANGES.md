# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## Conclusive support interaction

- Track the last client/admin view and which side produced the latest ticket activity.
- Surface only actionable support updates on the client Today page and open the referenced ticket directly.
- Surface new client activity, urgent tickets and overdue responses in the super-admin Command Center.
- Includes the additive `20260908063000_support_response_visibility` database migration and regenerated Prisma client.
- Validation complete: 122/122 channel tests, focused ESLint, TypeScript, whitespace checks and the 75-route production build pass.
