// Loads the actual mobile TypeScript adapter with Node networking for HTTP verification.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const axios = require('axios');
const root = path.resolve(__dirname, '..');
function config(name) {
  if (process.env[name]) return process.env[name];
  const file = path.join(root, '.env.development');
  if (!fs.existsSync(file)) return undefined;
  return fs
    .readFileSync(file, 'utf8')
    .match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]
    ?.trim();
}

const baseURL = process.env.MATERIAL_API_URL || config('API_URL');
function load(file, cache = new Map()) {
  if (cache.has(file)) return cache.get(file).exports;
  const mod = new Module(file, module);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(path.dirname(file));
  const original = mod.require.bind(mod);
  mod.require = (name) => {
    if (name === '@react-native-community/netinfo')
      return { fetch: async () => ({ isConnected: true }) };
    if (name === '@/config/env')
      return { env: { API_URL: baseURL, API_ORIGIN: config('API_ORIGIN') } };
    if (name === '@/config/app')
      return { appConfig: { api: { timeout: 10000 } } };
    if (name.startsWith('@/'))
      return load(path.join(root, 'src', `${name.slice(2)}.ts`), cache);
    if (name.startsWith('.'))
      return load(path.resolve(path.dirname(file), `${name}.ts`), cache);
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
const { createMaterialService } = load(
  path.join(root, 'src/modules/materials/service.ts')
);
async function connect(role, simulated = false, profile = role.toLowerCase()) {
  const accountsPath = path.join(root, '.maestro/accounts.local.json');
  const accounts =
    !simulated && fs.existsSync(accountsPath)
      ? JSON.parse(fs.readFileSync(accountsPath, 'utf8'))
      : {};
  const client = axios.create({
    baseURL,
    validateStatus: () => true,
    timeout: 10000,
  });
  const cookies = new Map();
  client.interceptors.request.use((c) => {
    if (cookies.size)
      c.headers.set(
        'Cookie',
        [...cookies].map(([k, v]) => `${k}=${v}`).join('; ')
      );
    return c;
  });
  client.interceptors.response.use((r) => {
    for (const h of r.headers['set-cookie'] ?? []) {
      const pair = h.split(';')[0];
      const at = pair.indexOf('=');
      cookies.set(pair.slice(0, at), pair.slice(at + 1));
    }
    return r;
  });
  let userId = '11111111-1111-4111-8111-111111111111';
  if (!simulated) {
    const email =
      (profile === role.toLowerCase()
        ? process.env[`MAESTRO_${role}_EMAIL`]
        : undefined) || accounts[profile]?.email;
    const password =
      (profile === role.toLowerCase()
        ? process.env[`MAESTRO_${role}_PASSWORD`]
        : undefined) || accounts[profile]?.password;
    if (!email || !password) throw new Error(`Missing local ${role} account`);
    const login = await client.post('/auth/login', { email, password });
    if (login.status !== 200 || login.data.user?.role !== role)
      throw new Error(`${role} login failed (${login.status})`);
    userId = login.data.user.id;
  }
  return {
    client,
    source: createMaterialService({
      baseURL,
      client,
      origin: config('API_ORIGIN'),
    }),
    userId,
  };
}
module.exports = { connect, root, baseURL, load };
