import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { MindyThemeProvider } from '@/components/ui/theme';
import { QuizProvider, quizFixtures } from '@/modules/quiz/QuizProvider';
import { QuizListScreen } from '@/modules/quiz/QuizListScreen';
import { QuizEditorScreen } from '@/modules/quiz/QuizEditorScreen';
import { QuizDetailScreen } from '@/modules/quiz/QuizDetailScreen';
import type { Quiz, Scenario } from '@/modules/quiz/types';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import i18n from '@/translations';
let mockRole = 'MENTOR';
const mockNotify = jest.fn(),
  navigate = jest.fn(),
  push = jest.fn(),
  replace = jest.fn(),
  goBack = jest.fn();
const mockPick = jest.fn();
jest.mock('@/modules/quiz/importFile', () => ({
  pickQuestionFile: () => mockPick(),
  QuizImportError: class extends Error {},
}));
jest.mock('@/modules/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    state: { user: { id: 'mentor-1', role: mockRole } },
    notify: mockNotify,
  }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ dispatch: jest.fn() }),
  usePreventRemove: jest.fn(),
}));
jest.mock('@/modules/teaching/hooks/useTeachingQuery', () => ({
  useTeachingQuery: () => ({
    data: {
      classInfo: { id: 'c1', status: 'IN_PROGRESS', scope: 'SESSION' },
      classes: [{ id: 'c1', name: 'Lớp 1', status: 'IN_PROGRESS' }],
      session: {
        id: 's1',
        classId: 'c1',
        status: 'SCHEDULED',
        title: 'Buổi 1',
      },
      sessions: [
        {
          id: 's1',
          classId: 'c1',
          status: 'SCHEDULED',
          title: 'Buổi 1',
          startsAt: '2026-11-02T10:00:00Z',
        },
        {
          id: 's2',
          classId: 'c1',
          status: 'CANCELLED',
          title: 'Buổi 2',
          startsAt: '2026-11-03T10:00:00Z',
        },
      ],
      total: 2,
    },
    refresh: jest.fn(),
    more: jest.fn(),
  }),
}));
function props<K extends keyof AuthStackParams>(
  name: K,
  params: AuthStackParams[K]
): NativeStackScreenProps<AuthStackParams, K> {
  const result = {} as NativeStackScreenProps<AuthStackParams, K>;
  Object.assign(result, {
    route: { name, key: name, params },
    navigation: { navigate, push, replace, goBack },
  });
  return result;
}
function open(
  child: React.ReactNode,
  items: Quiz[] = quizFixtures,
  initialScenario: Scenario = 'success'
) {
  return render(
    <MindyThemeProvider>
      <QuizProvider
        initialItems={items}
        initialScenario={initialScenario}
      >
        {child}
      </QuizProvider>
    </MindyThemeProvider>
  );
}
beforeEach(async () => {
  mockRole = 'MENTOR';
  jest.clearAllMocks();
  await i18n.changeLanguage('vi');
});
test('home entry without a class asks for one, then opens that class quizzes', () => {
  open(<QuizListScreen {...props('MentorQuizzes', undefined)} />);
  expect(screen.getByTestId('quiz-classes-screen')).toBeTruthy();
  expect(screen.queryByTestId('quiz-list-create')).toBeNull();
  fireEvent.press(screen.getByTestId('quiz-class-c1'));
  expect(push).toHaveBeenCalledWith('MentorQuizzes', {
    classId: 'c1',
    classTitle: 'Lớp 1',
  });
});
test('list filters quiz status, uses scoped session picker and clearly labels mock data', () => {
  open(<QuizListScreen {...props('MentorQuizzes', { classId: 'c1' })} />);
  expect(screen.getByTestId('quiz-mock-badge')).toBeTruthy();
  expect(screen.getByTestId('quiz-list-substitute')).toBeTruthy();
  fireEvent.press(screen.getByTestId('quiz-list-filter-PUBLISHED'));
  expect(screen.queryByTestId('quiz-list-row-mock-quiz-draft')).toBeNull();
  expect(screen.getByTestId('quiz-list-row-mock-quiz-published')).toBeTruthy();
  fireEvent.press(screen.getByTestId('quiz-list-create'));
  expect(screen.getByTestId('quiz-list-session-s2')).toBeDisabled();
  fireEvent.press(screen.getByTestId('quiz-list-session-s1'));
  expect(navigate).toHaveBeenCalledWith(
    'QuizEditor',
    expect.objectContaining({ classId: 'c1', sessionId: 's1' })
  );
});
test('loading never becomes a fake empty list or zero count; Manager gets no private quiz', () => {
  const view = open(
    <QuizListScreen {...props('MentorQuizzes', { classId: 'c1' })} />,
    quizFixtures,
    'loading'
  );
  expect(screen.getByTestId('quiz-list-skeleton')).toBeTruthy();
  expect(screen.queryByTestId('quiz-list-count')).toBeNull();
  view.unmount();
  mockRole = 'MANAGER';
  open(
    <QuizDetailScreen
      {...props('QuizDetail', {
        classId: 'c1',
        assignmentId: 'mock-quiz-draft',
      })}
    />
  );
  expect(screen.getByTestId('quiz-detail-denied')).toBeTruthy();
  expect(
    screen.queryByText('Which option describes the highest growth?')
  ).toBeNull();
});
test('create requires purpose and title, then switches to question authoring', async () => {
  open(
    <QuizEditorScreen
      {...props('QuizEditor', { classId: 'c1', sessionId: 's1' })}
    />
  );
  fireEvent.press(screen.getByTestId('quiz-editor-create'));
  expect(screen.getByTestId('quiz-editor-title-error')).toBeTruthy();
  expect(screen.getByTestId('quiz-editor-purpose-error')).toBeTruthy();
  fireEvent.changeText(screen.getByTestId('quiz-editor-title'), 'Quiz mới');
  fireEvent.press(screen.getByTestId('quiz-editor-purpose-TEST'));
  fireEvent.press(screen.getByTestId('quiz-editor-create'));
  await screen.findByTestId('quiz-editor-add-question');
  expect(screen.getByTestId('quiz-editor-save-questions')).toBeDisabled();
});
test('question form does not preselect an answer; saving a question stays local until explicit save', async () => {
  open(
    <QuizEditorScreen
      {...props('QuizEditor', {
        classId: 'c1',
        sessionId: 's1',
        assignmentId: 'mock-quiz-draft',
        initialTab: 'questions',
      })}
    />
  );
  fireEvent.press(screen.getByTestId('quiz-editor-add-question'));
  fireEvent.changeText(
    screen.getByTestId('quiz-question-prompt'),
    'New question'
  );
  for (const label of ['A', 'B', 'C', 'D'])
    fireEvent.changeText(
      screen.getByTestId(`quiz-question-option-${label}`),
      `Option ${label}`
    );
  fireEvent.press(screen.getByTestId('quiz-question-done'));
  expect(screen.getByTestId('quiz-question-correct-error')).toBeTruthy();
  fireEvent.press(screen.getByTestId('quiz-question-correct-C'));
  fireEvent.press(screen.getByTestId('quiz-question-done'));
  expect(screen.getByTestId('quiz-editor-unsaved')).toBeTruthy();
  expect(screen.getByTestId('quiz-editor-preview')).toBeDisabled();
  fireEvent.press(screen.getByTestId('quiz-editor-save-questions'));
  await waitFor(() =>
    expect(screen.queryByTestId('quiz-editor-error')).toBeNull()
  );
  await waitFor(() =>
    expect(screen.queryByTestId('quiz-editor-unsaved')).toBeNull()
  );
});
test('published answers default hidden, archive requires reason and changes to read-only', async () => {
  const item = { ...quizFixtures[0]!, status: 'PUBLISHED' as const };
  open(
    <QuizDetailScreen
      {...props('QuizDetail', { classId: 'c1', assignmentId: item.id })}
    />,
    [item]
  );
  expect(
    screen.queryByTestId('quiz-detail-correct-mock-question-1')
  ).toBeNull();
  fireEvent.press(screen.getByTestId('quiz-detail-toggle-answers'));
  expect(
    screen.getByTestId('quiz-detail-correct-mock-question-1')
  ).toBeTruthy();
  fireEvent.press(screen.getByTestId('quiz-detail-archive'));
  fireEvent.press(screen.getByTestId('quiz-detail-archive-confirm'));
  expect(screen.getByTestId('quiz-detail-reason-error')).toBeTruthy();
  fireEvent.changeText(
    screen.getByTestId('quiz-detail-archive-reason'),
    'Đổi kế hoạch'
  );
  fireEvent.press(screen.getByTestId('quiz-detail-archive-confirm'));
  await screen.findByTestId('quiz-detail-archived-note');
  expect(screen.queryByTestId('quiz-detail-archive')).toBeNull();
});
test('publish needs explicit confirmation and unknown outcome is checked without sending twice', async () => {
  open(
    <QuizDetailScreen
      {...props('QuizDetail', {
        classId: 'c1',
        assignmentId: 'mock-quiz-draft',
      })}
    />,
    quizFixtures,
    'uncertain'
  );
  fireEvent.press(screen.getByTestId('quiz-detail-publish'));
  expect(screen.getByTestId('quiz-detail-publish-dialog')).toBeTruthy();
  fireEvent.press(screen.getByTestId('quiz-detail-publish-confirm'));
  await screen.findByTestId('quiz-detail-intent');
  expect(screen.getByTestId('quiz-detail-archive')).toBeDisabled();
  fireEvent.press(screen.getByTestId('quiz-detail-check'));
  await waitFor(() =>
    expect(screen.queryByTestId('quiz-detail-intent')).toBeNull()
  );
  expect(screen.getByTestId('quiz-detail-archive')).toBeTruthy();
});
test('offline allows editing but blocks writes; draft deletion requires confirmation', async () => {
  const view = open(
    <QuizEditorScreen
      {...props('QuizEditor', {
        classId: 'c1',
        sessionId: 's1',
        assignmentId: 'mock-quiz-draft',
      })}
    />,
    quizFixtures,
    'offline'
  );
  fireEvent.changeText(
    screen.getByTestId('quiz-editor-title'),
    'Changed offline'
  );
  expect(screen.getByTestId('quiz-editor-save-info')).toBeDisabled();
  expect(screen.getByTestId('quiz-editor-title')).toHaveProp(
    'value',
    'Changed offline'
  );
  view.unmount();
  open(
    <QuizDetailScreen
      {...props('QuizDetail', {
        classId: 'c1',
        assignmentId: 'mock-quiz-draft',
      })}
    />
  );
  fireEvent.press(screen.getByTestId('quiz-detail-delete'));
  expect(goBack).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId('quiz-detail-delete-confirm'));
  await waitFor(() => expect(goBack).toHaveBeenCalledTimes(1));
});

