import {
  parseQuestionFile,
  validateImportFile,
} from '@/modules/quiz/importParser';

function parse(name: string, content: string) {
  let key = 0;
  return parseQuestionFile(name, content, () => `local-${++key}`);
}
function ok(name: string, content: string) {
  const result = parse(name, content);
  if ('fatal' in result) throw new Error(result.fatal);
  return result;
}

describe('csv', () => {
  test('reads quoted cells, BOM, CRLF, and Vietnamese headers', () => {
    const { questions, issues } = ok(
      'quiz.csv',
      '\uFEFFCâu hỏi,A,B,C,D,Đáp án\r\n"Chọn, đúng ""nhất""?",1,2,"3\n4",5,c\r\n'
    );
    expect(issues).toEqual([]);
    expect(questions).toEqual([
      {
        key: 'local-1',
        prompt: 'Chọn, đúng "nhất"?',
        options: [
          { label: 'A', text: '1' },
          { label: 'B', text: '2' },
          { label: 'C', text: '3\n4' },
          { label: 'D', text: '5' },
        ],
        correctOption: 'C',
      },
    ]);
  });
  test('detects the semicolon delimiter used by Excel in vi-VN', () => {
    const { questions } = ok(
      'quiz.csv',
      'question;A;B;C;D;correct\nHai, ba?;1;2;3;4;A'
    );
    expect(questions[0]?.prompt).toBe('Hai, ba?');
  });
  test('a stray comma is an error and never shifts the answer key', () => {
    const { questions, issues } = ok(
      'quiz.csv',
      'question,A,B,C,D,correct\nHai, ba?,1,2,3,4,A\nĐúng?,1,2,3,4,B'
    );
    expect(issues).toEqual([{ line: 2, code: 'importColumns' }]);
    expect(questions).toHaveLength(1);
    expect(questions[0]?.correctOption).toBe('B');
  });
  test('reports the row for missing options and invalid answers', () => {
    const { questions, issues } = ok(
      'quiz.csv',
      'question,A,B,C,D,correct\n,1,2,3,4,A\nQ,1,,3,4,A\nQ,1,2,3,4,E'
    );
    expect(questions).toEqual([]);
    expect(issues).toEqual([
      { line: 2, code: 'importPrompt' },
      { line: 3, code: 'importOption' },
      { line: 4, code: 'importCorrect' },
    ]);
  });
  test('rejects files without the required columns', () => {
    expect(parse('quiz.csv', 'question,A,B,correct\nQ,1,2,A')).toEqual({
      fatal: 'importHeader',
    });
  });
});

describe('txt', () => {
  test('reads numbered questions with several answer labels', () => {
    const { questions, issues } = ok(
      'quiz.txt',
      [
        'Câu 1: 2 + 2 = ?',
        'A. 3',
        'B) 4',
        'C: 5',
        'D. 6',
        'Đáp án: B',
        '',
        '2. Thủ đô?',
        'Dòng thứ hai',
        'A. Huế',
        'B. Hà Nội',
        'C. Đà Nẵng',
        'D. Cần Thơ',
        'ANSWER: b',
      ].join('\n')
    );
    expect(issues).toEqual([]);
    expect(questions.map((q) => [q.prompt, q.correctOption])).toEqual([
      ['2 + 2 = ?', 'B'],
      ['Thủ đô?\nDòng thứ hai', 'B'],
    ]);
  });
  test('a prompt that looks like a later option stays in the prompt', () => {
    const { questions } = ok(
      'quiz.txt',
      'C. Ronaldo chơi ở vị trí nào?\nA. 1\nB. 2\nC. 3\nD. 4\nAnswer: A'
    );
    expect(questions[0]?.prompt).toBe('C. Ronaldo chơi ở vị trí nào?');
    expect(questions[0]?.options[2]?.text).toBe('3');
  });
  test('only a real numbering prefix is removed from the prompt', () => {
    const block = 'A. 1\nB. 2\nC. 3\nD. 4\nAnswer: A';
    const { questions } = ok(
      'quiz.txt',
      `Q3 là quý mấy?\n${block}\n1.5 là số gì?\n${block}\nCâu 3: Hỏi?\n${block}`
    );
    expect(questions.map((q) => q.prompt)).toEqual([
      'Q3 là quý mấy?',
      '1.5 là số gì?',
      'Hỏi?',
    ]);
  });
  test('a question without an answer is reported, the next one is kept', () => {
    const { questions, issues } = ok(
      'quiz.txt',
      'Q1\nA. 1\nB. 2\nC. 3\nD. 4\nQ2\nA. 1\nB. 2\nC. 3\nD. 4\nĐáp án: D'
    );
    expect(issues).toEqual([{ line: 1, code: 'importCorrect' }]);
    expect(questions.map((q) => q.prompt)).toEqual(['Q2']);
  });
});

test('fatal file problems', () => {
  expect(parse('quiz.xlsx', 'x')).toEqual({ fatal: 'importUnsupported' });
  expect(parse('quiz.csv', '  \n')).toEqual({ fatal: 'importEmpty' });
  expect(parse('quiz.txt', 'c\uFFFDu')).toEqual({ fatal: 'importEncoding' });
  expect(validateImportFile('quiz.docx', 10)).toBe('importUnsupported');
  expect(validateImportFile('quiz.CSV', 4 * 1024 * 1024)).toBe(
    'importTooLarge'
  );
  expect(validateImportFile('quiz.txt', null)).toBeNull();
});
