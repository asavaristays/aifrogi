# Runbook: Enable Meta Webhook Signature Enforcement

## Goal

Configure `META_APP_SECRET` on the AiFrogi VPS so real Meta-signed WhatsApp webhooks are accepted and forged or unsigned webhook traffic is rejected.

AiFrogi is intentionally fail-closed in production:

- Missing Meta app secret: webhook returns `503`.
- Secret configured but signature missing/wrong: webhook returns `403`.
- Secret configured and Meta signature valid: webhook returns `200`.

## Step 0 — Confirm the deployed code path

On the VPS:

```bash
cd /var/www/lead-os-ai
grep -rn "SIGNATURE_REQUIRED\|META_APP_SECRET\|FACEBOOK_APP_SECRET" \
  --include="*.ts" --include="*.js" \
  --exclude-dir=".next" --exclude-dir="node_modules" .
```

Expected: code reads `META_APP_SECRET` first, then `FACEBOOK_APP_SECRET` as fallback. Use only `META_APP_SECRET` for production to avoid confusing mixed-secret behavior.

## Step 1 — Get the correct Meta app secret

In Meta App Dashboard:

```text
App settings → Basic → App Secret → Show
```

Use the app secret from the same Meta app that owns the WhatsApp webhook subscription. If there are separate dev/live Meta apps, use the live app that sends production webhooks.

Do not paste the secret into chat, tickets, screenshots, logs, or shell commands.

## Step 2 — Store it safely on the VPS

Edit the untracked env file directly on the server:

```bash
cd /var/www/lead-os-ai
nano .env.local
```

Add:

```env
META_APP_SECRET=<paste-secret-here>
META_WEBHOOK_SIGNATURE_REQUIRED=true
```

Do not set both `META_APP_SECRET` and `FACEBOOK_APP_SECRET`.

## Step 3 — Lock down the env file

```bash
chmod 600 .env.local
```

If `/var/www/lead-os-ai` is not a git checkout, git ignore checks may not work there. That is normal because deployment may use `git archive`.

Run these checks from the local repo instead:

```bash
git check-ignore .env.local
git ls-files --error-unmatch .env.local
```

Expected:

- `git check-ignore .env.local` prints `.env.local`.
- `git ls-files --error-unmatch .env.local` fails / prints nothing.

If the secret was ever committed, rotate it immediately in Meta App Dashboard.

## Step 4 — Restart PM2 and persist

```bash
pm2 restart lead-os-ai --update-env
pm2 save
```

`pm2 env <id>` may not show `META_APP_SECRET` when Next.js loads it from `.env.local`. That is not the ground truth. Use the health endpoint below.

## Step 5 — Verify readiness

```bash
curl -sS -w "\n%{http_code}\n" https://aifrogi.com/api/health/ready
```

Expected:

```json
"metaWebhookSignature": "ok"
```

Also expected:

```json
"database": "ok"
"sessionSecret": "ok"
"publicUrl": "ok"
"legacyInboundToken": "ok"
```

If `metaWebhookSignature` still shows `not_enforced`, the app is not seeing the secret. Re-check file path, variable name, restart command, and process environment.

## Step 6 — Verify unsigned webhook rejection changed from 503 to 403

After the secret is configured, an unsigned Meta webhook must no longer return `503`. It should return `403` because the app now sees the secret and rejects the missing signature.

```bash
curl -i -sS -X POST https://aifrogi.com/api/integrations/whatsapp/webhook \
  -H 'content-type: application/json' \
  --data '{"object":"whatsapp_business_account","entry":[]}'
```

Expected:

```text
HTTP/... 403
Missing or invalid Meta webhook signature.
```

## Step 7 — Run the repeatable verifier

From the local repo or VPS repo copy:

```bash
npm run verify:meta-webhook
```

Expected after the secret is live:

```text
metaWebhookSignature: ok
unsigned webhook rejection: 403
```

## Step 8 — Live Meta test event

The final proof is a real signed event from Meta.

1. Trigger a test event from Meta Webhooks dashboard, or send a real inbound WhatsApp message.
2. Confirm the webhook returns `200`.
3. Confirm the inbound message appears in the correct AiFrogi workspace.
4. Confirm logs do not print the app secret or webhook signature.

## Done criteria

- [ ] `/api/health/ready` shows `"metaWebhookSignature": "ok"`.
- [ ] Unsigned JSON webhook returns `403`, not `503`.
- [ ] Real Meta-signed webhook returns `200`.
- [ ] `.env.local` is `chmod 600`.
- [ ] The secret is not tracked by git.
- [ ] `pm2 save` has been run.

## If the secret is exposed

Treat any exposure as compromise: terminal history, logs, screenshots, chat, tickets, or git. Rotate the app secret in Meta App Dashboard and repeat this runbook from Step 1.

