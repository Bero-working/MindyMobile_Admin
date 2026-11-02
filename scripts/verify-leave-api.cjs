// Creates and mutates only a fresh dedicated P4 fixture; existing classes are read-only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, randomBytes } = require('node:crypto');
const { connect, root } = require('./leave-runtime.cjs');
async function main() {
  const admin = await connect('ADMIN'),
    manager = await connect('MANAGER');
  const stamp = Date.now().toString(36);
  const call = async (method, url, data, expected = 200) => {
    const r = await admin.client.request({
      method,
      url,
      ...(data ? { data } : {}),
    });
    assert.equal(
      r.status,
      expected,
      `${method} ${url}: HTTP ${r.status} ${r.data?.code ?? ''}`
    );
    return r.data;
  };
  const accountFile = path.join(root, '.maestro/accounts.local.json');
  const accounts = JSON.parse(fs.readFileSync(accountFile, 'utf8'));
  const credentials = {
    email: `p4-${stamp}@example.invalid`,
    password: `P4-${randomBytes(16).toString('hex')}!`,
  };
  const mentorUser = await call(
    'POST',
    '/admin/users',
    { ...credentials, displayName: `P4 Mentor ${stamp}`, role: 'MENTOR' },
    201
  );
  accounts.phase4Mentor = credentials;
  fs.writeFileSync(accountFile, JSON.stringify(accounts, null, 2));
  const mentor = await connect('MENTOR', false, 'phase4Mentor');
  const courses = await call('GET', '/admin/courses?pageSize=100&page=1');
  const course = courses.items.find((c) => c.isActive);
  assert.ok(course, 'Active course required');
  const day = (offset) =>
    new Date(Date.now() + offset * 86400000 + 7 * 3600000)
      .toISOString()
      .slice(0, 10);
  let cls = await call(
    'POST',
    '/admin/classes',
    {
      courseId: course.id,
      mentorId: mentorUser.id,
      code: `P4-API-${stamp}`,
      name: `P4 API ${stamp}`,
      deliveryMode: 'ONLINE',
      meetingUrl: 'https://meet.example.invalid/p4',
      startDate: day(2),
      endDate: day(20),
      maxStudents: 10,
    },
    201
  );
  assert.ok(cls.units[0], 'Course unit required');
  cls = await call(
    'POST',
    `/admin/classes/${cls.id}/sessions`,
    {
      classUnitId: cls.units[0].id,
      title: 'P4 API leave source',
      startsAt: `${day(5)}T18:00:00+07:00`,
      endsAt: `${day(5)}T20:00:00+07:00`,
    },
    201
  );
  await call('POST', `/admin/classes/${cls.id}/open`);
  const read = async (actor, request) => {
    const r = await actor.source.read(request);
    assert.equal(r.kind, 'success', `${request.kind}: ${JSON.stringify(r)}`);
    return r.data;
  };
  const write = async (actor, intent) => {
    const r = await actor.source.write(intent);
    assert.equal(r.kind, 'success', `${intent.kind}: ${JSON.stringify(r)}`);
    return r.data;
  };
  await read(mentor, { kind: 'classes', role: 'MENTOR' });
  await read(manager, { kind: 'classes', role: 'MANAGER' });
  await read(manager, { kind: 'mentors', role: 'MANAGER', id: mentorUser.id });
  for (const action of ['withdraw', 'reject', 'approve']) {
    const preview = await read(mentor, {
      kind: 'preview',
      role: 'MENTOR',
      fromDate: day(5),
      toDate: day(5),
      period: 'FULL_DAY',
    });
    assert.equal(preview.preview.noticeEligible, true);
    assert.equal(preview.preview.sources.length, 1);
    const source = preview.preview.sources[0];
    const slots = await read(mentor, {
      kind: 'slots',
      role: 'MENTOR',
      id: source.id,
      targetDate: day(8),
      targetPeriod: 'EVENING',
    });
    assert.ok(slots.slots.length, 'Server makeup slots required');
    const create = {
      kind: 'create',
      role: 'MENTOR',
      key: randomUUID(),
      body: {
        fromDate: day(5),
        toDate: day(5),
        period: 'FULL_DAY',
        reason: `P4 API ${action}`,
        sourceVersions: preview.preview.sourceVersions,
        sessionMappings: [
          {
            sourceSessionId: source.id,
            targetDate: day(8),
            targetPeriod: 'EVENING',
            ...slots.slots[0],
          },
        ],
      },
    };
    const created = await write(mentor, create);
    const replay = await write(mentor, create);
    assert.equal(replay.request.id, created.request.id);
    const mentorDetail = await read(mentor, {
      kind: 'detail',
      role: 'MENTOR',
      id: created.request.id,
    });
    assert.equal(mentorDetail.request.items.length, 1);
    const detail = await read(manager, {
      kind: 'detail',
      role: 'MANAGER',
      id: created.request.id,
    });
    assert.equal(detail.request.sourcesCurrent, true);
    assert.equal(detail.request.studentConflictCount, 0);
    const role = action === 'withdraw' ? 'MENTOR' : 'MANAGER',
      actor = action === 'withdraw' ? mentor : manager;
    const mutation = {
      kind: action,
      role,
      id: created.request.id,
      key: randomUUID(),
      body: {
        expectedVersion: detail.request.version,
        reason: `P4 API ${action}`,
        ...(action === 'approve' ? { acknowledgeStudentConflicts: false } : {}),
      },
    };
    const result = await write(actor, mutation);
    assert.equal(
      result.request.status,
      { withdraw: 'WITHDRAWN', reject: 'REJECTED', approve: 'APPROVED' }[action]
    );
    const repeated = await write(actor, mutation);
    assert.equal(repeated.request.version, result.request.version);
    if (action === 'approve') {
      assert.equal(result.replacements.length, 1);
      const context = await manager.client.get(
        `/class-sessions/${source.id}/context`
      );
      assert.equal(context.data.session.status, 'CANCELLED');
      const stale = await manager.source.write({
        ...mutation,
        key: randomUUID(),
      });
      assert.equal(stale.kind, 'error');
    }
  }
  const list = await read(manager, {
    kind: 'list',
    role: 'MANAGER',
    mentorId: mentorUser.id,
    status: 'APPROVED',
    pageSize: 1,
  });
  assert.equal(list.total, 1);
  await read(manager, { kind: 'conflicts', role: 'MANAGER', classId: cls.id });
  const denied = await mentor.client.get('/management/mentor-leave-requests');
  assert.equal(denied.status, 403);
  // Late enrollment against an approved replacement produces an actual makeup conflict.
  const studentCredentials = {
    email: `p4-student-${stamp}@example.invalid`,
    password: `P4-${randomBytes(16).toString('hex')}!`,
  };
  await call(
    'POST',
    '/admin/users',
    {
      ...studentCredentials,
      displayName: `P4 Student ${stamp}`,
      role: 'STUDENT',
    },
    201
  );
  accounts.phase4Student = studentCredentials;
  fs.writeFileSync(accountFile, JSON.stringify(accounts, null, 2));
  const student = await connect('STUDENT', false, 'phase4Student');
  const otherMentor = await call(
    'POST',
    '/admin/users',
    {
      email: `p4-other-${stamp}@example.invalid`,
      password: `P4-${randomBytes(16).toString('hex')}!`,
      displayName: `P4 Other ${stamp}`,
      role: 'MENTOR',
    },
    201
  );
  const anotherClass = async (label, offset) => {
    let result = await call(
      'POST',
      '/admin/classes',
      {
        courseId: course.id,
        mentorId: otherMentor.id,
        code: `P4-${label}-${stamp}`,
        name: `P4 API ${label} ${stamp}`,
        deliveryMode: 'ONLINE',
        meetingUrl: 'https://meet.example.invalid/p4',
        startDate: day(2),
        endDate: day(20),
        maxStudents: 10,
      },
      201
    );
    result = await call(
      'POST',
      `/admin/classes/${result.id}/sessions`,
      {
        classUnitId: result.units[0].id,
        title: `P4 ${label}`,
        startsAt: `${day(offset)}T18:00:00+07:00`,
        endsAt: `${day(offset)}T20:00:00+07:00`,
      },
      201
    );
    await call('POST', `/admin/classes/${result.id}/open`);
    return result;
  };
  const clashClass = await anotherClass('clash', 8);
  const targetClass = await anotherClass('target', 10);
  for (const classId of [cls.id, clashClass.id]) {
    const added = await student.client.post('/me/cart/items', { classId });
    assert.equal(added.status, 201);
    const checkout = await student.client.post('/me/cart/checkout', {
      paymentType: 'CASH',
    });
    assert.equal(checkout.status, 201);
    if (classId === cls.id) {
      const order = checkout.data.orders[0];
      const paid = await manager.client.post(
        `/manager/cash-orders/${order.id}/confirm`,
        { receivedAmount: order.totalAmount }
      );
      assert.equal(paid.status, 200);
    }
  }
  const queue = await read(manager, {
    kind: 'conflicts',
    role: 'MANAGER',
    classId: cls.id,
  });
  assert.ok(queue.conflicts.length, 'Dedicated student conflict required');
  const conflict = queue.conflicts[0];
  const candidates = await read(manager, {
    kind: 'candidates',
    role: 'MANAGER',
    id: conflict.id,
  });
  const target = candidates.candidates.find(
    (c) => c.session.classId === targetClass.id
  );
  assert.ok(target, 'Equivalent target class must be a candidate');
  const place = {
    kind: 'place',
    role: 'MANAGER',
    id: conflict.id,
    key: randomUUID(),
    body: {
      reason: 'P4 API placement',
      expectedVersion: conflict.version,
      targetSessionId: target.session.id,
      expectedTargetVersion: target.session.version,
      contentMatchConfirmed: true,
    },
  };
  const placed = await write(manager, place);
  assert.equal(placed.placedSession.id, target.session.id);
  await write(manager, place);
  const assigned = await read(manager, {
    kind: 'conflicts',
    role: 'MANAGER',
    classId: cls.id,
  });
  const selected = assigned.conflicts.find((c) => c.id === conflict.id);
  assert.equal(selected.status, 'MAKEUP_ASSIGNED');
  assert.ok(selected.placementVersion);
  const cancel = {
    kind: 'cancel',
    role: 'MANAGER',
    id: selected.placementId,
    key: randomUUID(),
    body: {
      reason: 'P4 API cancel',
      expectedVersion: selected.placementVersion,
    },
  };
  await write(manager, cancel);
  await write(manager, cancel);
  const reopened = await read(manager, {
    kind: 'conflicts',
    role: 'MANAGER',
    classId: cls.id,
  });
  assert.equal(
    reopened.conflicts.find((c) => c.id === conflict.id).status,
    'OPEN'
  );
  const refreshedCandidates = await read(manager, {
    kind: 'candidates',
    role: 'MANAGER',
    id: conflict.id,
  });
  const nextTarget = refreshedCandidates.candidates.find(
    (c) => c.session.id === target.session.id
  );
  assert.ok(nextTarget);
  await write(manager, {
    ...place,
    key: randomUUID(),
    body: {
      ...place.body,
      expectedVersion: reopened.conflicts.find((c) => c.id === conflict.id)
        .version,
      expectedTargetVersion: nextTarget.session.version,
    },
  });
  fs.writeFileSync(
    path.join(root, '.maestro/phase-4-dataset.local.json'),
    JSON.stringify(
      {
        runId: randomUUID(),
        createdAt: new Date().toISOString(),
        classId: cls.id,
        mentorId: mentorUser.id,
      },
      null,
      2
    )
  );
  process.stdout.write(
    'P4 live API PASS on isolated fixture: selectors, preview, slots, create/replay, Mentor/Manager detail, withdraw/reject/approve/replay, cancelled source, stale state, filtered list, conflicts and role denial. Live candidates/place/replay/cancel/replay/reassign PASS on isolated paid enrollment conflict.'
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
