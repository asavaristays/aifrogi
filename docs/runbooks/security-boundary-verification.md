# Runbook: Verify Security Boundaries

## Goal

Prove, with repeatable checks, that covered AiFrogi APIs refuse common customer-data boundary attacks.

This verifier does not prove every possible endpoint is isolated. It proves the covered attempts are blocked and gives a repeatable safety net before releases.

## What PASS means

`PASS` means the system correctly refused the attempted action.

Examples:

- unauthenticated API call returned `401`;
- Workspace A user using Workspace B `propertySlug` returned `403`;
- non-admin user calling Owner/Admin API returned `403`.

## Safe target

Prefer staging. The script is designed to use blocked attempts that should fail before real WhatsApp sends or config mutations, but staging is still the right habit for security testing.

## Required test identities

Create or identify:

- Workspace A admin or owner.
- Workspace A limited user, such as AGENT or VIEWER.
- Workspace B property slug that does not belong to Workspace A.

Alternatively, use the temporary fixture runner below. This is the preferred repeatable path when you can run the verifier in the same environment that owns the target database.

## Preferred: run with temporary fixtures

This creates temporary `SECURITY_TEST` workspaces, runs the deep boundary verifier, and deletes the fixtures afterwards.

```bash
AIFROGI_SECURITY_FIXTURE_CONFIRM=create-temporary-security-fixtures \
  npm run verify:security-boundaries:fixtures
```

Expected:

```text
PASS: Covered unauthenticated, cross-workspace propertySlug, and role-gated API boundary checks were correctly refused.
PASS: Deep security-boundary verifier passed with temporary fixtures.
Temporary security fixtures cleaned up.
```

Use this only against staging or when temporary production fixtures are explicitly approved.

## Environment variables

```bash
export AIFROGI_SECURITY_TEST_BASE_URL="https://staging.example.com"
export AIFROGI_TEST_WORKSPACE_A_ADMIN_USER="owner-a@example.com"
export AIFROGI_TEST_WORKSPACE_A_ADMIN_PASSWORD="..."
export AIFROGI_TEST_WORKSPACE_A_LIMITED_USER="agent-a@example.com"
export AIFROGI_TEST_WORKSPACE_A_LIMITED_PASSWORD="..."
export AIFROGI_TEST_WORKSPACE_B_SLUG="workspace-b-slug"
```

Legacy aliases also work for the limited user:

- `AIFROGI_TEST_WORKSPACE_A_AGENT_USER`
- `AIFROGI_TEST_WORKSPACE_A_AGENT_PASSWORD`
- `AIFROGI_TEST_WORKSPACE_A_VIEWER_USER`
- `AIFROGI_TEST_WORKSPACE_A_VIEWER_PASSWORD`

Do not paste real passwords into tickets, chat, logs, or screenshots.

## Run

```bash
npm run verify:security-boundaries
```

## Expected output

```text
PASS: Unauthenticated integration read is blocked
PASS: Unauthenticated template send is blocked before any WhatsApp send
PASS: Workspace A admin cannot use Workspace B propertySlug in template endpoint
PASS: Workspace A admin cannot query Workspace B knowledge context by propertySlug
PASS: Limited user cannot run bulk campaign API directly
PASS: Limited user cannot save WhatsApp integration settings
PASS: Limited user cannot run WhatsApp integration test send
PASS: Limited user cannot validate WhatsApp integration
PASS: Limited user cannot refresh knowledge crawl
```

If any covered attack returns `200`, treat it as a release blocker.
