import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { MindyThemeProvider } from '@/components/ui/theme';
import { QuizProvider, quizFixtures } from '@/modules/quiz/QuizProvider';
import { QuizDetailScreen } from '@/modules/quiz/QuizDetailScreen';
import { QuizListScreen } from '@/modules/quiz/QuizListScreen';
import { QuizEditorScreen } from '@/modules/quiz/QuizEditorScreen';
import {
  createQuizService,
  QuizError,
  type QuizPageData,
} from '@/modules/quiz/service';
import type { Quiz } from '@/modules/quiz/types';
import i18n from '@/translations';
const navigate = jest.fn(),
  goBack = jest.fn(),
  replace = jest.fn();
const mockNotify = jest.fn();
jest.mock('@/modules/quiz/importFile', () => ({
  pickQuestionFile: jest.fn(),
  QuizImportError: class extends Error {},
}));
jest.mock('@/modules/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    state: { user: { id: 'm1', role: 'MENTOR' } },
    notify: mockNotify,
  }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ dispatch: jest.fn(), addListener: () => () => {} }),
  usePreventRemove: jest.fn(),
}));
jest.mock('@/modules/teaching/hooks/useTeachingQuery', () => ({
  useTeachingQuery: () => ({
    data: {
      classInfo: { id: 'c1', status: 'IN_PROGRESS' },
      session: { id: 's1', classId: 'c1', status: 'SCHEDULED' },
      sessions: [],
      total: 0,
    },
  }),
}));
function props<K extends keyof AuthStackParams>(
  name: K,
  params: AuthStackParams[K]
) {
  const value = {} as NativeStackScreenProps<AuthStackParams, K>;
  Object.assign(value, {
    route: { key: name, name, params },
    navigation: { navigate, goBack, replace },
  });
  return value;
}
function open(child: React.ReactNode) {
  const api = createQuizService();
  const initial: Quiz = { ...quizFixtures[0]!, sessionId: 's1' };
  const detail = jest.spyOn(api, 'detail').mockResolvedValue(initial);
  const list = jest
    .spyOn(api, 'list')
    .mockResolvedValue({ items: [initial], total: 1, page: 1, pageSize: 20 });
  const command = jest
    .spyOn(api, 'command')
    .mockResolvedValue({ ...initial, revision: 2, status: 'PUBLISHED' });
  const view = render(
    <MindyThemeProvider>
      <QuizProvider
        api={api}
        mock={false}
      >
        {child}
      </QuizProvider>
    </MindyThemeProvider>
  );
  return { api, initial, detail, list, command, view };
}
beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('vi');
});
test('live detail fetches private questions and publish refetches server data without a mock badge', async () => {
  const { detail, command, initial } = open(
    <QuizDetailScreen
      {...props('QuizDetail', {
        classId: 'c1',
        assignmentId: 'mock-quiz-draft',
      })}
    />
  );
  await screen.findByTestId('quiz-detail-publish');
  expect(screen.queryByTestId('quiz-mock-badge')).toBeNull();
  expect(detail).toHaveBeenCalledWith(initial.id);
  detail.mockResolvedValue({ ...initial, revision: 2, status: 'PUBLISHED' });
  fireEvent.press(screen.getByTestId('quiz-detail-publish'));
  fireEvent.press(screen.getByTestId('quiz-detail-publish-confirm'));
  await screen.findByTestId('quiz-detail-archive');
  expect(command).toHaveBeenCalledTimes(1);
  expect(command).toHaveBeenCalledWith(
    { kind: 'publish', id: initial.id, revision: 1 },
    expect.objectContaining({ id: initial.id })
  );
  expect(
    screen.queryByTestId('quiz-detail-correct-mock-question-1')
  ).toBeNull();
});
test('filter change hides the previous rows while pending and denied clears private content', async () => {
  const { list, initial } = open(
    <QuizListScreen {...props('MentorQuizzes', { classId: 'c1' })} />
  );
  await screen.findByTestId('quiz-list-row-mock-quiz-draft');
  let resolvePage: (p: QuizPageData) => void = () => {};
  list.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolvePage = resolve;
      })
  );
  fireEvent.press(screen.getByTestId('quiz-list-filter-PUBLISHED'));
  expect(screen.queryByTestId('quiz-list-row-mock-quiz-draft')).toBeNull();
  expect(screen.getByTestId('quiz-list-skeleton')).toBeTruthy();
  await act(async () =>
    resolvePage({
      items: [{ ...initial, status: 'PUBLISHED' }],
      total: 1,
      page: 1,
      pageSize: 20,
    })
  );
  await screen.findByTestId('quiz-list-row-mock-quiz-draft');
  list.mockRejectedValueOnce(
    new QuizError('denied', 'ASSIGNMENT_SCOPE_REQUIRED')
  );
  fireEvent.press(screen.getByTestId('quiz-list-filter-DRAFT'));
  await screen.findByTestId('quiz-list-denied');
  expect(screen.queryByTestId('quiz-list-row-mock-quiz-draft')).toBeNull();
});
test('live editor hydrates async detail; metadata response without questions preserves question tab', async () => {
  const { command, initial } = open(
    <QuizEditorScreen
      {...props('QuizEditor', {
        classId: 'c1',
        sessionId: 's1',
        assignmentId: 'mock-quiz-draft',
      })}
    />
  );
  await screen.findByTestId('quiz-editor-title');
  expect(screen.getByTestId('quiz-editor-title')).toHaveProp(
    'value',
    initial.title
  );
  const metadata = { ...initial, title: 'Server saved title', revision: 2 };
  delete metadata.questions;
  command.mockResolvedValueOnce(metadata);
  fireEvent.changeText(
    screen.getByTestId('quiz-editor-title'),
    'Server saved title'
  );
  fireEvent.press(screen.getByTestId('quiz-editor-save-info'));
  await waitFor(() => expect(command).toHaveBeenCalledTimes(1));
  await waitFor(() =>
    expect(screen.getByTestId('quiz-editor-save-info')).toBeDisabled()
  );
  fireEvent.press(screen.getByTestId('quiz-editor-tab-questions'));
  expect(
    screen.getByTestId('quiz-editor-question-mock-question-1')
  ).toBeTruthy();
});
test('uncertain publish is reconciled by GET without another POST', async () => {
  const { command, detail, initial } = open(
    <QuizDetailScreen
      {...props('QuizDetail', {
        classId: 'c1',
        assignmentId: 'mock-quiz-draft',
      })}
    />
  );
  await screen.findByTestId('quiz-detail-publish');
  command.mockRejectedValueOnce(new QuizError('uncertain'));
  fireEvent.press(screen.getByTestId('quiz-detail-publish'));
  fireEvent.press(screen.getByTestId('quiz-detail-publish-confirm'));
  await screen.findByTestId('quiz-detail-intent');
  detail.mockResolvedValue({ ...initial, revision: 2, status: 'PUBLISHED' });
  fireEvent.press(screen.getByTestId('quiz-detail-check'));
  await screen.findByTestId('quiz-detail-archive');
  await waitFor(() =>
    expect(screen.queryByTestId('quiz-detail-intent')).toBeNull()
  );
  expect(command).toHaveBeenCalledTimes(1);
});

