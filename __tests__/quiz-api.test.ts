import axios, { type AxiosInstance } from 'axios';
import { createQuizService, QuizError } from '@/modules/quiz/service';
import { metadataOf } from '@/modules/quiz/model';
const id = '11111111-1111-4111-8111-111111111111';
const sessionId = '22222222-2222-4222-8222-222222222222';
const qid = '33333333-3333-4333-8333-333333333333';
const wire = {
  id,
  sessionId,
  title: 'Quiz',
  description: '',
  purpose: 'TEST',
  type: 'QUIZ',
  maxScore: '10.00',
  maxAttempts: 1,
  dueAt: null,
  timeLimitMinutes: null,
  status: 'DRAFT',
  revision: 2,
  publishedAt: null,
};
const detail = {
  ...wire,
  questions: [
    {
      id: qid,
      position: 1,
      prompt: 'Q?',
      options: ['A', 'B', 'C', 'D'].map((label) => ({ label, text: label })),
      correctOption: 'B',
    },
  ],
};
function setup() {
  const client: AxiosInstance = axios.create();
  const request = jest.spyOn(client, 'request').mockResolvedValue({
    status: 200,
    data: detail,
    headers: { date: 'Mon, 02 Nov 2026 10:00:00 GMT' },
  });
  const api = createQuizService({
    baseURL: 'https://example.test/api',
    origin: 'https://mobile.test',
    client,
  });
  return { api, request, client };
}
test('list serializes only selected filters and validates quiz-only page projection', async () => {
  const { api, request } = setup();
  request.mockResolvedValueOnce({
    status: 200,
    data: { items: [wire], total: 1, page: 1, pageSize: 20 },
    headers: {},
  });
  expect(await api.list({ classId: id, status: 'PUBLISHED' })).toMatchObject({
    total: 1,
    items: [{ id }],
  });
  expect(request).toHaveBeenCalledWith(
    expect.objectContaining({
      url: `/mentor/classes/${id}/assignments`,
      params: { type: 'QUIZ', status: 'PUBLISHED', page: 1, pageSize: 20 },
      withCredentials: true,
    })
  );
});
test('detail requires private keys, ABCD, UUIDs, status and single attempt without fabricating missing questions', async () => {
  const { api, request } = setup();
  expect((await api.detail(id)).questions?.[0]).toMatchObject({
    key: qid,
    id: qid,
    correctOption: 'B',
  });
  for (const data of [
    wire,
    { ...detail, type: 'ZIP' },
    { ...detail, maxAttempts: 2 },
    { ...detail, status: 'NEW' },
    { ...detail, maxScore: '1e2' },
  ]) {
    request.mockResolvedValueOnce({ status: 200, data, headers: {} });
    await expect(api.detail(id)).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  }
});
test('create and patch serialize distinct fields and never send client-only config or keys', async () => {
  const { api, request } = setup();
  const quiz = await api.detail(id);
  const metadata = { ...metadataOf(quiz), title: 'Edited', maxScore: '10,5' };
  request.mockResolvedValue({ status: 200, data: wire, headers: {} });
  await api.command({ kind: 'create', sessionId, metadata });
  expect(request.mock.calls.slice(-1)[0]?.[0]).toMatchObject({
    method: 'POST',
    data: {
      purpose: 'TEST',
      type: 'QUIZ',
      title: 'Edited',
      description: '',
      maxScore: '10.5',
      dueAt: null,
      timeLimitMinutes: null,
    },
    headers: { Origin: 'https://mobile.test' },
  });
  await api.command({ kind: 'metadata', id, revision: 2, metadata }, quiz);
  expect(request.mock.calls.slice(-1)[0]?.[0]).toMatchObject({
    method: 'PATCH',
    data: { expectedRevision: 2, title: 'Edited' },
  });
});
test('question replacement omits local ids; delete sends JSON revision body and accepts 204', async () => {
  const { api, request } = setup();
  const quiz = await api.detail(id);
  await api.command({
    kind: 'questions',
    id,
    revision: 2,
    questions: [{ ...quiz.questions![0]!, key: 'local' }],
  });
  expect(request.mock.calls.slice(-1)[0]?.[0]).toMatchObject({
    method: 'PUT',
    data: {
      expectedRevision: 2,
      questions: [{ id: qid, prompt: 'Q?', correctOption: 'B' }],
    },
  });
  expect(
    JSON.stringify(request.mock.calls.slice(-1)[0]?.[0].data)
  ).not.toContain('local');
  request.mockResolvedValueOnce({ status: 204, data: '', headers: {} });
  expect(
    await api.command({ kind: 'delete', id, revision: 2 })
  ).toBeUndefined();
  expect(request.mock.calls.slice(-1)[0]?.[0]).toMatchObject({
    method: 'DELETE',
    data: { expectedRevision: 2 },
  });
});
test('write timeout/5xx/malformed success are uncertain and never automatically replayed', async () => {
  const { api, request } = setup();
  request.mockRejectedValueOnce(new Error('timeout'));
  await expect(
    api.command({ kind: 'publish', id, revision: 2 })
  ).rejects.toMatchObject({ kind: 'uncertain' });
  expect(request).toHaveBeenCalledTimes(1);
  request.mockResolvedValueOnce({
    status: 503,
    data: '<html>bad gateway</html>',
    headers: {},
  });
  await expect(
    api.command({ kind: 'archive', id, revision: 2, reason: 'Reason' })
  ).rejects.toMatchObject({ kind: 'uncertain' });
  request.mockResolvedValueOnce({ status: 200, data: {}, headers: {} });
  await expect(
    api.command({ kind: 'publish', id, revision: 2 })
  ).rejects.toMatchObject({ kind: 'uncertain' });
});
test('scope, origin, revision and state conflicts stay distinct with support id', async () => {
  const { api, request } = setup();
  for (const [status, code, kind] of [
    [403, 'ASSIGNMENT_SCOPE_REQUIRED', 'denied'],
    [403, 'ORIGIN_NOT_ALLOWED', 'error'],
    [409, 'ASSIGNMENT_VERSION_CONFLICT', 'conflict'],
    [409, 'ASSIGNMENT_CLOSED', 'error'],
  ] as const) {
    request.mockResolvedValueOnce({
      status,
      data: { code, requestId: 'support-1' },
      headers: {},
    });
    await expect(api.detail(id)).rejects.toMatchObject({
      kind,
      code,
      requestId: 'support-1',
    });
  }
});
test('401 performs one guarded refresh, and stale identity prevents accepting data', async () => {
  const { client, request } = setup();
  const restore = jest.fn().mockResolvedValue({
    kind: 'user',
    user: { role: 'MENTOR', email: 'mentor@test', displayName: 'M' },
  });
  const api = createQuizService({
    baseURL: 'https://example.test',
    client,
    restore,
  });
  request.mockResolvedValueOnce({ status: 401, data: {}, headers: {} });
  await api.detail(id);
  expect(restore).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledTimes(2);
  const inactive = createQuizService({
    baseURL: 'https://example.test',
    client,
    isActive: () => false,
  });
  await expect(inactive.detail(id)).rejects.toBeInstanceOf(QuizError);
  expect(request).toHaveBeenCalledTimes(2);
});
