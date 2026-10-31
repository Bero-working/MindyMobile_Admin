const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const accounts = JSON.parse(
  fs.readFileSync(path.join(root, '.maestro/accounts.local.json'), 'utf8')
);
const dataset = JSON.parse(
  fs.readFileSync(
    path.join(root, '.maestro/phase-1-dataset.local.json'),
    'utf8'
  )
);
const env = { ...process.env };
for (const role of ['mentor', 'manager']) {
  for (const field of ['email', 'password']) {
    const key = `MAESTRO_${role.toUpperCase()}_${field.toUpperCase()}`;
    env[key] = env[key] || accounts[role]?.[field];
    if (!env[key]) throw new Error(`Missing ${key}`);
  }
  env[`MAESTRO_${role.toUpperCase()}_CLASS_ID`] = dataset[role]?.classId;
  env[`MAESTRO_${role.toUpperCase()}_SESSION_ID`] = dataset[role]?.sessionId;
  if (
    !env[`MAESTRO_${role.toUpperCase()}_CLASS_ID`] ||
    !env[`MAESTRO_${role.toUpperCase()}_SESSION_ID`]
  )
    throw new Error(
      `Run npm run test:api:phase-1 with a populated ${role} dataset first`
    );
}
env.MAESTRO_MENTOR_SUBSTITUTE_CLASS_ID = dataset.mentor.substituteClassId || '';
const result = spawnSync(
  process.platform === 'win32' ? 'maestro.bat' : 'maestro',
  ['test', '.maestro/phase-001-teaching-workspace/phase-1.yaml'],
  { cwd: root, env, stdio: 'inherit', shell: process.platform === 'win32' }
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
