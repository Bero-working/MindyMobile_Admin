const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// Current stage is explicitly UI mock. Replace with API/dataset preparation only
// after the user approves the entire P4 UI; never claim this verifies backend.
const root = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(root, 'build-logs/phase-4-ui'), { recursive: true });
const now = Date.now() + 7 * 3600000;
const date = (offset) =>
  new Date(now + offset * 86400000).toISOString().slice(0, 10);
const result = spawnSync(
  process.env.MAESTRO_BINARY ||
    (process.platform === 'win32' ? 'maestro.bat' : 'maestro'),
  [
    ...(process.env.MAESTRO_DEVICE
      ? ['--device', process.env.MAESTRO_DEVICE]
      : []),
    'test',
    '-e',
    `P4_LEAVE_DATE=${date(5)}`,
    '-e',
    `P4_TARGET_DATE=${date(8)}`,
    '--test-output-dir',
    'build-logs/phase-4-ui/maestro',
    '.maestro/phase-004-leave-and-makeup/phase-4.yaml',
  ],
  {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
