const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { connect, root } = require('./attendance-runtime.cjs');
async function main() {
  const dataset = {
    verifiedAt: new Date().toISOString(),
    mentor: {},
    manager: {},
    coverage: {},
  };
  const simulated = process.argv.includes('--simulation');
  for (const role of ['MENTOR', 'MANAGER']) {
    const { source, client } = await connect(role, simulated);
    const read = async (request) => {
      const r = await source.read({ role, ...request });
      process.stdout.write(
        `${role} ${request.kind}: ${r.kind}${r.kind === 'success' ? ` (total ${r.data.total})` : r.code ? ` (${r.code})` : ''}\n`
      );
      assert.equal(r.kind, 'success', `${role} ${request.kind}`);
      return r.data;
    };
    if (role === 'MENTOR') {
      const response = await client.get('/mentor/classes', {
        params: { page: 1, pageSize: 100 },
      });
      assert.equal(response.status, 200);
      const classItem = response.data.items[0];
      assert.ok(classItem, 'Mentor classes required');
      const response2 = await client.get(
        `/mentor/classes/${classItem.id}/sessions`,
        { params: { page: 1, pageSize: 100 } }
      );
      assert.equal(response2.status, 200);
      const sessions = response2.data.items;
      assert.ok(sessions.length, 'Mentor sessions required');
      const chosen =
        sessions.find((s) => s.status === 'IN_PROGRESS') ||
        sessions.find((s) => s.status === 'SCHEDULED') ||
        sessions[0];
      const data = await read({
        kind: 'attendance',
        sessionId: chosen.sessionId,
        pageSize: 100,
      });
      await read({ kind: 'context', sessionId: chosen.sessionId });
      if (chosen.status === 'SCHEDULED')
        await read({ kind: 'candidates', sessionId: chosen.sessionId });
      await read({ kind: 'note', sessionId: chosen.sessionId });
      dataset.mentor = {
        classId: classItem.id,
        sessionId: chosen.sessionId,
        status: chosen.status,
        rows: data.rows.length,
      };
      dataset.coverage.mentorCandidates = sessions.some(
        (s) => s.status === 'SCHEDULED'
      );
    } else {
      const classes = await read({ kind: 'classes', pageSize: 100 });
      assert.ok(classes.classes.length, 'Manager classes required');
      const students = await read({ kind: 'managementStudents', pageSize: 20 });
      if (students.managementStudents.length)
        await read({
          kind: 'classes',
          studentId: students.managementStudents[0].id,
          pageSize: 20,
        });
      const queue = await read({ kind: 'incomplete', pageSize: 20 });
      const chosenClass =
        classes.classes.find((c) => c.status === 'IN_PROGRESS') ||
        classes.classes[0];
      const sessions = await read({
        kind: 'managerSessions',
        classId: chosenClass.id,
        pageSize: 20,
        mode: 'history',
      });
      assert.ok(sessions.sessions.length, 'Manager sessions required');
      const chosen =
        sessions.sessions.find((s) => s.actualStartedAt) ||
        sessions.sessions[0];
      const data = await read({
        kind: 'attendance',
        sessionId: chosen.id,
        pageSize: 100,
      });
      await read({ kind: 'audits', sessionId: chosen.id });
      await read({
        kind: 'recoveryStudents',
        classId: chosenClass.id,
        pageSize: 100,
      });
      await read({
        kind: 'managerSessions',
        mode: 'finalize',
        status: 'IN_PROGRESS',
      });
      dataset.manager = {
        classId: chosenClass.id,
        sessionId: chosen.id,
        status: chosen.status,
        studentId: students.managementStudents[0]?.id,
        rows: data.rows.length,
      };
      dataset.coverage.incomplete = queue.total;
    }
  }
  if (!simulated)
    fs.writeFileSync(
      path.join(root, '.maestro/phase-2-dataset.local.json'),
      JSON.stringify(dataset, null, 2)
    );
  process.stdout.write(
    'P2 read adapter verification complete; existing data was not mutated.\n'
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
