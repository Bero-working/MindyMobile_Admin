import type { Metadata, Question, Quiz } from './types';
export const labels = ['A', 'B', 'C', 'D'] as const;
export function scoreHundredths(value: string): number | null {
  if (!/^(0|[1-9]\d{0,5})(\.\d{1,2})?$/.test(value)) return null;
  const [whole = '', fraction = ''] = value.split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(result) && result > 0 ? result : null;
}
export function formatScore(value: string, language: string): string {
  const normalized = value.includes('.')
    ? value.replace(/0+$/, '').replace(/\.$/, '')
    : value;
  return language.startsWith('vi') ? normalized.replace('.', ',') : normalized;
}
function validInstant(value: string): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value
    ) ||
    !Number.isFinite(Date.parse(value))
  )
    return false;
  const date = value.slice(0, 10);
  return new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
}
export function validateMetadata(
  value: Metadata,
  create: boolean
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!value.title.trim() || value.title.trim().length > 250)
    errors.title = 'titleRequired';
  if (value.description.length > 20000) errors.description = 'descriptionLong';
  if (create && !value.purpose) errors.purpose = 'purposeRequired';
  if (create && scoreHundredths(value.maxScore.replace(',', '.')) === null)
    errors.maxScore = 'scoreInvalid';
  if (value.dueAt && !validInstant(value.dueAt)) errors.dueAt = 'dueInvalid';
  if (
    value.timeLimit &&
    (!/^\d+$/.test(value.timeLimit) ||
      Number(value.timeLimit) < 1 ||
      Number(value.timeLimit) > 240)
  )
    errors.timeLimit = 'timerInvalid';
  return errors;
}
export function validateQuestion(q: Question): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!q.prompt.trim() || q.prompt.trim().length > 5000)
    errors.prompt = 'promptRequired';
  if (
    q.options.length !== 4 ||
    new Set(q.options.map((o) => o.label)).size !== 4
  )
    errors.options = 'invalidQuestions';
  for (const label of labels) {
    const text = q.options.find((o) => o.label === label)?.text.trim();
    if (!text || text.length > 2000) errors[label] = 'optionRequired';
  }
  if (!q.correctOption || !labels.includes(q.correctOption))
    errors.correctOption = 'correctRequired';
  return errors;
}
export function validateQuestions(questions: Question[]): string | null {
  if (!questions.length) return 'needOne';
  if (questions.length > 200) return 'maxQuestions';
  const ids = questions.flatMap((q) => (q.id ? [q.id] : []));
  if (
    new Set(ids).size !== ids.length ||
    questions.some((q) => Object.keys(validateQuestion(q)).length)
  )
    return 'invalidQuestions';
  return null;
}
export function mergeMetadata(previous: Quiz, next: Quiz): Quiz {
  return {
    ...next,
    ...(next.questions
      ? {}
      : previous.questions
        ? { questions: previous.questions }
        : {}),
  };
}
export function canWrite(classStatus: string, sessionStatus?: string): boolean {
  return (
    !['DRAFT', 'COMPLETED', 'CANCELLED'].includes(classStatus) &&
    sessionStatus !== 'CANCELLED'
  );
}
export function moveQuestion(
  questions: Question[],
  from: number,
  delta: number
): Question[] {
  const next = [...questions];
  if (
    from < 0 ||
    from >= next.length ||
    from + delta < 0 ||
    from + delta >= next.length
  )
    return next;
  const [item] = next.splice(from, 1);
  if (item) next.splice(from + delta, 0, item);
  return next;
}
export function metadataOf(q: Quiz): Metadata {
  return {
    title: q.title,
    description: q.description,
    purpose: q.purpose,
    maxScore: q.maxScore,
    dueAt: q.dueAt ?? '',
    timeLimit: q.timeLimitMinutes === null ? '' : String(q.timeLimitMinutes),
  };
}
export function newQuestion(key: string): Question {
  return {
    key,
    prompt: '',
    options: labels.map((label) => ({ label, text: '' })),
    correctOption: null,
  };
}
