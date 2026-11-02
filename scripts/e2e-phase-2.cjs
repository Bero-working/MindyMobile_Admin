const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { connect, root } = require('./attendance-runtime.cjs');
function nodeScript(name) {
  const result = spawnSync(
    process.execPath,
    [path.join(root, 'scripts', name)],
    { cwd: root, stdio: 'inherit', env: process.env }
  );
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${name} failed; P2 E2E stopped (${result.status})`);
}
async function main() {
  nodeScript('verify-attendance-api.cjs');
  nodeScript('setup-attendance-dataset.cjs');
  nodeScript('verify-attendance-mutations.cjs');
  const file = path.join(root, '.maestro/phase-2-dataset.local.json');
  const dataset = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.ok(
    dataset.runId && dataset.apiVerifiedAt,
    'Fresh API-verified dataset required'
  );
  const accounts = JSON.parse(
    fs.readFileSync(path.join(root, '.maestro/accounts.local.json'), 'utf8')
  );
  const mentor = accounts[dataset.mentorProfile];
  const manager = {
    email: process.env.MAESTRO_MANAGER_EMAIL ?? accounts.manager?.email,
    password:
      process.env.MAESTRO_MANAGER_PASSWORD ?? accounts.manager?.password,
  };
  assert.ok(
    manager.email && manager.password,
    'Configure a local Manager account or MAESTRO_MANAGER_EMAIL/PASSWORD'
  );
  const env = {
    ...process.env,
    MAESTRO_MENTOR_EMAIL: mentor.email,
    MAESTRO_MENTOR_PASSWORD: mentor.password,
    MAESTRO_MANAGER_EMAIL: manager.email,
    MAESTRO_MANAGER_PASSWORD: manager.password,
  };
  const actor = await connect('MANAGER');
  const roster = await actor.source.read({
    kind: 'attendance',
    role: 'MANAGER',
    sessionId: dataset.sessions.apiLifecycle,
    pageSize: 100,
  });
  assert.equal(roster.kind, 'success');
  const student = dataset.students[0];
  const row = roster.data.rows.find(
    (r) => r.enrollmentId === student.enrollmentId
  );
  assert.ok(row, 'Fixture student must have an existing correction record');
  const recoveryDate = new Date(
    Date.parse(dataset.recoveryEvidence.actualStartedAt) + 7 * 3600000
  ).toISOString();
  Object.assign(env, {
    MAESTRO_CLASS_ID: dataset.classId,
    MAESTRO_CLASS_NAME: dataset.className,
    MAESTRO_MENTOR_SESSION_ID: dataset.sessions.nativeMentor,
    MAESTRO_STUDENT_ID: student.studentId,
    MAESTRO_CORRECTION_SESSION_ID: dataset.sessions.apiLifecycle,
    MAESTRO_CORRECTION_MARK: row.status === 'PRESENT' ? 'absent' : 'present',
    MAESTRO_FINALIZE_SESSION_ID: dataset.sessions.nativeFinalize,
    MAESTRO_RECOVERY_SESSION_ID: dataset.sessions.nativeRecovery,
    MAESTRO_ENROLLMENT_ID: student.enrollmentId,
    MAESTRO_RECOVERY_START: recoveryDate.slice(11, 16),
    MAESTRO_RECOVERY_DATE: `${recoveryDate.slice(8, 10)}/${recoveryDate.slice(5, 7)}/${recoveryDate.slice(0, 4)}`,
  });
  const report = path.join(
    root,
    'build-logs/phase-2-api',
    `maestro-${dataset.runId}`
  );
  dataset.nativeReport = report;
  fs.writeFileSync(file, JSON.stringify(dataset, null, 2));
  let result;
  try {
    result = spawnSync(
      process.platform === 'win32' ? 'maestro.bat' : 'maestro',
      [
        'test',
        '--test-output-dir',
        report,
        '.maestro/phase-002-attendance-and-notes/phase-2.yaml',
      ],
      { cwd: root, env, stdio: 'inherit', shell: process.platform === 'win32' }
    );
  } finally {
    // Maestro substitutes environment variables into text artifacts; redact credentials before retaining them.
    const secrets = [
      mentor.email,
      mentor.password,
      manager.email,
      manager.password,
    ];
    function redact(dir) {
      if (!fs.existsSync(dir)) return;
      for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const target = path.join(dir, item.name);
        if (item.isDirectory()) redact(target);
        else if (/\.(json|log|txt|yaml|html|xml)$/.test(item.name)) {
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
  assert.equal(result.status, 0, 'Native P2 Maestro flow must pass');
  const verifier = await connect('MANAGER');
  const fresh = await connect('MENTOR', false, dataset.mentorProfile);
  const note = await fresh.source.read({
    kind: 'note',
    role: 'MENTOR',
    sessionId: dataset.sessions.nativeMentor,
  });
  assert.equal(note.kind, 'success');
  assert.equal(note.data.note?.content, 'P2 native E2E note');
  for (const name of ['nativeMentor', 'nativeFinalize', 'nativeRecovery']) {
    const r = await verifier.source.read({
      kind: 'attendance',
      role: 'MANAGER',
      sessionId: dataset.sessions[name],
      pageSize: 100,
    });
    assert.equal(r.kind, 'success');
    assert.equal(
      r.data.session.status,
      'COMPLETED',
      `${name} completed on backend`
    );
  }
  const audit = await verifier.source.read({
    kind: 'audits',
    role: 'MANAGER',
    sessionId: dataset.sessions.nativeRecovery,
  });
  assert.equal(audit.kind, 'success');
  assert.ok(
    audit.data.audits.some((a) => a.action === 'RECOVER' && a.recoveryEvidence)
  );
  const correction = await verifier.source.read({
    kind: 'audits',
    role: 'MANAGER',
    sessionId: dataset.sessions.apiLifecycle,
  });
  assert.equal(correction.kind, 'success');
  assert.ok(
    correction.data.audits.some((a) => a.reason === 'P2 native E2E correction')
  );
  dataset.nativeVerifiedAt = new Date().toISOString();
  fs.writeFileSync(file, JSON.stringify(dataset, null, 2));
  process.stdout.write(
    'P2 E2E passed: fresh API setup, live mutations, seven slices/native tabs and backend postconditions.\n'
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
