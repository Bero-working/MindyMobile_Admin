const assert = require('node:assert/strict');
const { connect } = require('./material-runtime.cjs');
async function main() {
  const { client, source } = await connect('MANAGER', true),
    scope = { role: 'MANAGER' };
  const id = '11111111-1111-4111-8111-111111111111';
  const first = await source.list(scope, undefined, 'PENDING_REVIEW');
  assert.equal(first.total, 1);
  await client.post('/__control', { scenario: 'lost-after-commit' });
  await assert.rejects(
    source.command(scope, id, 'approve', 2),
    (e) => e.kind === 'uncertain'
  );
  assert.equal((await client.get('/__state')).data.commits, 1);
  const retry = await source.command(scope, id, 'approve', 2);
  assert.equal(retry.reviewStatus, 'APPROVED');
  assert.equal((await client.get('/__state')).data.commits, 1);
  await assert.rejects(
    source.command(scope, id, 'approve', 1),
    (e) => e.kind === 'conflict'
  );
  await client.post('/__control', { scenario: 'html' });
  await assert.rejects(source.detail(scope, id), (e) => e.kind === 'error');
  await client.post('/__control', { scenario: 'denied' });
  await assert.rejects(source.detail(scope, id), (e) => e.kind === 'denied');
  process.stdout.write(
    String(
      'P3 real adapter HTTP simulation passed: chosen queue, uncertain approval, one commit across replay, stale revision, HTML 503, denied.'
    ) + '\n'
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
