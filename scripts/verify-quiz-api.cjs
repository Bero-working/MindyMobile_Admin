const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { connect, root } = require('./quiz-runtime.cjs');
async function main() {
  const dataset = JSON.parse(
    fs.readFileSync(
      path.join(root, '.maestro/phase-5-dataset.local.json'),
      'utf8'
    )
  );
  assert.equal(
    dataset.mentorProfile,
    'phase5Mentor',
    'Only an isolated existing verification fixture may be used'
  );
  assert.ok(
    dataset.className?.includes('P5'),
    'Fixture class must be named for P5 verification'
  );
  const actor = await connect('MENTOR', false, dataset.mentorProfile);
  const sessionId = dataset.sessions.nativeReschedule;
  const cls = await actor.client.get(`/mentor/classes/${dataset.classId}`);
  assert.equal(cls.status, 200, 'Fixture class read');
  const runId = randomUUID();
  const metadata = {
    title: `P6 API verification ${runId}`,
    description: 'Synthetic verification quiz',
    purpose: 'TEST',
    maxScore: '10',
    dueAt: '',
    timeLimit: '15',
  };
  const before = await actor.source.list({
    classId: dataset.classId,
    sessionId,
  });
  let quiz = await actor.source.command({
    kind: 'create',
    sessionId,
    metadata,
  });
  assert.equal(quiz.status, 'DRAFT');
  const created = quiz.id;
  const full = await actor.source.detail(quiz.id);
  assert.deepEqual(full.questions, []);
  quiz = await actor.source.command(
    {
      kind: 'metadata',
      id: quiz.id,
      revision: quiz.revision,
      metadata: { ...metadata, title: `${metadata.title} edited` },
    },
    full
  );
  const question = {
    key: 'local',
    prompt: 'Synthetic question?',
    options: ['A', 'B', 'C', 'D'].map((label) => ({
      label,
      text: `Option ${label}`,
    })),
    correctOption: 'B',
  };
  quiz = await actor.source.command({
    kind: 'questions',
    id: quiz.id,
    revision: quiz.revision,
    questions: [question],
  });
  assert.equal(quiz.questions[0].correctOption, 'B');
  const staleRevision = quiz.revision - 1;
  await assert.rejects(
    actor.source.command({
      kind: 'publish',
      id: quiz.id,
      revision: staleRevision,
    }),
    (e) => e.kind === 'conflict'
  );
  const found = await actor.source.list({
    classId: dataset.classId,
    sessionId,
    status: 'DRAFT',
  });
  assert.ok(found.items.some((q) => q.id === created));
  const outsider = await connect('MENTOR', false, 'phase3Mentor');
  await assert.rejects(
    outsider.source.detail(created),
    (e) => e.kind === 'denied'
  );
  const manager = await connect('MANAGER');
  await assert.rejects(
    manager.source.detail(created),
    (e) => e.kind === 'denied'
  );
  quiz = await actor.source.command({
    kind: 'publish',
    id: quiz.id,
    revision: quiz.revision,
  });
  assert.equal(quiz.status, 'PUBLISHED');
  await assert.rejects(
    actor.source.command({
      kind: 'questions',
      id: quiz.id,
      revision: quiz.revision,
      questions: [question],
    }),
    (e) => e.code === 'ASSIGNMENT_CONTENT_FROZEN'
  );
  quiz = await actor.source.command({
    kind: 'archive',
    id: quiz.id,
    revision: quiz.revision,
    reason: 'Isolated API verification complete',
  });
  assert.equal((await actor.source.detail(quiz.id)).status, 'ARCHIVED');
  const discarded = await actor.source.command({
    kind: 'create',
    sessionId,
    metadata: { ...metadata, title: `P6 disposable ${runId}` },
  });
  await actor.source.command({
    kind: 'delete',
    id: discarded.id,
    revision: discarded.revision,
  });
  await assert.rejects(
    actor.source.detail(discarded.id),
    (e) => e.kind === 'notFound'
  );
  const report = {
    runId,
    verifiedAt: new Date().toISOString(),
    classId: dataset.classId,
    sessionId,
    archivedQuizId: created,
    deletedDraftId: discarded.id,
    preexistingSessionAssignmentCount: before.total,
    coverage: [
      'class/session list',
      'create',
      'detail private keys',
      'patch metadata',
      'PUT questions',
      'stale revision',
      'outsider denied',
      'manager denied',
      'publish freeze',
      'archive',
      'DELETE JSON body 204/404',
    ],
  };
  fs.writeFileSync(
    path.join(root, 'build-logs/phase-6-api.json'),
    JSON.stringify(report, null, 2)
  );
  process.stdout.write(
    `P6 real adapter API verification passed (${report.coverage.length} checks). Synthetic quiz archived; disposable draft deleted.`
  );
}
main().catch((e) => {
  console.error(e.code || e.message);
  process.exitCode = 1;
});
