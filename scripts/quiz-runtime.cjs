const path = require('node:path');
const fs = require('node:fs');
const {
  connect: connectAccount,
  load,
  root,
  baseURL,
} = require('./material-runtime.cjs');
const { createQuizService } = load(
  path.join(root, 'src/modules/quiz/service.ts')
);
async function connect(
  role = 'MENTOR',
  simulated = false,
  profile = role.toLowerCase()
) {
  const actor = await connectAccount(role, simulated, profile);
  const origin =
    process.env.QUIZ_API_ORIGIN ||
    fs
      .readFileSync(path.join(root, '.env.development'), 'utf8')
      .match(/^API_ORIGIN=(.*)$/m)?.[1]
      ?.trim();
  return {
    ...actor,
    source: createQuizService({
      baseURL: process.env.QUIZ_API_URL || baseURL,
      origin,
      client: actor.client,
      timeout: Number(process.env.QUIZ_TIMEOUT_MS || 10000),
    }),
  };
}
module.exports = { connect, root };
