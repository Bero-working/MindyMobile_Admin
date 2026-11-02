const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const axios = require('axios');
const { createOperationsService } = require('./operations-runtime.cjs');
async function main() {
  const baseURL = process.env.OPERATIONS_API_URL;
  assert.ok(
    baseURL?.startsWith('http://127.0.0.1:'),
    'Local simulation URL required'
  );
  const client = axios.create({ timeout: 2000, validateStatus: () => true });
  const source = createOperationsService({ baseURL, client });
  const id = '11111111-1111-4111-8111-111111111111';
  const control = async (scenario) =>
    (await client.post(`${baseURL}/__control`, { scenario })).data;
  await control('success');
  const context = await source.read({ kind: 'context', id });
  assert.equal(context.kind, 'success');
  const intent = {
    kind: 'assign',
    id,
    expectedVersion: context.data.session.version,
    key: randomUUID(),
    reason: 'Synthetic response-loss test',
    mentorId: null,
  };
  await control('lostSession');
  assert.equal((await source.write(intent)).kind, 'uncertain');
  await control('success');
  assert.equal((await source.write(intent)).kind, 'success');
  assert.equal((await control('success')).sessionCommits, 1);
  await control('conflict');
  const conflict = await source.write({ ...intent, key: randomUUID() });
  assert.equal(conflict.kind, 'error');
  assert.equal(conflict.code, 'SESSION_VERSION_CONFLICT');
  await control('lostCash');
  assert.equal(
    (await source.write({ kind: 'collect', id, receivedAmount: 6500000 })).kind,
    'uncertain'
  );
  await control('success');
  const paid = await source.read({ kind: 'order', id });
  assert.equal(paid.kind, 'success');
  assert.equal(paid.data.order.status, 'PAID');
  assert.equal(
    (await source.write({ kind: 'collect', id, receivedAmount: 6500000 })).kind,
    'success'
  );
  assert.equal((await control('success')).cashCommits, 1);
  await control('html');
  assert.equal(
    (await source.write({ ...intent, key: randomUUID() })).kind,
    'uncertain'
  );
  assert.equal((await source.read({ kind: 'order', id })).kind, 'error');
  await control('denied');
  assert.equal((await source.read({ kind: 'order', id })).kind, 'denied');
  process.stdout.write(
    'P5 adapter HTTP simulation PASS: session response lost after one commit and same-key replay; conflict; CASH lost response/read PAID/replay with one commit; HTML 503; denied.\n'
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
