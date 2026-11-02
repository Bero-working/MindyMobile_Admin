// Read-only inventory; never deletes or alters server data.
const fs = require('node:fs');
const path = require('node:path');
const { connect, root, baseURL } = require('./attendance-runtime.cjs');
async function main() {
  const { client } = await connect('ADMIN');
  async function pages(url) {
    const items = [];
    for (let page = 1; ; page++) {
      const r = await client.get(url, { params: { page, pageSize: 100 } });
      if (r.status !== 200 || !Array.isArray(r.data.items))
        throw new Error(`Inventory ${url}: HTTP ${r.status}`);
      items.push(...r.data.items);
      if (items.length >= r.data.total || !r.data.items.length) return items;
    }
  }
  const [users, classes] = await Promise.all([
    pages('/admin/users'),
    pages('/admin/classes'),
  ]);
  const fixtureUsers = users.filter((u) => {
    const m =
      /^p2-([a-z0-9]+)-phase2(mentor|student[12])@example\.invalid$/.exec(
        u.email
      );
    return (
      m &&
      u.displayName ===
        `P2 E2E ${m[1]} ${u.role} ${u.role === 'MENTOR' ? 0 : m[2].slice(-1)}`
    );
  });
  const fixtureClasses = classes.filter((c) => {
    const m = /^P2-E2E-([A-Z0-9]+)$/.exec(c.code);
    return (
      m &&
      c.name === `P2 E2E ${m[1].toLowerCase()}` &&
      fixtureUsers.some((u) => u.id === c.mentor?.id && u.role === 'MENTOR')
    );
  });
  const details = [];
  for (const c of fixtureClasses) {
    const r = await client.get(`/admin/classes/${c.id}`);
    if (r.status !== 200) throw new Error(`Class detail HTTP ${r.status}`);
    details.push(r.data);
  }
  const output = path.join(
    root,
    'build-logs/phase-2-api/cleanup-inventory.local.json'
  );
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(
    output,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        api: baseURL,
        totalUsers: users.length,
        totalClasses: classes.length,
        users: fixtureUsers,
        classes: fixtureClasses,
        classDetails: details,
      },
      null,
      2
    )
  );
  process.stdout.write(
    JSON.stringify({
      fixtureUsers: fixtureUsers.length,
      fixtureClasses: fixtureClasses.length,
      totalUsers: users.length,
      totalClasses: classes.length,
      saved: output,
    }) + '\n'
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