test('saving metadata preserves unsaved questions in the other tab', async () => {
  open(
    <QuizEditorScreen
      {...props('QuizEditor', {
        classId: 'c1',
        sessionId: 's1',
        assignmentId: 'mock-quiz-draft',
        initialTab: 'questions',
      })}
    />
  );
  fireEvent.press(screen.getByTestId('quiz-editor-add-question'));
  fireEvent.changeText(
    screen.getByTestId('quiz-question-prompt'),
    'Second question'
  );
  for (const label of ['A', 'B', 'C', 'D'])
    fireEvent.changeText(
      screen.getByTestId(`quiz-question-option-${label}`),
      label
    );
  fireEvent.press(screen.getByTestId('quiz-question-correct-A'));
  fireEvent.press(screen.getByTestId('quiz-question-done'));
  fireEvent.press(screen.getByTestId('quiz-editor-tab-info'));
  fireEvent.changeText(
    screen.getByTestId('quiz-editor-title'),
    'Updated metadata'
  );
  fireEvent.press(screen.getByTestId('quiz-editor-save-info'));
  await waitFor(() => {
    expect(screen.getByTestId('quiz-editor-save-info')).toBeDisabled();
    expect(screen.getByTestId('quiz-editor-save-info')).toHaveProp(
      'accessibilityState',
      expect.objectContaining({ busy: false })
    );
  });
  fireEvent.press(screen.getByTestId('quiz-editor-tab-questions'));
  expect(screen.getByTestId('quiz-editor-question-local-1')).toBeTruthy();
  expect(screen.getByTestId('quiz-editor-unsaved')).toBeTruthy();
  expect(screen.getByTestId('quiz-editor-preview')).toBeDisabled();
  fireEvent.press(screen.getByTestId('quiz-editor-save-questions'));
  await waitFor(() => expect(mockNotify).toHaveBeenCalledTimes(2));
  await waitFor(() =>
    expect(screen.queryByTestId('quiz-editor-unsaved')).toBeNull()
  );
});

