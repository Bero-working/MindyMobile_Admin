import {
  formatScore,
  scoreHundredths,
  validateMetadata,
  validateQuestion,
  validateQuestions,
  mergeMetadata,
  canWrite,
  moveQuestion,
} from '@/modules/quiz/model';
import type { Quiz, Question } from '@/modules/quiz/types';

const question: Question = {
  key: 'local-1',
  prompt: 'Question?',
  options: [
    { label: 'A', text: 'One' },
    { label: 'B', text: 'Two' },
    { label: 'C', text: 'Three' },
    { label: 'D', text: 'Four' },
  ],
  correctOption: 'B',
};
const quiz: Quiz = {
  id: 'q1',
  sessionId: 's1',
  title: 'Quiz',
  description: '',
  purpose: 'TEST',
  maxScore: '10.00',
  dueAt: null,
  timeLimitMinutes: null,
  status: 'DRAFT',
  revision: 1,
  publishedAt: null,
  questions: [question],
};
test('score remains exact in hundredths and formats vi/en without floating point', () => {
  expect(scoreHundredths('999999.99')).toBe(99999999);
  expect(scoreHundredths('0.01')).toBe(1);
  for (const invalid of ['0', '0.00', '-1', '1.001', '1e2', '1000000', 'NaN'])
    expect(scoreHundredths(invalid)).toBeNull();
  expect(formatScore('7.50', 'vi')).toBe('7,5');
  expect(formatScore('10.00', 'en')).toBe('10');
});
test('metadata distinguishes unset deadlines, invalid instants, timer boundaries and required purpose', () => {
  const metadata = {
    title: ' Quiz ',
    description: '',
    purpose: 'TEST' as const,
    maxScore: '10',
    dueAt: '',
    timeLimit: '',
  };
  expect(validateMetadata(metadata, true)).toEqual({});
  expect(
    validateMetadata({ ...metadata, dueAt: '2026-02-30T18:00:00+07:00' }, true)
  ).toHaveProperty('dueAt');
  expect(
    validateMetadata({ ...metadata, dueAt: '2026-11-02T18:00:00' }, true)
  ).toHaveProperty('dueAt');
  expect(
    validateMetadata({ ...metadata, timeLimit: '241', purpose: '' }, true)
  ).toMatchObject({ timeLimit: 'timerInvalid', purpose: 'purposeRequired' });
  expect(validateMetadata({ ...metadata, title: '   ' }, false)).toHaveProperty(
    'title'
  );
});
test('question validation enforces ABCD, meaningful text and one explicit correct option', () => {
  expect(validateQuestion(question)).toEqual({});
  expect(validateQuestion({ ...question, prompt: ' ' })).toHaveProperty(
    'prompt'
  );
  expect(validateQuestion({ ...question, correctOption: null })).toHaveProperty(
    'correctOption'
  );
  expect(
    validateQuestion({
      ...question,
      options: question.options.map(() => ({ label: 'A', text: 'Option' })),
    })
  ).toHaveProperty('options');
});
test('whole replacement rejects 0, 201 questions and duplicate server ids', () => {
  expect(validateQuestions([])).toBe('needOne');
  expect(
    validateQuestions(
      Array.from({ length: 200 }, (_, i) => ({ ...question, key: String(i) }))
    )
  ).toBeNull();
  expect(validateQuestions(Array.from({ length: 201 }, () => question))).toBe(
    'maxQuestions'
  );
  expect(
    validateQuestions([
      { ...question, id: 'id' },
      { ...question, id: 'id' },
    ])
  ).toBe('invalidQuestions');
});
test('metadata-only response preserves loaded questions and updates revision', () => {
  const metadata = { ...quiz };
  delete metadata.questions;
  expect(mergeMetadata(quiz, { ...metadata, revision: 2 })).toEqual({
    ...quiz,
    revision: 2,
  });
});
test('write gate is independent of session completion and reordering is immutable', () => {
  expect(canWrite('IN_PROGRESS', 'COMPLETED')).toBe(true);
  expect(canWrite('COMPLETED', 'SCHEDULED')).toBe(false);
  expect(canWrite('IN_PROGRESS', 'CANCELLED')).toBe(false);
  const list = [question, { ...question, key: 'local-2' }];
  expect(moveQuestion(list, 0, 1)[0]?.key).toBe('local-2');
  expect(list[0]?.key).toBe('local-1');
});
