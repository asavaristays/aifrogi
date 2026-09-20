# AI Readiness quarantine rule

**Effective immediately:** AiFrogi AI Readiness is not a live-bot capability.
It is a separate product under construction and must not increase the blast
radius of the existing AiFrogi Bot product.

## Enforced boundaries in the bot repository

1. No `app/`, `components/`, or non-Readiness `lib/` runtime code may import
   Readiness modules or access a Readiness Prisma delegate.
2. Readiness modules must not access PMS/connectors, Razorpay/payment,
   booking/quotation, or encrypted credential paths.
3. Readiness has no public endpoint, bot menu item, widget behavior, crawler,
   scheduled worker, or automatic write-back.
4. Every Core release invokes `verify:ai-readiness:quarantine`; a violation
   blocks the release gate.

## Transitional state

The R1 tables remain in the existing database only as an empty, RLS-protected,
additive rollback artifact. They are not a product datastore and must receive
no tenant data. R2 is blocked in this repository.

## Exit condition

New Readiness work can begin only after an independent service, database,
credential set, backup policy and API-only tenant/fact snapshot contract are
created. The existing tables are retained through the isolation pilot, then
retired under an explicit migration/retention plan.
