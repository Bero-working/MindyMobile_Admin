const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { connect, root } = require('./operations-runtime.cjs');
function run(name) {
  const result = spawnSync(
    process.execPath,
    [path.join(root, 'scripts', name)],
    { cwd: root, stdio: 'inherit', env: process.env }
  );
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${name} must pass`);
}
async function main() {
  run('verify-operations-api.cjs');
  run('setup-operations-dataset.cjs');
  run('verify-operations-mutations.cjs');
  const dataset = JSON.parse(
    fs.readFileSync(
      path.join(root, '.maestro/phase-5-dataset.local.json'),
      'utf8'
    )
  );
  assert.ok(
    dataset.apiVerifiedAt &&
      Date.now() - Date.parse(dataset.createdAt) < 30 * 60000
  );
  const accounts = JSON.parse(
    fs.readFileSync(path.join(root, '.maestro/accounts.local.json'), 'utf8')
  );
  const manager = {
    email: process.env.MAESTRO_MANAGER_EMAIL || accounts.manager?.email,
    password:
      process.env.MAESTRO_MANAGER_PASSWORD || accounts.manager?.password,
  };
  assert.ok(manager.email && manager.password);
  const order = dataset.orders.NativeStudent;
  const env = {
    ...process.env,
    MAESTRO_MANAGER_EMAIL: manager.email,
    MAESTRO_MANAGER_PASSWORD: manager.password,
    P5_ORDER_ID: order.id,
    P5_ORDER_CODE: order.orderCode,
    P5_ORDER_AMOUNT: String(order.totalAmount),
    P5_CLASS_ID: dataset.classId,
    P5_CLASS_NAME: dataset.className,
    P5_ASSIGN_ID: dataset.sessions.nativeAssign,
    P5_RESCHEDULE_ID: dataset.sessions.nativeReschedule,
    P5_REPLACEMENT_ID: dataset.sessions.nativeReplacement,
    P5_RESCHEDULE_DATE: dataset.nativeRescheduleDate,
    P5_REPLACEMENT_DATE: dataset.nativeReplacementDate,
    P5_SUBSTITUTE_ID: dataset.substituteId,
    P5_SUBSTITUTE_NAME: dataset.substituteName,
  };
  const report = path.join(root, 'build-logs/phase-5/maestro');
  fs.mkdirSync(report, { recursive: true });
  let result;
  try {
    result = spawnSync(
      process.env.MAESTRO_BINARY || 'maestro',
      [
        ...(process.env.MAESTRO_DEVICE
          ? ['--device', process.env.MAESTRO_DEVICE]
          : []),
        'test',
        '--test-output-dir',
        report,
        '.maestro/phase-005-manager-operations-cash/phase-5.yaml',
      ],
      { cwd: root, env, stdio: 'inherit', shell: process.platform === 'win32' }
    );
  } finally {
    const redact = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, item.name);
        if (item.isDirectory()) redact(file);
        else if (/\.(json|log|txt|yaml|xml|html)$/.test(file)) {
          let text = fs.readFileSync(file, 'utf8');
          for (const secret of [manager.email, manager.password])
            text = text.split(secret).join('[REDACTED]');
          fs.writeFileSync(file, text);
        }
      }
    };
    redact(report);
  }
  if (result.error) throw result.error;
  assert.equal(result.status, 0, 'P5 Maestro native flow must pass');
  const actor = await connect();
  const read = async (request) => {
    const r = await actor.source.read(request);
    assert.equal(r.kind, 'success');
    return r.data;
  };
  const paid = await read({ kind: 'order', id: order.id });
  assert.equal(paid.order.status, 'PAID');
  const assigned = await read({
    kind: 'context',
    id: dataset.sessions.nativeAssign,
  });
  assert.equal(assigned.session.effectiveMentorId, dataset.substituteId);
  const moved = await read({
    kind: 'context',
    id: dataset.sessions.nativeReschedule,
  });
  assert.equal(
    new Date(Date.parse(moved.session.startsAt) + 7 * 3600000)
      .toISOString()
      .slice(0, 10),
    dataset.nativeRescheduleDate
  );
  const original = await read({
    kind: 'context',
    id: dataset.sessions.nativeReplacement,
  });
  assert.equal(original.session.status, 'CANCELLED');
  fs.writeFileSync(
    path.join(root, 'build-logs/phase-5/e2e-result.json'),
    JSON.stringify(
      {
        verifiedAt: new Date().toISOString(),
        runId: dataset.runId,
        native: true,
        postconditions: true,
      },
      null,
      2
    )
  );
  process.stdout.write('P5 native E2E and live backend postconditions PASS.\n');
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
