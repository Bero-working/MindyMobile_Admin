const { spawnSync } = require('node:child_process');
const path = require('node:path');

const task = process.argv[2];
if (!['assembleRelease', 'bundleRelease'].includes(task)) {
  throw new Error('Unsupported Android build task.');
}
const result = spawnSync(
  process.platform === 'win32' ? 'gradlew.bat' : './gradlew',
  [task],
  {
    cwd: path.resolve(__dirname, '../android'),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
