// Read-only verification of the actual mobile adapter against configured backend.
// Credentials/cookies stay in memory; output contains resource counts and paths only.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const axios = require('axios');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const configured = fs
  .readFileSync(path.join(root, '.env.development'), 'utf8')
  .match(/^API_URL=(.+)$/m)?.[1]
  ?.trim();
const baseURL = process.env.TEACHING_API_URL || configured;
const cache = new Map();
const dataset = {};
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const mod = new Module(file, module);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(path.dirname(file));
  const original = mod.require.bind(mod);
  mod.require = (name) => {
    if (name === '@react-native-community/netinfo')
      return { fetch: async () => ({ isConnected: true }) };
    if (name === '@/config/env') return { env: { API_URL: baseURL } };
    if (name === '@/config/app')
      return { appConfig: { api: { timeout: 10000 } } };
    if (name.startsWith('.'))
      return load(path.resolve(path.dirname(file), `${name}.ts`));
    return original(name);
  };
  cache.set(file, mod);
  mod._compile(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    file
  );
  return mod.exports;
}
const { createTeachingService } = load(
  path.join(root, 'src/modules/teaching/services/teachingService.ts')
);
async function main() {
  const simulated = process.argv.includes('--simulation');
  const accounts = simulated
    ? {}
    : JSON.parse(
        fs.readFileSync(path.join(root, '.maestro/accounts.local.json'), 'utf8')
      );
  for (const role of simulated ? ['MENTOR'] : ['MENTOR', 'MANAGER']) {
    const client = axios.create({
      baseURL,
      validateStatus: () => true,
      timeout: 10000,
    });
    const cookies = new Map();
    client.interceptors.request.use((config) => {
      if (cookies.size)
        config.headers.set(
          'Cookie',
          [...cookies].map(([key, value]) => `${key}=${value}`).join('; ')
        );
      return config;
    });
    client.interceptors.response.use((response) => {
      for (const header of response.headers['set-cookie'] ?? []) {
        const pair = header.split(';')[0];
        const at = pair.indexOf('=');
        cookies.set(pair.slice(0, at), pair.slice(at + 1));
      }
      return response;
    });
    if (!simulated) {
      const email =
        process.env[`MAESTRO_${role}_EMAIL`] ||
        accounts[role.toLowerCase()]?.email;
      const password =
        process.env[`MAESTRO_${role}_PASSWORD`] ||
        accounts[role.toLowerCase()]?.password;
      assert.ok(email && password, `Missing local ${role} account`);
      const login = await client.post('/auth/login', { email, password });
      assert.equal(login.status, 200, `${role} login status`);
      assert.equal(login.data.user.role, role);
    }
    const source = createTeachingService({ baseURL, client });
    const read = async (request) => {
      const result = await source.read({ role, ...request });
      process.stdout.write(
        `${role} ${request.kind}: ${result.kind}${result.kind === 'success' ? ` (total ${result.data.total})` : ''}\n`
      );
      if (simulated && request.kind === 'context') {
        assert.equal(result.kind, 'error');
        return result;
      }
      assert.equal(
        result.kind,
        'success',
        `${role} ${request.kind} adapter result`
      );
      return result;
    };
    const cards = process.argv.includes('--cards') && role === 'MENTOR';
    const list = await read({
      kind: 'classes',
      pageSize: cards ? 1 : 100,
      ...(cards ? { includeCardDetails: true } : {}),
    });
    if (cards) {
      for (const card of list.data.classes) {
        assert.equal(
          typeof card.elapsedSessions,
          'number',
          'Card progress must be available'
        );
        assert.ok(
          card.elapsedSessions >= 0 && card.elapsedSessions <= card.sessionCount
        );
        assert.equal(typeof card.availableSeats, 'number');
        process.stdout.write(
          `MENTOR card: ${card.elapsedSessions}/${card.sessionCount} sessions, ${card.sessionCount - card.elapsedSessions} remaining; ${card.availableSeats}/${card.maxStudents} seats left\n`
        );
      }
    }
    const item =
      list.data.classes.find(
        (value) => value.status === 'IN_PROGRESS' && value.scope === 'CLASS'
      ) ?? list.data.classes[0];
    dataset[role.toLowerCase()] = {
      classId: item?.id,
      substituteClassId: list.data.classes.find(
        (value) => value.scope === 'SESSION' && value.status === 'IN_PROGRESS'
      )?.id,
    };
    if (item) {
      const detail = await read({
        kind: 'class',
        classId: item.id,
      });
      if (cards) {
        const info = detail.data.classInfo;
        assert.equal(typeof info.unitCount, 'number');
        assert.equal(typeof info.sessionCount, 'number');
        assert.equal(info.enrollmentCounts.ACTIVE, null);
        process.stdout.write(
          `MENTOR detail: ${info.unitCount} units, ${info.sessionCount} sessions; roster not preloaded\n`
        );
      }
      await read({ kind: 'units', classId: item.id });
      const sessions = await read({ kind: 'sessions', classId: item.id });
      if (item.scope === 'CLASS')
        await read({ kind: 'students', classId: item.id });
      const session = sessions.data.sessions.find(
        (value) => value.readSessionContext
      );
      if (session) {
        dataset[role.toLowerCase()].sessionId = session.id;
        await read({ kind: 'context', sessionId: session.id });
        if (!simulated && session.status !== 'CANCELLED')
          await read({ kind: 'sessionStudents', sessionId: session.id });
      } else
        process.stdout.write(
          `${role}: no authorized session context in dataset\n`
        );
    } else
      process.stdout.write(
        `${role}: empty class dataset; detail not exercised\n`
      );
    if (role === 'MENTOR') {
      const date = new Date().toISOString().slice(0, 10);
      const end = new Date(Date.now() + 7 * 86400000)
        .toISOString()
        .slice(0, 10);
      await read({
        kind: 'schedule',
        from: `${date}T00:00:00+07:00`,
        to: `${end}T00:00:00+07:00`,
      });
    }
  }
  if (!simulated)
    fs.writeFileSync(
      path.join(root, '.maestro/phase-1-dataset.local.json'),
      JSON.stringify(dataset, null, 2)
    );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
