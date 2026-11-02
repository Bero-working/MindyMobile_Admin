const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const axios = require('axios');
const { createLeaveService } = require('./leave-runtime.cjs');
async function main() {
  const baseURL = process.env.LEAVE_API_URL;
  assert.ok(
    baseURL?.startsWith('http://127.0.0.1:'),
    'Local simulation required'
  );
  const client = axios.create({ timeout: 1500, validateStatus: () => true });
  const source = createLeaveService({ baseURL, client });
  const id = '11111111-1111-4111-8111-111111111111';
  const control = async (scenario) =>
    (await client.post(`${baseURL}/__control`, { scenario })).data;
  const read = async (r) => {
    const result = await source.read(r);
    assert.equal(result.kind, 'success', JSON.stringify(result));
    return result.data;
  };
  await control('success');
  const preview = await read({
    kind: 'preview',
    role: 'MENTOR',
    fromDate: '2026-11-09',
    toDate: '2026-11-09',
    period: 'FULL_DAY',
  });
  assert.equal(preview.preview.sources.length, 1);
  const slots = await read({
    kind: 'slots',
    role: 'MENTOR',
    id,
    targetDate: '2026-11-12',
    targetPeriod: 'EVENING',
  });
  const create = {
    kind: 'create',
    role: 'MENTOR',
    key: randomUUID(),
    body: {
      fromDate: '2026-11-09',
      toDate: '2026-11-09',
      period: 'FULL_DAY',
      reason: 'Synthetic create',
      sourceVersions: preview.preview.sourceVersions,
      sessionMappings: [
        {
          sourceSessionId: id,
          targetDate: '2026-11-12',
          targetPeriod: 'EVENING',
          ...slots.slots[0],
        },
      ],
    },
  };
  await control('lost');
  assert.equal((await source.write(create)).kind, 'uncertain');
  await control('success');
  assert.equal((await source.write(create)).kind, 'success');
  assert.equal((await control('success')).commits, 1);
  const changed = await source.write({
    ...create,
    body: { ...create.body, reason: 'Changed' },
  });
  assert.equal(changed.code, 'IDEMPOTENCY_KEY_REUSED');
  const detail = await read({ kind: 'detail', role: 'MANAGER', id });
  assert.equal(detail.request.studentConflictCount, 0);
  assert.equal(detail.request.sourcesCurrent, true);
  const approve = {
    kind: 'approve',
    role: 'MANAGER',
    id,
    key: randomUUID(),
    body: {
      expectedVersion: detail.request.version,
      reason: 'Synthetic approve',
      acknowledgeStudentConflicts: false,
    },
  };
  assert.equal((await source.write(approve)).kind, 'success');
  const conflicts = await read({ kind: 'conflicts', role: 'MANAGER' });
  const candidates = await read({ kind: 'candidates', role: 'MANAGER', id });
  const place = {
    kind: 'place',
    role: 'MANAGER',
    id,
    key: randomUUID(),
    body: {
      expectedVersion: conflicts.conflicts[0].version,
      reason: 'Synthetic place',
      targetSessionId: id,
      expectedTargetVersion: candidates.candidates[0].session.version,
      contentMatchConfirmed: true,
    },
  };
  await control('lost');
  assert.equal((await source.write(place)).kind, 'uncertain');
  await control('success');
  assert.equal((await source.write(place)).kind, 'success');
  assert.equal((await control('success')).commits, 3);
  const assigned = await read({ kind: 'conflicts', role: 'MANAGER' });
  assert.equal(assigned.conflicts[0].placementVersion, 1);
  const cancel = {
    kind: 'cancel',
    role: 'MANAGER',
    id,
    key: randomUUID(),
    body: { expectedVersion: 1, reason: 'Synthetic cancel' },
  };
  assert.equal((await source.write(cancel)).kind, 'success');
  await control('conflict');
  assert.equal(
    (await source.write({ ...approve, key: randomUUID() })).code,
    'LEAVE_VERSION_CONFLICT'
  );
  await control('html');
  assert.equal(
    (await source.write({ ...approve, key: randomUUID() })).kind,
    'uncertain'
  );
  assert.equal(
    (
      await source.read({
        kind: 'preview',
        role: 'MENTOR',
        fromDate: '2026-11-09',
        toDate: '2026-11-09',
        period: 'FULL_DAY',
      })
    ).kind,
    'error'
  );
  await control('denied');
  assert.equal(
    (await source.read({ kind: 'conflicts', role: 'MANAGER' })).kind,
    'denied'
  );
  process.stdout.write(
    'P4 actual adapter HTTP simulation PASS: preview/slots/create/approve/conflicts/candidates/place/cancel; lost responses and one-commit replay; key reuse rejection; conflict/HTML 503/denied.'
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
