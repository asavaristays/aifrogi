# AiFrogi Monitoring

## Signals

- `/api/health/live`: process is serving HTTP.
- `/api/health/ready`: database, production session secret, and canonical application URL are ready.
- PM2 process status and restart count.
- Nginx 5xx rate and certificate expiry.
- PostgreSQL connections, storage, and backup freshness.
- WhatsApp webhook age, failed message events, dead automation jobs, open incidents, and overdue invoices.

## Installation

Run the stateful monitor every two minutes from a host outside the application VPS when possible:

```cron
*/2 * * * * AIFROGI_ALERT_WEBHOOK_URL='https://...' /var/www/lead-os-ai/ops/monitor-health.sh >> /var/log/aifrogi-monitor.log 2>&1
```

The monitor alerts once when readiness changes to down and once when it recovers. When no webhook is configured it still exits non-zero for cron, systemd, or an external uptime service.

## Alert Ownership

Every production alert must name one accountable operator and one backup. A failing readiness check is operational evidence, not a customer-facing diagnosis; use the incident runbook before communicating root cause.
