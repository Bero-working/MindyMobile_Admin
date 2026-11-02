// Creates only fresh, explicitly named E2E resources through authorized HTTP routes.
// Does not backdate enrollment/payment evidence or modify existing teaching data.
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, randomBytes } = require('node:crypto');
const { connect, root } = require('./attendance-runtime.cjs');
async function main() {
  const output = path.join(root, '.maestro/phase-2-dataset.local.json');
  fs.rmSync(output, { force: true }); // A failed setup must never reuse an earlier run's dataset.
  const { client: admin } = await connect('ADMIN');
  const { client: manager } = await connect('MANAGER');
  const stamp = Date.now().toString(36);
  const accountFile = path.join(root, '.maestro/accounts.local.json');
  const accounts = fs.existsSync(accountFile)
    ? JSON.parse(fs.readFileSync(accountFile, 'utf8'))
    : {};
  async function call(client, method, url, data, status = 200) {
    const r = await client.request({ method, url, ...(data ? { data } : {}) });
    if (r.status !== status)
      throw new Error(
        `Dataset ${method} ${url}: HTTP ${r.status} ${r.data?.code || ''}`
      );
    return r.data;
  }
  async function person(role, index) {
    const profile =
      role === 'MENTOR' ? 'phase2Mentor' : `phase2Student${index}`;
    const credentials = {
      email: `p2-${stamp}-${profile.toLowerCase()}@example.invalid`,
      password: `P2-${randomBytes(16).toString('hex')}!`,
    };
    const user = await call(
      admin,
      'POST',
      '/admin/users',
      { ...credentials, displayName: `P2 E2E ${stamp} ${role} ${index}`, role },
      201
    );
    accounts[profile] = credentials;
    fs.writeFileSync(accountFile, JSON.stringify(accounts, null, 2));
    return { ...(await connect(role, false, profile)), id: user.id, profile };
  }
  const mentor = await person('MENTOR', 0);
  const courses = await call(
    admin,
    'GET',
    '/admin/courses?pageSize=100&page=1'
  );
  const course = courses.items.find((c) => c.isActive);
  if (!course) throw new Error('An active course is required for E2E');
  const now = Date.now(),
    day = new Date(now + 7 * 3600000).toISOString().slice(0, 10);
  const endDate = new Date(now + 7 * 86400000 + 7 * 3600000)
    .toISOString()
    .slice(0, 10);
  let detail = await call(
    admin,
    'POST',
    '/admin/classes',
    {
      courseId: course.id,
      mentorId: mentor.id,
      code: `P2-E2E-${stamp}`,
      name: `P2 E2E ${stamp}`,
      deliveryMode: 'ONLINE',
      meetingUrl: 'https://meet.example.invalid/p2-e2e',
      startDate: day,
      endDate,
      maxStudents: 10,
    },
    201
  );
  const classId = detail.id;
  const unit = detail.units[0];
  if (!unit) throw new Error('Course must contain a unit');
  const sessionNames = [
    'apiLifecycle',
    'apiFinalize',
    'nativeMentor',
    'nativeFinalize',
    'apiRecovery',
    'nativeRecovery',
  ];
  const sessions = {};
  const midnight = Date.parse(`${day}T00:00:00+07:00`);
  if (now - midnight < 2 * 3600000)
    throw new Error(
      'Dataset needs at least two hours of elapsed business day; rerun after 02:00'
    );
  const base = Math.floor((now - 110 * 60000) / 60000) * 60000;
  for (let i = 0; i < sessionNames.length; i++) {
    const name = sessionNames[i];
    detail = await call(
      admin,
      'POST',
      `/admin/classes/${classId}/sessions`,
      {
        classUnitId: unit.id,
        title: `P2 ${name}`,
        startsAt: new Date(base + i * 15 * 60000).toISOString(),
        endsAt: new Date(base + (i * 15 + 10) * 60000).toISOString(),
      },
      201
    );
    const created = detail.units
      .flatMap((u) => u.sessions)
      .find((s) => s.title === `P2 ${name}`);
    if (!created) throw new Error('Created session missing');
    sessions[name] = created.id;
  }
  await call(admin, 'POST', `/admin/classes/${classId}/open`);
  const students = [];
  for (let i = 1; i <= 2; i++) {
    const student = await person('STUDENT', i);
    await call(student.client, 'POST', '/me/cart/items', { classId }, 201);
    const checkout = await call(
      student.client,
      'POST',
      '/me/cart/checkout',
      { paymentType: 'CASH' },
      201
    );
    const order =
      checkout.orders.find((o) =>
        o.items?.some((item) => item.classId === classId)
      ) || checkout.orders[0];
    if (!order) throw new Error('Missing fresh fixture order');
    await call(manager, 'POST', `/manager/cash-orders/${order.id}/confirm`, {
      receivedAmount: order.totalAmount,
    });
    students.push({ studentId: student.id, orderId: order.id });
  }
  const roster = await call(
    manager,
    'GET',
    `/manager/classes/${classId}/students?pageSize=100&page=1`
  );
  if (roster.items.length !== 2 || roster.items.some((s) => !s.paidAt))
    throw new Error('Fresh paid enrollment evidence missing');
  const observedAt = new Date().toISOString();
  const dataset = {
    runId: randomUUID(),
    createdAt: observedAt,
    classId,
    className: detail.name,
    mentorProfile: 'phase2Mentor',
    sessions,
    students: students.map((s) => ({
      ...s,
      enrollmentId: roster.items.find((i) =>
        i.studentName?.endsWith(`STUDENT ${students.indexOf(s) + 1}`)
      )?.enrollmentId,
    })),
    enrollments: roster.items.map((s) => ({
      id: s.enrollmentId,
      paidAt: s.paidAt,
    })),
    recoveryEvidence: {
      observedAt,
      actualStartedAt: new Date(
        Math.ceil(Date.now() / 60000) * 60000
      ).toISOString(),
      description:
        'Synthetic E2E-only register: two confirmed fixture enrollments observed by setup; actual test interval recorded after payment, no backdating.',
    },
  };
  fs.writeFileSync(output, JSON.stringify(dataset, null, 2));
  process.stdout.write(
    'Fresh P2 E2E class, six sessions and two paid fixture students created.\n'
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
