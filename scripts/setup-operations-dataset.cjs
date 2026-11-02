const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, randomBytes } = require('node:crypto');
const { connect, root } = require('./operations-runtime.cjs');
async function main() {
  const output = path.join(root, '.maestro/phase-5-dataset.local.json');
  fs.rmSync(output, { force: true });
  const admin = await connect('ADMIN');
  const stamp = Date.now().toString(36);
  const accountFile = path.join(root, '.maestro/accounts.local.json');
  const accounts = JSON.parse(fs.readFileSync(accountFile, 'utf8'));
  async function call(client, method, url, data, expected = 200) {
    const response = await client.request({
      method,
      url,
      ...(data ? { data } : {}),
    });
    if (response.status !== expected)
      throw new Error(
        `P5 dataset ${method} ${url}: HTTP ${response.status} ${response.data?.code || ''}`
      );
    return response.data;
  }
  async function user(role, label) {
    const profile = `phase5${label}`,
      credentials = {
        email: `p5-${stamp}-${label.toLowerCase()}@example.invalid`,
        password: `P5-${randomBytes(16).toString('hex')}!`,
      };
    const created = await call(
      admin.client,
      'POST',
      '/admin/users',
      { ...credentials, displayName: `P5 ${stamp} ${label}`, role },
      201
    );
    accounts[profile] = credentials;
    fs.writeFileSync(accountFile, JSON.stringify(accounts, null, 2));
    return {
      ...(await connect(role, false, profile)),
      id: created.id,
      profile,
      displayName: `P5 ${stamp} ${label}`,
    };
  }
  const mentor = await user('MENTOR', 'Mentor'),
    substitute = await user('MENTOR', 'Substitute');
  const coursePage = await call(
    admin.client,
    'GET',
    '/admin/courses?page=1&pageSize=100'
  );
  const course = coursePage.items.find((c) => c.isActive);
  if (!course) throw new Error('P5 requires an active course');
  const day = (offset) =>
    new Date(Date.now() + offset * 86400000 + 7 * 3600000)
      .toISOString()
      .slice(0, 10);
  let detail = await call(
    admin.client,
    'POST',
    '/admin/classes',
    {
      courseId: course.id,
      mentorId: mentor.id,
      code: `P5-E2E-${stamp}`,
      name: `P5 E2E ${stamp}`,
      deliveryMode: 'ONLINE',
      meetingUrl: 'https://meet.example.invalid/p5-e2e',
      startDate: day(1),
      endDate: day(20),
      maxStudents: 10,
    },
    201
  );
  const classId = detail.id,
    unit = detail.units[0];
  if (!unit) throw new Error('P5 fixture course requires a unit');
  const sessions = {};
  for (const [index, name] of [
    'apiAssign',
    'apiReschedule',
    'apiReplacement',
    'nativeAssign',
    'nativeReschedule',
    'nativeReplacement',
  ].entries()) {
    detail = await call(
      admin.client,
      'POST',
      `/admin/classes/${classId}/sessions`,
      {
        classUnitId: unit.id,
        title: `P5 ${name}`,
        startsAt: `${day(index + 2)}T18:30:00+07:00`,
        endsAt: `${day(index + 2)}T20:00:00+07:00`,
      },
      201
    );
    const item = detail.units
      .flatMap((u) => u.sessions)
      .find((s) => s.title === `P5 ${name}`);
    if (!item) throw new Error(`P5 session missing: ${name}`);
    sessions[name] = item.id;
  }
  await call(admin.client, 'POST', `/admin/classes/${classId}/open`);
  const orders = {};
  for (const label of ['ApiStudent', 'NativeStudent']) {
    const student = await user('STUDENT', label);
    await call(student.client, 'POST', '/me/cart/items', { classId }, 201);
    const checkout = await call(
      student.client,
      'POST',
      '/me/cart/checkout',
      { paymentType: 'CASH' },
      201
    );
    const order = checkout.orders[0];
    if (!order) throw new Error('P5 fixture checkout missing order');
    orders[label] = {
      id: order.id,
      orderCode: order.orderCode,
      totalAmount: order.totalAmount,
      studentId: student.id,
    };
  }
  const dataset = {
    runId: randomUUID(),
    createdAt: new Date().toISOString(),
    classId,
    className: detail.name,
    mentorId: mentor.id,
    mentorProfile: mentor.profile,
    substituteId: substitute.id,
    substituteName: substitute.displayName,
    substituteProfile: substitute.profile,
    unitId: unit.id,
    sessions,
    orders,
    replacementDate: day(10),
    nativeRescheduleDate: day(11),
    nativeReplacementDate: day(12),
  };
  fs.writeFileSync(output, JSON.stringify(dataset, null, 2));
  process.stdout.write(
    'P5 fresh dedicated class, six sessions, two mentors and two unpaid CASH fixture orders created.\n'
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
