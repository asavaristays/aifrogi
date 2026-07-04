# Runbook: Privileged Login OTP

## What is enabled

AiFrogi requires email OTP step-up during login for privileged users:

- platform admin;
- workspace OWNER;
- workspace ADMIN.

Workspace AGENT and VIEWER accounts remain password-only unless the policy is expanded later.

## Login flow

1. User enters email and password.
2. Server verifies password.
3. If the user is privileged, AiFrogi emails a 6-digit OTP.
4. User enters the OTP.
5. Server creates the session only after password and OTP both pass.

## Security behavior

- OTP expires after 10 minutes.
- OTP allows 5 attempts.
- OTP is stored server-side as a hash, not plain text.
- OTP challenges are memory-only and disappear on server restart.
- Login attempts are rate-limited by IP and account.
- If email cannot be sent for a privileged user, login fails closed.

## Operations

Email OTP depends on the configured AiFrogi mailbox/SMTP settings. If privileged users cannot sign in, check:

```text
BOOKING_INBOX_EMAIL
BOOKING_INBOX_PASSWORD
BOOKING_EMAIL_SMTP_HOST
BOOKING_EMAIL_SMTP_PORT
```

Do not ask users to share OTPs with support. If a user reports an OTP issue, ask them to retry sign-in or check their mailbox spam/quarantine.

## Development escape hatch

For local development only:

```env
AIFROGI_LOGIN_OTP_DISABLED=true
```

Do not set this to `true` in production.

