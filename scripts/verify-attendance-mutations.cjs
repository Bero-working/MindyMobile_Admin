const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { connect, root } = require('./attendance-runtime.cjs');
async function main() {
  const file = path.join(root, '.maestro/phase-2-dataset.local.json');
  const dataset = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.ok(
    dataset.runId && dataset.className.startsWith('P2 E2E '),
    'Fresh dedicated E2E dataset required'
  );
  assert.ok(
    Date.now() - Date.parse(dataset.createdAt) < 30 * 60000,
    'Fixture expired; run setup again'
  );
  const mentor = await connect('MENTOR', false, dataset.mentorProfile);
  const manager = await connect('MANAGER');
  const read = async (actor, kind, sessionId, extra = {}) => {
    const r = await actor.source.read({
      kind,
      sessionId,
      role: actor === mentor ? 'MENTOR' : 'MANAGER',
      ...extra,
    });
    assert.equal(r.kind, 'success', `${kind} ${r.code || ''}`);
    return r.data;
  };
  const write = async (actor, sessionId, kind, extra = {}) => {
    const context = await read(actor, 'context', sessionId);
    const value = {
      kind,
      sessionId,
      role: actor === mentor ? 'MENTOR' : 'MANAGER',
      key: randomUUID(),
      expectedVersion: context.session.version,
      ...extra,
    };
    const r = await actor.source.write(value);
    assert.equal(r.kind, 'success', `${kind}: ${r.code || r.kind}`);
    process.stdout.write(`P2 live ${value.role} ${kind}: success\n`);
    return { result: r, intent: value };
  };
  const id = dataset.sessions.apiLifecycle;
  const candidates = await read(mentor, 'candidates', id, { pageSize: 1 });
  assert.equal(candidates.total, 2);
  const started = await write(mentor, id, 'start');
  const replay = await mentor.source.write(started.intent);
  assert.equal(replay.kind, 'success');
  assert.equal(
    replay.data.session.version,
    started.result.data.session.version
  );
  const conflict = await mentor.source.write({
    ...started.intent,
    key: randomUUID(),
  });
  assert.equal(conflict.code, 'SESSION_VERSION_CONFLICT');
  const first = await read(mentor, 'attendance', id, { pageSize: 1 });
  const second = await read(mentor, 'attendance', id, { page: 2, pageSize: 1 });
  assert.equal(first.total, 2);
  assert.notEqual(first.rows[0].id, second.rows[0].id);
  await write(mentor, id, 'save', {
    records: [{ enrollmentId: first.rows[0].enrollmentId, status: 'PRESENT' }],
    guestRecords: [],
  });
  const finalized = await write(mentor, id, 'finalize');
  assert.equal(finalized.result.data.totals.absent, 1);
  assert.equal(finalized.result.data.totals.present, 1);
  assert.equal(finalized.result.data.totals.unmarked, 0);
  await write(mentor, id, 'bulk', { checked: false });
  await write(mentor, id, 'bulk', { checked: true });
  const currentNote = await read(mentor, 'note', id);
  const note = {
    kind: 'note',
    sessionId: id,
    role: 'MENTOR',
    key: randomUUID(),
    expectedVersion: currentNote.noteVersion,
    content: 'P2 API E2E internal note',
    nextSteps: 'Verified independent note version',
  };
  const saved = await mentor.source.write(note);
  assert.equal(saved.kind, 'success', `note ${saved.code || ''}`);
  assert.equal(saved.data.noteVersion, currentNote.noteVersion + 1);
  process.stdout.write('P2 live MENTOR note: success\n');
  await write(manager, id, 'save', {
    reason: 'P2 E2E correction of fixture register',
    records: [{ enrollmentId: first.rows[0].enrollmentId, status: 'ABSENT' }],
  });
  const audits = await read(manager, 'audits', id, { pageSize: 100 });
  assert.ok(audits.audits.some((a) => a.action === 'CORRECT'));
  const managerId = dataset.sessions.apiFinalize;
  await write(mentor, managerId, 'start');
  await write(mentor, managerId, 'sync');
  const m = await read(manager, 'context', managerId);
  const now = m.session.asOf;
  assert.ok(Date.parse(now) > Date.parse(m.session.actualStartedAt));
  await write(manager, managerId, 'finalize', {
    reason: 'P2 E2E manager finalize',
    actualEndedAt: now,
  });
  const recoveryId = dataset.sessions.apiRecovery;
  const recoveryBody = {
    reason: 'P2 E2E recovery from explicit synthetic register',
    evidenceNote: dataset.recoveryEvidence.description,
    actualStartedAt: dataset.createdAt,
    actualEndedAt: (await read(manager, 'context', recoveryId)).session.asOf,
    recoveryRecords: dataset.enrollments.map((e) => ({
      enrollmentId: e.id,
      status: 'PRESENT',
      admissionBasis: 'PAID_BEFORE_START',
    })),
  };
  await write(manager, recoveryId, 'recover', recoveryBody);
  const recovered = await read(manager, 'context', recoveryId);
  assert.equal(recovered.session.status, 'COMPLETED');
  const exists = await manager.source.write({
    kind: 'recover',
    sessionId: recoveryId,
    role: 'MANAGER',
    key: randomUUID(),
    expectedVersion: recovered.session.version,
    ...recoveryBody,
  });
  assert.equal(exists.code, 'ATTENDANCE_RECOVERY_RECORD_EXISTS');
  const recoveryAudit = await read(manager, 'audits', recoveryId);
  assert.ok(
    recoveryAudit.audits.some(
      (a) => a.action === 'RECOVER' && a.recoveryEvidence
    )
  );
  await write(mentor, dataset.sessions.nativeFinalize, 'start');
  const nativeRoster = await read(manager, 'recoveryStudents', undefined, {
    classId: dataset.classId,
    pageSize: 100,
  });
  assert.equal(nativeRoster.students.length, 2);
  dataset.apiVerifiedAt = new Date().toISOString();
  dataset.coverage = {
    lifecycle: true,
    note: true,
    correction: true,
    recovery: true,
    audits: true,
    idempotency: true,
    pagination: true,
    managerFinalize: true,
  };
  fs.writeFileSync(file, JSON.stringify(dataset, null, 2));
  process.stdout.write(
    'P2 dedicated live API mutation checks passed; native fixtures remain ready.\n'
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
