const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { connect, root } = require('./operations-runtime.cjs');
async function main() {
  const actor = await connect();
  const summary = {};
  for (const status of ['PENDING', 'PAID', 'EXPIRED', 'CANCELLED']) {
    const result = await actor.source.read({
      kind: 'orders',
      status,
      pageSize: 20,
    });
    assert.equal(
      result.kind,
      'success',
      `CASH ${status}: ${result.kind}/${result.code || ''}`
    );
    summary[status] = result.data.total;
    if (result.data.orders[0]) {
      const order = result.data.orders[0];
      const detail = await actor.source.read({ kind: 'order', id: order.id });
      assert.equal(detail.kind, 'success', `CASH detail: ${detail.code || ''}`);
      const exact = await actor.source.read({
        kind: 'orders',
        orderCode: order.orderCode,
      });
      assert.equal(exact.kind, 'success');
      assert.ok(exact.data.orders.some((o) => o.id === order.id));
    }
  }
  const classes = await actor.source.read({ kind: 'classes', pageSize: 20 });
  assert.equal(classes.kind, 'success', `Classes: ${classes.code || ''}`);
  const mentor = await connect('MENTOR');
  assert.equal(
    (await mentor.source.read({ kind: 'orders', status: 'PENDING' })).kind,
    'denied'
  );
  const output = path.join(root, 'build-logs/phase-5');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(
    path.join(output, 'api-read.json'),
    JSON.stringify(
      {
        verifiedAt: new Date().toISOString(),
        counts: summary,
        managerClasses: classes.data.total,
        mentorDenied: true,
        mutations: false,
      },
      null,
      2
    )
  );
  process.stdout.write(
    `P5 live API reads PASS: ${JSON.stringify(summary)}; Mentor denied. No mutation.\n`
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
