const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { connect } = require('./attendance-runtime.cjs');
async function main() {
  const { client, source } = await connect('MENTOR', true);
  const id = '11111111-1111-4111-8111-111111111111';
  const guest = '22222222-2222-4222-8222-222222222222';
  const query = {
    kind: 'attendance',
    role: 'MENTOR',
    sessionId: id,
    pageSize: 1,
  };
  const first = await source.read(query);
  assert.equal(first.kind, 'success');
  assert.equal(first.data.total, 2);
  const second = await source.read({ ...query, page: 2 });
  assert.equal(second.kind, 'success');
  assert.equal(second.data.rows[0].entryType, 'MAKEUP');
  const value = {
    kind: 'save',
    role: 'MENTOR',
    key: randomUUID(),
    sessionId: id,
    expectedVersion: first.data.session.version,
    records: [{ enrollmentId: id, status: 'PRESENT' }],
    guestRecords: [{ makeupPlacementId: guest, status: 'ABSENT' }],
  };
  await client.post('/__control', { scenario: 'lost-after-commit' });
  assert.equal((await source.write(value)).kind, 'uncertain');
  const retried = await source.write(value);
  assert.equal(retried.kind, 'success');
  assert.equal(retried.data.totals.present, 1);
  assert.equal(retried.data.totals.absent, 1);
  const state = await client.get('/__state');
  assert.equal(state.data.commits, 1);
  const conflict = await source.write({ ...value, key: randomUUID() });
  assert.equal(conflict.code, 'SESSION_VERSION_CONFLICT');
  await client.post('/__control', { scenario: 'html' });
  assert.equal((await source.read(query)).kind, 'error');
  assert.equal(
    (await source.write({ ...value, key: randomUUID(), expectedVersion: 2 }))
      .kind,
    'uncertain'
  );
  await client.post('/__control', { scenario: 'denied' });
  assert.equal((await source.read(query)).kind, 'denied');
  process.stdout.write(
    'P2 adapter HTTP simulation passed: regular/guest pagination; lost response after one commit; same-key replay; conflict; HTML 503; denied.\n'
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
