import { act, renderHook } from '@testing-library/react-native';
import {
  QuizProvider,
  quizFixtures,
  useQuiz,
} from '@/modules/quiz/QuizProvider';
import { metadataOf } from '@/modules/quiz/model';

test('mock revision protects concurrent edits and never changes create-only configuration', async () => {
  const { result } = renderHook(() => useQuiz(), { wrapper: QuizProvider });
  const initial = quizFixtures[0]!;
  const metadata = {
    ...metadataOf(initial),
    title: 'Changed',
    maxScore: '100',
    purpose: 'HOMEWORK' as const,
  };
  await act(async () => {
    expect(
      await result.current.execute({
        kind: 'metadata',
        id: initial.id,
        revision: 1,
        metadata,
      })
    ).toMatchObject({
      kind: 'success',
      quiz: {
        revision: 2,
        title: 'Changed',
        maxScore: '10.00',
        purpose: 'TEST',
      },
    });
  });
  await act(async () => {
    expect(
      await result.current.execute({
        kind: 'metadata',
        id: initial.id,
        revision: 1,
        metadata,
      })
    ).toEqual({ kind: 'error', code: 'conflict' });
  });
});
test('publish freezes content, archive requires reason and delete is draft-only', async () => {
  const { result } = renderHook(() => useQuiz(), { wrapper: QuizProvider });
  const id = quizFixtures[0]!.id;
  await act(async () => {
    expect(
      await result.current.execute({ kind: 'publish', id, revision: 1 })
    ).toMatchObject({
      kind: 'success',
      quiz: { status: 'PUBLISHED', revision: 2 },
    });
  });
  await act(async () => {
    expect(
      await result.current.execute({
        kind: 'questions',
        id,
        revision: 2,
        questions: [],
      })
    ).toEqual({ kind: 'error', code: 'frozen' });
    expect(
      await result.current.execute({ kind: 'delete', id, revision: 2 })
    ).toEqual({ kind: 'error', code: 'frozen' });
    expect(
      await result.current.execute({
        kind: 'archive',
        id,
        revision: 2,
        reason: '  ',
      })
    ).toEqual({ kind: 'error', code: 'reasonRequired' });
  });
  await act(async () => {
    expect(
      await result.current.execute({
        kind: 'archive',
        id,
        revision: 2,
        reason: 'Changed syllabus',
      })
    ).toMatchObject({
      kind: 'success',
      quiz: { status: 'ARCHIVED', revision: 3 },
    });
  });
});
test('uncertain outcome applies at most once and can be reconciled with the current record', async () => {
  const { result } = renderHook(() => useQuiz(), {
    wrapper: ({ children }) => (
      <QuizProvider initialScenario="uncertain">{children}</QuizProvider>
    ),
  });
  const id = quizFixtures[0]!.id;
  await act(async () => {
    expect(
      await result.current.execute({ kind: 'publish', id, revision: 1 })
    ).toEqual({ kind: 'uncertain', code: 'uncertain' });
  });
  expect(result.current.read(id)).toMatchObject({
    status: 'PUBLISHED',
    revision: 2,
  });
  await act(async () => {
    expect(
      await result.current.execute({ kind: 'publish', id, revision: 1 })
    ).toEqual({ kind: 'error', code: 'conflict' });
  });
  expect(result.current.read(id)?.revision).toBe(2);
});
test('new question ids cannot collide with loaded questions, and scope loss clears private fixtures', async () => {
  const { result } = renderHook(() => useQuiz(), { wrapper: QuizProvider });
  const q = quizFixtures[0]!;
  const { id: _id, ...newQuestion } = q.questions![0]!;
  expect(_id).toBeDefined();
  await act(async () => {
    await result.current.execute({
      kind: 'questions',
      id: q.id,
      revision: 1,
      questions: [...q.questions!, { ...newQuestion, key: 'local-1' }],
    });
  });
  const ids = result.current
    .read(q.id)
    ?.questions?.map((question) => question.id);
  expect(new Set(ids).size).toBe(2);
  act(() => result.current.setScenario('denied'));
  expect(result.current.items).toEqual([]);
  expect(result.current.read(q.id)).toBeUndefined();
});
