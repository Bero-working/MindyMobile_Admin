// Exercise the real mobile adapter against a fresh isolated course/class only.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const axios = require('axios');
const { connect, root } = require('./material-runtime.cjs');
async function main() {
  const out = path.join(root, '.maestro/phase-3-dataset.local.json');
  fs.rmSync(out, { force: true });
  const { client: admin } = await connect('ADMIN');
  const manager = await connect('MANAGER');
  const stamp = Date.now().toString(36),
    runId = randomUUID();
  const call = async (method, url, data, expected = 200) => {
    const r = await admin.request({ method, url, ...(data ? { data } : {}) });
    assert.equal(
      r.status,
      expected,
      `${method} ${url}: ${r.status} ${r.data?.code ?? ''}`
    );
    return r.data;
  };
  const accountsFile = path.join(root, '.maestro/accounts.local.json');
  const credentials = {
    email: `p3-${stamp}@example.invalid`,
    password: `P3-${randomBytes(16).toString('hex')}!`,
  };
  const user = await call(
    'POST',
    '/admin/users',
    { ...credentials, displayName: `P3 Mentor ${stamp}`, role: 'MENTOR' },
    201
  );
  const accounts = JSON.parse(fs.readFileSync(accountsFile, 'utf8'));
  accounts.phase3Mentor = credentials;
  fs.writeFileSync(accountsFile, JSON.stringify(accounts, null, 2));
  const mentor = await connect('MENTOR', false, 'phase3Mentor');
  const existing = await call('GET', '/admin/courses?pageSize=100&page=1');
  assert.ok(
    existing.items[0]?.category?.id,
    'An existing course category is required'
  );
  const course = await call(
    'POST',
    '/admin/courses',
    {
      categoryId: existing.items[0].category.id,
      code: `P3-E2E-${stamp}`,
      title: `P3 E2E ${stamp}`,
      priceAmount: 10000,
    },
    201
  );
  const courseUnit = await call(
    'POST',
    `/admin/courses/${course.id}/units`,
    { title: 'P3 verification chapter' },
    201
  );
  await call('POST', `/admin/courses/${course.id}/activate`);
  const day = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10),
    end = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  let cls = await call(
    'POST',
    '/admin/classes',
    {
      courseId: course.id,
      mentorId: user.id,
      code: `P3-${stamp}`,
      name: `P3 E2E ${stamp}`,
      deliveryMode: 'ONLINE',
      meetingUrl: 'https://meet.example.invalid/p3',
      startDate: day,
      endDate: end,
      maxStudents: 10,
    },
    201
  );
  const unit = cls.units[0];
  assert.ok(unit, 'Fresh class unit required');
  cls = await call(
    'POST',
    `/admin/classes/${cls.id}/sessions`,
    {
      classUnitId: unit.id,
      title: 'P3 verification session',
      startsAt: new Date(
        new Date(Date.now() + 86400000 + 7 * 3600000)
          .toISOString()
          .slice(0, 10) + 'T09:00:00+07:00'
      ).toISOString(),
      endsAt: new Date(
        new Date(Date.now() + 86400000 + 7 * 3600000)
          .toISOString()
          .slice(0, 10) + 'T10:00:00+07:00'
      ).toISOString(),
    },
    201
  );
  await call('POST', `/admin/classes/${cls.id}/open`);
  const scope = { role: 'MENTOR', classId: cls.id },
    mg = { role: 'MANAGER' };
  const title = `P3 Article ${stamp}`;
  let m = await mentor.source.save(scope, unit.id, {
    contentType: 'ARTICLE',
    title,
    contentText: 'P3 isolated verification\n<script>literal text</script>',
  });
  assert.equal(m.reviewStatus, 'DRAFT');
  assert.ok(m.contentHtml.includes('&lt;script&gt;'));
  const originalRevision = m.revision;
  m = await mentor.source.command(scope, m.id, 'submit', m.revision);
  assert.equal(m.reviewStatus, 'PENDING_REVIEW');
  const rejected = await manager.source.command(
    mg,
    m.id,
    'reject',
    m.revision,
    'Missing examples'
  );
  assert.equal(rejected.rejectionReason, 'Missing examples');
  await assert.rejects(
    mentor.source.command(scope, m.id, 'submit', m.revision),
    (e) => e.kind === 'conflict'
  );
  m = await mentor.source.save(
    scope,
    unit.id,
    { expectedRevision: m.revision, title: `${title} updated` },
    m.id
  );
  assert.ok(m.revision > originalRevision);
  assert.equal(m.reviewStatus, 'DRAFT');
  await assert.rejects(
    mentor.source.command(scope, m.id, 'submit', originalRevision),
    (e) => e.kind === 'conflict'
  );
  m = await mentor.source.command(scope, m.id, 'submit', m.revision);
  m = await manager.source.command(mg, m.id, 'approve', m.revision);
  assert.equal(m.reviewStatus, 'APPROVED');
  assert.ok(m.publishedAt);
  const again = await manager.source.command(mg, m.id, 'approve', m.revision);
  assert.equal(again.publishedAt, m.publishedAt);
  assert.equal((await mentor.source.detail(scope, m.id)).canEdit, false);
  // Leave two fresh draft articles for native submit/approve and reject flows.
  const native = await mentor.source.save(scope, unit.id, {
    contentType: 'ARTICLE',
    title: `P3 Native ${stamp}`,
    contentText: 'Native article preview and review.',
  });
  const rejectNative = await mentor.source.save(scope, unit.id, {
    contentType: 'ARTICLE',
    title: `P3 Reject ${stamp}`,
    contentText: 'Native rejection fixture.',
  });
  await mentor.source.command(
    scope,
    rejectNative.id,
    'submit',
    rejectNative.revision
  );
  const dataset = {
    runId,
    createdAt: new Date().toISOString(),
    classId: cls.id,
    className: cls.name,
    unitId: unit.id,
    courseUnitId: courseUnit.id,
    mentorProfile: 'phase3Mentor',
    articleId: m.id,
    nativeId: native.id,
    nativeTitle: native.title,
    rejectId: rejectNative.id,
    rejectTitle: rejectNative.title,
    coverage: { articleLifecycle: true, storage: false },
  };
  // Uploads are verified through a credential-free client, never through the API cookie jar.
  const objects = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 300]/Resources<<>>/Contents 4 0 R>>',
    '<</Length 0>>\nstream\n\nendstream',
  ];
  let pdf = '%PDF-1.4\n',
    offsets = [0];
  objects.forEach((object, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += i + 1 + ' 0 obj\n' + object + '\nendobj\n';
  });
  const xref = Buffer.byteLength(pdf);
  pdf +=
    'xref\n0 5\n0000000000 65535 f \n' +
    offsets
      .slice(1)
      .map((n) => String(n).padStart(10, '0') + ' 00000 n \n')
      .join('') +
    'trailer\n<</Size 5/Root 1 0 R>>\nstartxref\n' +
    xref +
    '\n%%EOF\n';
  const bytes = Buffer.from(pdf);
  try {
    const intent = await mentor.source.uploadIntent({
      courseUnitId: courseUnit.id,
      classId: cls.id,
      classUnitId: unit.id,
      originalFilename: 'p3-fixture.pdf',
      declaredMimeType: 'application/pdf',
      declaredSizeBytes: bytes.length,
    });
    const url = mentor.source.storageUrl(intent.uploadUrl);
    assert.ok(
      !Object.keys(intent.requiredHeaders).some((k) =>
        /cookie|authorization|origin/i.test(k)
      )
    );
    const upload = await axios.put(url, bytes, {
      headers: intent.requiredHeaders,
      maxRedirects: 0,
      timeout: 15000,
      validateStatus: () => true,
    });
    assert.ok(
      upload.status >= 200 && upload.status < 300,
      `Storage PUT ${upload.status}`
    );
    let status = await mentor.source.complete(intent.fileId);
    for (let i = 0; status.status === 'PROCESSING' && i < 15; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      status = await mentor.source.file(intent.fileId);
    }
    assert.equal(status.status, 'READY', 'Validation worker must report READY');
    const binary = await mentor.source.save(scope, unit.id, {
      contentType: 'FILE',
      fileId: status.id,
      title: `P3 PDF ${stamp}`,
    });
    const access = await mentor.source.access(
      scope,
      binary.id,
      binary.revision,
      status.id
    );
    const downloaded = await axios.get(access.url, {
      responseType: 'arraybuffer',
      maxRedirects: 0,
      timeout: 15000,
    });
    assert.ok(downloaded.data.byteLength > 0);
    dataset.fileId = binary.id;
    dataset.coverage.storage = true;
  } catch (e) {
    dataset.storageBlocked = e.message;
  }
  fs.writeFileSync(out, JSON.stringify(dataset, null, 2));
  process.stdout.write(
    String(
      'P3 real API: isolated ARTICLE create/submit/reject/edit/conflict/approve/replay passed.'
    ) + '\n'
  );
  process.stdout.write(
    String(
      `Storage: ${dataset.coverage.storage ? 'passed' : `blocked (${dataset.storageBlocked})`}`
    ) + '\n'
  );
  if (!dataset.coverage.storage) process.exitCode = 2;
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
