import fs from 'node:fs';
import cp from 'node:child_process';
import dotenv from 'dotenv';

const appRoot = '/var/www/lead-os-ai';
const allowedScripts = new Set([
  'scripts/review-webtechnosys-readiness.ts',
  'scripts/reconcile-webtechnosys-launch-gaps.ts',
  'scripts/audit-pilot-readiness.ts',
]);
const targetScript = process.argv[2] || 'scripts/review-webtechnosys-readiness.ts';
if (!allowedScripts.has(targetScript)) throw new Error('Review runner target is not allowed');
const processList = JSON.parse(cp.execFileSync('pm2', ['jlist'], { encoding: 'utf8' }));
const app = processList.find((entry) => entry.name === 'lead-os-ai');
if (!app?.pid) throw new Error('AiFrogi production process is unavailable');

const fileEnvironment = fs.existsSync(`${appRoot}/.env.local`)
  ? dotenv.parse(fs.readFileSync(`${appRoot}/.env.local`))
  : {};
const processEnvironment = Object.fromEntries(
  fs.readFileSync(`/proc/${app.pid}/environ`, 'utf8')
    .split('\0')
    .filter(Boolean)
    .map((entry) => {
      const split = entry.indexOf('=');
      return [entry.slice(0, split), entry.slice(split + 1)];
    }),
);

cp.execFileSync(
  process.execPath,
  ['--import', 'tsx', targetScript, ...process.argv.slice(3)],
  {
    cwd: appRoot,
    env: { ...process.env, ...fileEnvironment, ...processEnvironment },
    stdio: ['ignore', 'inherit', 'inherit'],
    timeout: 60_000,
  },
);
