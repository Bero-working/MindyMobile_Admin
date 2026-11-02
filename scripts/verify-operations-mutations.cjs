const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { connect, root } = require('./operations-runtime.cjs');
async function main() {
  const file = path.join(root, '.maestro/phase-5-dataset.local.json');
  const dataset = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.ok(
    dataset.runId &&
      dataset.className.startsWith('P5 E2E ') &&
      Date.now() - Date.parse(dataset.createdAt) < 30 * 60000,
    'Fresh dedicated P5 fixture required'
  );
  const manager = await connect();
  const read = async (request) => {
    const result = await manager.source.read(request);
    assert.equal(
      result.kind,
      'success',
      `${request.kind}: ${result.code || result.kind}`
    );
    return result.data;
  };
  const write = async (intent) => {
    const result = await manager.source.write(intent);
    assert.equal(
      result.kind,
      'success',
      `${intent.kind}: ${result.code || result.kind}`
    );
    return result.data;
  };
  const before = await read({
    kind: 'context',
    id: dataset.sessions.apiAssign,
  });
  const candidates = await read({
    kind: 'candidates',
    id: before.session.id,
    search: dataset.substituteName,
  });
  assert.ok(candidates.candidates.some((m) => m.id === dataset.substituteId));
  const assign = {
    kind: 'assign',
    id: before.session.id,
    expectedVersion: candidates.sessionVersion,
    key: randomUUID(),
    reason: 'P5 E2E substitute',
    mentorId: dataset.substituteId,
  };
  const assigned = await write(assign);
  assert.equal(assigned.session.effectiveMentorId, dataset.substituteId);
  const replay = await write(assign);
  assert.equal(replay.session.version, assigned.session.version);
  const stale = await manager.source.write({
    ...assign,
    key: randomUUID(),
    mentorId: null,
  });
  assert.equal(stale.kind, 'error');
  assert.equal(stale.code, 'SESSION_VERSION_CONFLICT');
  const cleared = await write({
    ...assign,
    expectedVersion: assigned.session.version,
    key: randomUUID(),
    mentorId: null,
  });
  assert.equal(cleared.session.assignment, 'PRIMARY');
  const schedule = await read({
    kind: 'context',
    id: dataset.sessions.apiReschedule,
  });
  const rescheduled = await write({
    kind: 'reschedule',
    id: schedule.session.id,
    expectedVersion: schedule.session.version,
    key: randomUUID(),
    reason: 'P5 E2E reschedule',
    startsAt: schedule.session.startsAt
      .replace('11:30:00', '12:00:00')
      .replace('18:30:00', '19:00:00'),
    endsAt: schedule.session.endsAt
      .replace('13:00:00', '13:30:00')
      .replace('20:00:00', '20:30:00'),
  });
  assert.equal(rescheduled.session.title, schedule.session.title);
  assert.equal(rescheduled.session.status, 'SCHEDULED');
  const original = await read({
    kind: 'context',
    id: dataset.sessions.apiReplacement,
  });
  const cancelled = await write({
    kind: 'cancel',
    id: original.session.id,
    expectedVersion: original.session.version,
    key: randomUUID(),
    reason: 'P5 E2E cancellation',
  });
  assert.equal(cancelled.session.status, 'CANCELLED');
  const replacement = await write({
    kind: 'replace',
    id: cancelled.session.id,
    expectedVersion: cancelled.session.version,
    key: randomUUID(),
    reason: 'P5 E2E replacement',
    classUnitId: original.session.unitId,
    title: 'P5 apiReplacement new',
    startsAt: `${dataset.replacementDate}T18:30:00+07:00`,
    endsAt: `${dataset.replacementDate}T20:00:00+07:00`,
  });
  assert.equal(replacement.session.makeupForSessionId, original.session.id);
  assert.equal(replacement.session.actualStart, null);
  assert.equal(replacement.session.actualEnd, null);
  const old = await read({ kind: 'context', id: original.session.id });
  assert.equal(old.session.status, 'CANCELLED');
  const freshOrder = await read({
    kind: 'order',
    id: dataset.orders.ApiStudent.id,
  });
  const payment = {
    kind: 'collect',
    id: freshOrder.order.id,
    receivedAmount: freshOrder.order.totalAmount,
  };
  assert.equal(
    (
      await manager.source.write({
        ...payment,
        receivedAmount: payment.receivedAmount - 1,
      })
    ).kind,
    'error'
  );
  await write(payment);
  await write(payment);
  const paid = await read({ kind: 'order', id: payment.id });
  assert.equal(paid.order.status, 'PAID');
  assert.equal(paid.order.confirmedBy.id, manager.userId);
  const roster = await manager.client.get(
    `/manager/classes/${dataset.classId}/students`,
    { params: { page: 1, pageSize: 100 } }
  );
  assert.equal(roster.status, 200);
  assert.ok(roster.data.items.some((s) => s.orderStatus === 'PAID'));
  dataset.apiVerifiedAt = new Date().toISOString();
  dataset.apiReplacementId = replacement.session.id;
  fs.writeFileSync(file, JSON.stringify(dataset, null, 2));
  process.stdout.write(
    'P5 live mutations PASS: assign/clear/replay/stale version, reschedule, cancel/replacement chain, exact CASH amount/replay/collector and paid roster. Dedicated test fixtures only.\n'
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
