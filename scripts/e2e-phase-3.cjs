const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { connect, root } = require('./material-runtime.cjs');
async function main() {
  const setup = spawnSync(
    process.execPath,
    ['scripts/verify-material-api.cjs'],
    { cwd: root, env: process.env, stdio: 'inherit' }
  );
  if (setup.error) throw setup.error;
  assert.equal(
    setup.status,
    0,
    'Fresh P3 API/storage dataset must pass before native'
  );
  const file = path.join(root, '.maestro/phase-3-dataset.local.json'),
    dataset = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.ok(dataset.runId && dataset.coverage.storage);
  const accounts = JSON.parse(
    fs.readFileSync(path.join(root, '.maestro/accounts.local.json'), 'utf8')
  );
  const mentor = accounts[dataset.mentorProfile],
    manager = accounts.manager;
  assert.ok(
    mentor?.password && manager?.password,
    'Local native test accounts required'
  );
  const report = path.join(
    root,
    'build-logs/phase-3-api',
    `maestro-${dataset.runId}`
  );
  const title = `P3 Native Create ${dataset.runId.slice(0, 8)}`;
  const environment = {
    ...process.env,
    MAESTRO_MENTOR_EMAIL: mentor.email,
    MAESTRO_MENTOR_PASSWORD: mentor.password,
    MAESTRO_MANAGER_EMAIL: manager.email,
    MAESTRO_MANAGER_PASSWORD: manager.password,
    MAESTRO_CLASS_ID: dataset.classId,
    MAESTRO_NEW_TITLE: title,
    MAESTRO_REJECT_ID: dataset.rejectId,
  };
  let result;
  try {
    result = spawnSync(
      process.env.MAESTRO_BINARY ||
        (process.platform === 'win32' ? 'maestro.bat' : 'maestro'),
      [
        ...(process.env.MAESTRO_DEVICE
          ? ['--device', process.env.MAESTRO_DEVICE]
          : []),
        'test',
        '--test-output-dir',
        report,
        '.maestro/phase-003-material-review/phase-3.yaml',
      ],
      {
        cwd: root,
        env: environment,
        stdio: 'inherit',
        shell: process.platform === 'win32',
      }
    );
  } finally {
    const secrets = [
      mentor.email,
      mentor.password,
      manager.email,
      manager.password,
    ];
    function redact(dir) {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const target = path.join(dir, entry.name);
        if (entry.isDirectory()) redact(target);
        else if (/\.(json|log|txt|yaml|html|xml)$/.test(entry.name)) {
          let text = fs.readFileSync(target, 'utf8');
          for (const secret of secrets)
            text = text.split(secret).join('[REDACTED]');
          fs.writeFileSync(target, text);
        }
      }
    }
    redact(report);
  }
  if (result.error) throw result.error;
  assert.equal(result.status, 0, 'P3 native Maestro must pass');
  const fresh = await connect('MENTOR', false, dataset.mentorProfile),
    mg = await connect('MANAGER');
  const page = await fresh.source.list(
    { role: 'MENTOR', classId: dataset.classId },
    dataset.unitId,
    'APPROVED',
    1,
    100
  );
  assert.ok(
    page.items.some((m) => m.title === title && m.publishedAt),
    'Native-created article was approved and published on server'
  );
  assert.equal(
    (await mg.source.detail({ role: 'MANAGER' }, dataset.rejectId))
      .rejectionReason,
    'P3 native rejection reason'
  );
  dataset.nativeVerifiedAt = new Date().toISOString();
  dataset.nativeReport = report;
  fs.writeFileSync(file, JSON.stringify(dataset, null, 2));
  process.stdout.write(
    String(
      'P3 native ARTICLE authoring/preview/submit/approve/reject and backend postconditions passed. Native binary picker/video/PDF branches need separate device coverage before phase acceptance.'
    ) + '\n'
  );
  // Do not misreport partial native coverage as complete phase acceptance.
  if (!dataset.nativeBinaryVerifiedAt)
    throw new Error(
      'P3 E2E incomplete: native binary upload, PDF/image/video, expiration and storage cookie observation remain unverified.'
    );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