describe('file upload', () => {
  const file = (content: string, name = 'quiz.csv') =>
    mockPick.mockResolvedValueOnce({ name, content });
  const openQuestions = () =>
    open(
      <QuizEditorScreen
        {...props('QuizEditor', {
          classId: 'c1',
          sessionId: 's1',
          assignmentId: 'mock-quiz-draft',
          initialTab: 'questions',
        })}
      />
    );
  test('previews valid rows and errors, then adds them only after confirmation and stays unsaved', async () => {
    file('question,A,B,C,D,correct\nTừ tệp?,1,2,3,4,B\nLỗi,1,2,3,4,E');
    openQuestions();
    fireEvent.press(screen.getByTestId('quiz-editor-import'));
    await screen.findByTestId('quiz-import-preview');
    expect(screen.getByTestId('quiz-import-issues')).toBeTruthy();
    expect(screen.queryByText('Từ tệp?')).toBeNull();
    fireEvent.press(screen.getByTestId('quiz-import-confirm'));
    expect(screen.queryByTestId('quiz-import-preview')).toBeNull();
    expect(screen.getByText('Từ tệp?')).toBeTruthy();
    expect(screen.getByTestId('quiz-editor-unsaved')).toBeTruthy();
    expect(screen.getByTestId('quiz-editor-save-questions')).toBeEnabled();
  });
  test('cancelling the preview or the picker leaves the list unchanged', async () => {
    file('question,A,B,C,D,correct\nTừ tệp?,1,2,3,4,B');
    openQuestions();
    fireEvent.press(screen.getByTestId('quiz-editor-import'));
    fireEvent.press(await screen.findByTestId('quiz-import-cancel'));
    expect(screen.queryByText('Từ tệp?')).toBeNull();
    expect(screen.queryByTestId('quiz-editor-unsaved')).toBeNull();
    mockPick.mockResolvedValueOnce(null);
    fireEvent.press(screen.getByTestId('quiz-editor-import'));
    await waitFor(() => expect(mockPick).toHaveBeenCalledTimes(2));
    expect(screen.queryByTestId('quiz-import-preview')).toBeNull();
    expect(screen.queryByTestId('quiz-import-error')).toBeNull();
  });
  test('an unusable file shows its reason instead of a preview', async () => {
    file('question,A\nQ,1');
    openQuestions();
    fireEvent.press(screen.getByTestId('quiz-editor-import'));
    await screen.findByTestId('quiz-import-error');
    expect(screen.queryByTestId('quiz-import-preview')).toBeNull();
  });
  test('a file that would pass the 200 question limit cannot be added', async () => {
    const rows = Array.from({ length: 200 }, (_, i) => `Q${i},1,2,3,4,A`);
    file(['question,A,B,C,D,correct', ...rows].join('\n'));
    openQuestions();
    fireEvent.press(screen.getByTestId('quiz-editor-import'));
    await screen.findByTestId('quiz-import-over-limit');
    expect(screen.getByTestId('quiz-import-confirm')).toBeDisabled();
  });
});

