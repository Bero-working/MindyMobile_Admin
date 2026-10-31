const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const accountsFile = path.join(root, '.maestro/accounts.local.json');
const accounts = fs.existsSync(accountsFile)
  ? JSON.parse(fs.readFileSync(accountsFile, 'utf8'))
  : {};
const env = { ...process.env };
for (const role of ['mentor', 'manager']) {
  for (const field of ['email', 'password']) {
    const key = `MAESTRO_${role.toUpperCase()}_${field.toUpperCase()}`;
    env[key] = env[key] ?? accounts[role]?.[field];
    if (typeof env[key] !== 'string' || !env[key].trim()) {
      console.error(`Missing ${key}: set it in the shell or ${accountsFile}`);
      process.exit(1);
    }
  }
}

const result = spawnSync(
  process.platform === 'win32' ? 'maestro.bat' : 'maestro',
  ['test', '.maestro/phase-000-foundation-auth/phase-0.yaml'],
  { cwd: root, env, stdio: 'inherit', shell: process.platform === 'win32' }
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
