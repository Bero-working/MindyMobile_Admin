import { labels, validateQuestion } from './model';
import type { Label, Question } from './types';

export const maxImportBytes = 3 * 1024 * 1024;
export type ImportFatal =
  | 'importUnsupported'
  | 'importTooLarge'
  | 'importEncoding'
  | 'importHeader'
  | 'importEmpty'
  | 'importUnreadable';
export type ImportIssueCode =
  | 'importColumns'
  | 'importPrompt'
  | 'importOption'
  | 'importCorrect';
export type ImportIssue = { line: number; code: ImportIssueCode };
export type ImportResult =
  | { fatal: ImportFatal }
  | { questions: Question[]; issues: ImportIssue[] };
type Draft = {
  line: number;
  prompt: string;
  options: Partial<Record<Label, string>>;
  correct: string;
};

export function importFormatOf(name: string): 'csv' | 'txt' | null {
  const extension = name.split('.').pop()?.toLowerCase();
  return extension === 'csv' || extension === 'txt' ? extension : null;
}
export function validateImportFile(
  name: string,
  size: number | null | undefined
): ImportFatal | null {
  if (!importFormatOf(name)) return 'importUnsupported';
  return size && size > maxImportBytes ? 'importTooLarge' : null;
}

function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
const headerAliases: Record<string, 'prompt' | 'correct' | Label> = {
  question: 'prompt',
  prompt: 'prompt',
  cauhoi: 'prompt',
  noidung: 'prompt',
  noidungcauhoi: 'prompt',
  correct: 'correct',
  answer: 'correct',
  correctanswer: 'correct',
  correctoption: 'correct',
  dapan: 'correct',
  dapandung: 'correct',
};
for (const label of labels) {
  const key = label.toLowerCase();
  headerAliases[key] = label;
  headerAliases[`option${key}`] = label;
  headerAliases[`luachon${key}`] = label;
  headerAliases[`dapan${key}`] = label;
}

function issueOf(draft: Draft): ImportIssueCode | null {
  const errors = validateQuestion(toQuestion(draft, ''));
  if (errors.prompt) return 'importPrompt';
  if (labels.some((label) => errors[label])) return 'importOption';
  return errors.correctOption ? 'importCorrect' : null;
}
function toQuestion(draft: Draft, key: string): Question {
  const correct = draft.correct.trim().replace(/\.$/, '').toUpperCase();
  return {
    key,
    prompt: draft.prompt.trim(),
    options: labels.map((label) => ({
      label,
      text: draft.options[label]?.trim() ?? '',
    })),
    correctOption: labels.find((label) => label === correct) ?? null,
  };
}