test('a failed load-more preserves rows and retries the same server page', async () => {
  const { list, initial } = open(
    <QuizListScreen {...props('MentorQuizzes', { classId: 'c1' })} />
  );
  await screen.findByTestId('quiz-list-row-mock-quiz-draft');
  list.mockResolvedValueOnce({
    items: [initial],
    total: 2,
    page: 1,
    pageSize: 20,
  });
  fireEvent.press(screen.getByTestId('quiz-list-filter-DRAFT'));
  await screen.findByTestId('quiz-list-more');
  list.mockRejectedValueOnce(new QuizError('error'));
  fireEvent.press(screen.getByTestId('quiz-list-more'));
  await screen.findByTestId('quiz-list-more-error');
  expect(screen.getByTestId('quiz-list-row-mock-quiz-draft')).toBeTruthy();
  list.mockResolvedValueOnce({
    items: [{ ...initial, id: 'second' }],
    total: 2,
    page: 2,
    pageSize: 20,
  });
  fireEvent.press(screen.getByTestId('quiz-list-more'));
  await screen.findByTestId('quiz-list-row-second');
  const pages = list.mock.calls.filter(([query]) => query.page === 2);
  expect(pages).toHaveLength(2);
  expect(screen.queryByTestId('quiz-list-more')).toBeNull();
});

