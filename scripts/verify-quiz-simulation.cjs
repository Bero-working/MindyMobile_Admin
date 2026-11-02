const assert = require('node:assert/strict');
const { connect } = require('./quiz-runtime.cjs');
async function main() {
  const { source, client } = await connect('MENTOR', true);
  const classId = '11111111-1111-4111-8111-111111111111',
    sessionId = '22222222-2222-4222-8222-222222222222';
  const metadata = {
    title: 'Synthetic quiz',
    description: '',
    purpose: 'TEST',
    maxScore: '10',
    dueAt: '',
    timeLimit: '',
  };
  let q = await source.command({ kind: 'create', sessionId, metadata });
  q = await source.command(
    {
      kind: 'metadata',
      id: q.id,
      revision: q.revision,
      metadata: { ...metadata, description: 'Edited' },
    },
    q
  );
  q = await source.command({
    kind: 'questions',
    id: q.id,
    revision: q.revision,
    questions: [
      {
        key: 'local-1',
        prompt: 'Q?',
        options: ['A', 'B', 'C', 'D'].map((label) => ({ label, text: label })),
        correctOption: 'A',
      },
    ],
  });
  assert.equal(
    (await source.list({ classId, sessionId, status: 'DRAFT' })).total,
    1
  );
  const before = (await client.get('/__state')).data;
  await client.post('/__control', { scenario: 'lost-after-commit' });
  await assert.rejects(
    source.command({ kind: 'publish', id: q.id, revision: q.revision }),
    (e) => e.kind === 'uncertain'
  );
  const after = await source.detail(q.id);
  assert.equal(after.status, 'PUBLISHED');
  const counts = (await client.get('/__state')).data;
  assert.equal(counts.commits, before.commits + 1);
  assert.equal(
    counts.writes,
    before.writes + 1,
    'No implicit replay after uncertain write'
  );
  await assert.rejects(
    source.command({ kind: 'publish', id: q.id, revision: q.revision }),
    (e) => e.kind === 'conflict'
  );
  q = await source.command({
    kind: 'archive',
    id: q.id,
    revision: after.revision,
    reason: 'Simulation complete',
  });
  assert.equal(q.status, 'ARCHIVED');
  const draft = await source.command({ kind: 'create', sessionId, metadata });
  await source.command({
    kind: 'delete',
    id: draft.id,
    revision: draft.revision,
  });
  await assert.rejects(source.detail(draft.id), (e) => e.kind === 'notFound');
  await client.post('/__control', { scenario: 'html' });
  await assert.rejects(source.detail(q.id), (e) => e.kind === 'error');
  await client.post('/__control', { scenario: 'denied' });
  await assert.rejects(source.detail(q.id), (e) => e.kind === 'denied');
  process.stdout.write(
    'P6 actual adapter HTTP simulation passed: serialization, one commit/no implicit replay, reconcile GET, stale revision, archive/delete, HTML 503 and denied.'
  );
}
main().catch((e) => {
  console.error(e.code || e.message);
  process.exitCode = 1;
});