// Quoted cells may contain delimiters and line breaks, so rows cannot be split by line.
function csvRows(content: string): { line: number; cells: string[] }[] {
  const firstLine = content.split('\n', 1)[0] ?? '';
  const delimiter = [',', ';', '\t'].reduce((best, candidate) =>
    firstLine.split(candidate).length > firstLine.split(best).length
      ? candidate
      : best
  );
  const rows: { line: number; cells: string[] }[] = [];
  let cells: string[] = [],
    cell = '',
    quoted = false,
    line = 1,
    start = 1;
  const endRow = () => {
    cells.push(cell);
    rows.push({ line: start, cells });
    cells = [];
    cell = '';
  };
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (quoted) {
      if (char === '"' && content[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') quoted = false;
      else {
        if (char === '\n') line++;
        cell += char;
      }
    } else if (char === '"' && !cell) quoted = true;
    else if (char === delimiter) {
      cells.push(cell);
      cell = '';
    } else if (char === '\n') {
      endRow();
      line++;
      start = line;
    } else cell += char;
  }
  if (cell || cells.length) endRow();
  return rows;
}

function parseCsv(content: string, nextKey: () => string): ImportResult {
  const rows = csvRows(content).filter((row) =>
    row.cells.some((cell) => cell.trim())
  );
  const header = rows.shift();
  if (!header) return { fatal: 'importEmpty' };
  const columns = header.cells.map(
    (cell) => headerAliases[normalizeHeader(cell)]
  );
  const required = ['prompt', 'correct', ...labels] as const;
  if (required.some((name) => !columns.includes(name)))
    return { fatal: 'importHeader' };
  const questions: Question[] = [],
    issues: ImportIssue[] = [];
  for (const row of rows) {
    // A stray delimiter shifts every later cell and could silently change the answer key.
    if (row.cells.length !== columns.length) {
      issues.push({ line: row.line, code: 'importColumns' });
      continue;
    }
    const draft: Draft = {
      line: row.line,
      prompt: '',
      options: {},
      correct: '',
    };
    row.cells.forEach((value, index) => {
      const column = columns[index];
      if (column === 'prompt') draft.prompt = value;
      else if (column === 'correct') draft.correct = value;
      else if (column) draft.options[column] = value;
    });
    const code = issueOf(draft);
    if (code) issues.push({ line: row.line, code });
    else questions.push(toQuestion(draft, nextKey()));
  }
  return !questions.length && !issues.length
    ? { fatal: 'importEmpty' }
    : { questions, issues };
}

const answerLine =
  /^\s*(?:answer|correct(?:\s+answer)?|đáp\s*án(?:\s*đúng)?|dap\s*an(?:\s*dung)?)\s*[:=-]\s*([A-Da-d])\s*\.?\s*$/iu;
const optionLine = /^\s*([A-Da-d])\s*[.):]\s*(.*)$/;
const numberPrefix =
  /^\s*(?:(?:câu|cau|question|q)\s*\d+\s*[.:)-]|\d+\s*[.)])\s+/iu;

function parseText(content: string, nextKey: () => string): ImportResult {
  const questions: Question[] = [],
    issues: ImportIssue[] = [];
  let draft: Draft | undefined,
    last: Label | undefined,
    nextLabel = 0;
  const finish = () => {
    if (!draft) return;
    const code = issueOf(draft);
    if (code) issues.push({ line: draft.line, code });
    else questions.push(toQuestion(draft, nextKey()));
    draft = undefined;
    last = undefined;
    nextLabel = 0;
  };
  content.split('\n').forEach((text, index) => {
    const line = index + 1;
    if (!text.trim()) return;
    const answer = answerLine.exec(text);
    if (answer) {
      draft ??= { line, prompt: '', options: {}, correct: '' };
      draft.correct = answer[1] ?? '';
      finish();
      return;
    }
    const option = optionLine.exec(text);
    const expected = labels[nextLabel];
    // Only the next expected letter opens an option, so "C. Ronaldo..." can still be a prompt.
    if (draft && expected && option?.[1]?.toUpperCase() === expected) {
      draft.options[expected] = option[2] ?? '';
      last = expected;
      nextLabel++;
      return;
    }
    if (draft && nextLabel === labels.length) finish();
    if (!draft) {
      draft = {
        line,
        prompt: text.replace(numberPrefix, ''),
        options: {},
        correct: '',
      };
      return;
    }
    if (last) draft.options[last] = `${draft.options[last] ?? ''}\n${text}`;
    else draft.prompt += `\n${text}`;
  });
  finish();
  return !questions.length && !issues.length
    ? { fatal: 'importEmpty' }
    : { questions, issues };
}

export function parseQuestionFile(
  name: string,
  content: string,
  nextKey: () => string
): ImportResult {
  const format = importFormatOf(name);
  if (!format) return { fatal: 'importUnsupported' };
  if (content.includes('\uFFFD')) return { fatal: 'importEncoding' };
  const clean = content
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .normalize('NFC');
  if (!clean.trim()) return { fatal: 'importEmpty' };
  return format === 'csv'
    ? parseCsv(clean, nextKey)
    : parseText(clean, nextKey);
}