test('session picker scrolls long lists and locked config is not shown as an error', () => {
  const view = open(
    <QuizListScreen {...props('MentorQuizzes', { classId: 'c1' })} />
  );
  fireEvent.press(screen.getByTestId('quiz-list-create'));
  expect(screen.getByTestId('quiz-list-session-scroll')).toBeTruthy();
  view.unmount();
  open(
    <QuizEditorScreen
      {...props('QuizEditor', { classId: 'c1', sessionId: 's1' })}
    />
  );
  expect(screen.getByTestId('quiz-editor-locked-config')).not.toHaveProp(
    'accessibilityRole',
    'alert'
  );
});

test('closed quiz is read-only and the editor protects unsaved Back', () => {
  const view = open(
    <QuizDetailScreen
      {...props('QuizDetail', {
        classId: 'c1',
        assignmentId: 'mock-quiz-draft',
      })}
    />,
    quizFixtures,
    'closed'
  );
  expect(screen.getByTestId('quiz-detail-closed')).toBeTruthy();
  expect(screen.queryByTestId('quiz-detail-publish')).toBeNull();
  view.unmount();
  open(
    <QuizEditorScreen
      {...props('QuizEditor', { classId: 'c1', sessionId: 's1' })}
    />
  );
  fireEvent.changeText(screen.getByTestId('quiz-editor-title'), 'Unsaved');
  fireEvent.press(screen.getByTestId('quiz-editor-back'));
  expect(screen.getByTestId('quiz-leave-dialog')).toBeTruthy();
  expect(goBack).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId('quiz-leave-stay'));
  expect(screen.getByTestId('quiz-editor-title')).toHaveProp(
    'value',
    'Unsaved'
  );
});
