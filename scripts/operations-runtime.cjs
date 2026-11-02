const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const {
  connect: authenticate,
  root,
  baseURL,
} = require('./attendance-runtime.cjs');
function load(file, cache = new Map()) {
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
      return { appConfig: { api: { timeout: 2000 } } };
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
const { createOperationsService } = load(
  path.join(root, 'src/modules/operations/services/operationsService.ts')
);
async function connect(role = 'MANAGER', simulated = false, profile) {
  const actor = await authenticate(role, simulated, profile);
  return {
    ...actor,
    source: createOperationsService({
      baseURL: process.env.OPERATIONS_API_URL || baseURL,
      client: actor.client,
    }),
  };
}
module.exports = { connect, createOperationsService, root, baseURL };