test('unchanged revision after uncertain write enables only an explicit same-intent resend', async () => {
  const { command, initial, detail } = open(
    <QuizDetailScreen
      {...props('QuizDetail', {
        classId: 'c1',
        assignmentId: 'mock-quiz-draft',
      })}
    />
  );
  await screen.findByTestId('quiz-detail-publish');
  command.mockRejectedValueOnce(new QuizError('uncertain'));
  fireEvent.press(screen.getByTestId('quiz-detail-publish'));
  fireEvent.press(screen.getByTestId('quiz-detail-publish-confirm'));
  await screen.findByTestId('quiz-detail-intent');
  expect(screen.queryByTestId('quiz-detail-resend')).toBeNull();
  fireEvent.press(screen.getByTestId('quiz-detail-check'));
  await screen.findByTestId('quiz-detail-resend');
  expect(command).toHaveBeenCalledTimes(1);
  detail.mockResolvedValue({ ...initial, revision: 2, status: 'PUBLISHED' });
  fireEvent.press(screen.getByTestId('quiz-detail-resend'));
  await waitFor(() => expect(command).toHaveBeenCalledTimes(2), {
    timeout: 5000,
  });
  await waitFor(
    () => expect(screen.queryByTestId('quiz-detail-intent')).toBeNull(),
    { timeout: 5000 }
  );
  expect(command.mock.calls[1]?.[0]).toEqual(command.mock.calls[0]?.[0]);
});

test('scope loss while loading more clears rows instead of retaining an unauthorized list', async () => {
  const { list, initial } = open(
    <QuizListScreen {...props('MentorQuizzes', { classId: 'c1' })} />
  );
  await screen.findByTestId('quiz-list-row-mock-quiz-draft');
  list.mockResolvedValueOnce({
    items: [initial],
    total: 2,
    page: 1,
    pageSize: 20,
  });
  fireEvent.press(screen.getByTestId('quiz-list-filter-DRAFT'));
  await screen.findByTestId('quiz-list-more');
  list.mockRejectedValueOnce(
    new QuizError('denied', 'ASSIGNMENT_SCOPE_REQUIRED')
  );
  fireEvent.press(screen.getByTestId('quiz-list-more'));
  await screen.findByTestId('quiz-list-denied');
  expect(screen.queryByTestId('quiz-list-row-mock-quiz-draft')).toBeNull();
});

test('scope loss during an editor write clears the form and does not rehydrate stale detail', async () => {
  const { command } = open(
    <QuizEditorScreen
      {...props('QuizEditor', {
        classId: 'c1',
        sessionId: 's1',
        assignmentId: 'mock-quiz-draft',
      })}
    />
  );
  await screen.findByTestId('quiz-editor-title');
  command.mockRejectedValueOnce(
    new QuizError('denied', 'ASSIGNMENT_SCOPE_REQUIRED')
  );
  fireEvent.changeText(
    screen.getByTestId('quiz-editor-title'),
    'Private unsaved'
  );
  fireEvent.press(screen.getByTestId('quiz-editor-save-info'));
  await screen.findByTestId('quiz-editor-denied');
  expect(screen.queryByTestId('quiz-editor-title')).toBeNull();
});
