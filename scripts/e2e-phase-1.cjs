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
      console.error(`Missing ${key}: configure the shell or ${accountsFile}`);
      process.exit(1);
    }
  }
}

process.stdout.write('P1: verifying API and refreshing the local dataset...\n');
const api = spawnSync(
  process.execPath,
  [path.join(root, 'scripts/verify-teaching-api.cjs')],
  { cwd: root, env, stdio: 'inherit' }
);
if (api.error) throw api.error;
if (api.status !== 0) process.exit(api.status ?? 1);

const dataset = JSON.parse(
  fs.readFileSync(
    path.join(root, '.maestro/phase-1-dataset.local.json'),
    'utf8'
  )
);
for (const role of ['mentor', 'manager']) {
  for (const field of ['classId', 'sessionId']) {
    const value = dataset[role]?.[field];
    if (typeof value !== 'string' || !value.trim()) {
      console.error(`P1 API dataset is missing ${role}.${field}`);
      process.exit(1);
    }
  }
  env[`MAESTRO_${role.toUpperCase()}_CLASS_ID`] = dataset[role].classId;
  env[`MAESTRO_${role.toUpperCase()}_SESSION_ID`] = dataset[role].sessionId;
}
env.MAESTRO_MENTOR_SUBSTITUTE_CLASS_ID = dataset.mentor.substituteClassId || '';
process.stdout.write(
  'P1: running native UI E2E against the verified dataset...\n'
);
const result = spawnSync(
  process.platform === 'win32' ? 'maestro.bat' : 'maestro',
  ['test', '.maestro/phase-001-teaching-workspace/phase-1.yaml'],
  { cwd: root, env, stdio: 'inherit', shell: process.platform === 'win32' }
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
