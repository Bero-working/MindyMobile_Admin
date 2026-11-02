import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { metadataOf, validateMetadata, validateQuestions } from './model';
import {
  createQuizService,
  QuizError,
  type QuizService,
  type ListQuery,
  type QuizPageData,
} from './service';
import { mergeMetadata } from './model';
import { useNetInfo } from '@react-native-community/netinfo';
import type { Metadata, Question, Quiz, Scenario } from './types';

export const quizFixtures: Quiz[] = [
  {
    id: 'mock-quiz-draft',
    sessionId: 'mock-session-1',
    title: 'Kiểm tra Unit 8',
    description: 'Ôn tập nội dung buổi học.',
    purpose: 'TEST',
    maxScore: '10.00',
    dueAt: null,
    timeLimitMinutes: 30,
    status: 'DRAFT',
    revision: 1,
    publishedAt: null,
    questions: [
      {
        key: 'mock-question-1',
        id: 'mock-question-1',
        prompt: 'Which option describes the highest growth?',
        options: [
          { label: 'A', text: 'Line A' },
          { label: 'B', text: 'Line B' },
          { label: 'C', text: 'Line C' },
          { label: 'D', text: 'Line D' },
        ],
        correctOption: 'B',
      },
    ],
  },
  {
    id: 'mock-quiz-published',
    sessionId: 'mock-session-1',
    title: 'Từ vựng Unit 7',
    description: '',
    purpose: 'HOMEWORK',
    maxScore: '7.50',
    dueAt: null,
    timeLimitMinutes: null,
    status: 'PUBLISHED',
    revision: 2,
    publishedAt: '2026-11-02T08:00:00Z',
    questions: [],
  },
  {
    id: 'mock-quiz-archived',
    sessionId: 'mock-session-2',
    title: 'Ôn tập Unit 6',
    description: '',
    purpose: 'TEST',
    maxScore: '10.00',
    dueAt: null,
    timeLimitMinutes: 20,
    status: 'ARCHIVED',
    revision: 3,
    publishedAt: '2026-11-01T08:00:00Z',
    questions: [],
  },
];
export type MockCommand =
  | { kind: 'create'; sessionId: string; metadata: Metadata }
  | { kind: 'metadata'; id: string; revision: number; metadata: Metadata }
  | { kind: 'questions'; id: string; revision: number; questions: Question[] }
  | {
      kind: 'publish' | 'archive' | 'delete';
      id: string;
      revision: number;
      reason?: string;
    };
export type MockResult =
  | { kind: 'success'; quiz?: Quiz }
  | { kind: 'uncertain'; code: string; requestId?: string }
  | { kind: 'error'; code: string; requestId?: string };
type QuizContext = {
  mock: boolean;
  api: QuizService | undefined;
  revision: number;
  fetchDetail: (id: string) => Promise<Quiz>;
  fetchList: (query: ListQuery) => Promise<QuizPageData>;
  items: Quiz[];
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
  execute: (command: MockCommand) => Promise<MockResult>;
  read: (id: string) => Quiz | undefined;
  clear: () => void;
};
const Context = createContext<QuizContext | null>(null);
function MockQuizProvider({
  children,
  initialItems = quizFixtures,
  initialScenario = 'success',
}: PropsWithChildren<{ initialItems?: Quiz[]; initialScenario?: Scenario }>) {
  // Deliberate UI review fixture boundary. No HTTP, storage or production API fallback.
  const [items, setItems] = useState<Quiz[]>(
    () => JSON.parse(JSON.stringify(initialItems)) as Quiz[]
  );
  const current = useRef(items);
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const network = useNetInfo();
  const effectiveScenario =
    network.isConnected === false || network.isInternetReachable === false
      ? 'offline'
      : scenario;
  const locked = useRef(false),
    sequence = useRef(0),
    injected = useRef<Scenario | undefined>(undefined);
  const clear = () => {
    current.current = [];
    setItems([]);
  };
  const execute = async (command: MockCommand): Promise<MockResult> => {
    if (locked.current) return { kind: 'error', code: 'busy' };
    if (['offline', 'denied', 'closed'].includes(effectiveScenario))
      return { kind: 'error', code: effectiveScenario };
    locked.current = true;
    try {
      await Promise.resolve();
      if (scenario === 'error') return { kind: 'error', code: 'error' };
      if (scenario === 'conflict' && injected.current !== scenario) {
        injected.current = scenario;
        return { kind: 'error', code: 'conflict' };
      }
      let next: Quiz | undefined;
      if (command.kind === 'create') {
        if (Object.keys(validateMetadata(command.metadata, true)).length)
          return { kind: 'error', code: 'invalidMetadata' };
        next = {
          id: `mock-created-${++sequence.current}`,
          sessionId: command.sessionId,
          title: command.metadata.title.trim(),
          description: command.metadata.description,
          purpose:
            command.metadata.purpose === 'HOMEWORK' ? 'HOMEWORK' : 'TEST',
          maxScore: command.metadata.maxScore.replace(',', '.'),
          dueAt: command.metadata.dueAt || null,
          timeLimitMinutes: command.metadata.timeLimit
            ? Number(command.metadata.timeLimit)
            : null,
          status: 'DRAFT',
          revision: 1,
          publishedAt: null,
          questions: [],
        };
      } else {
        const old = current.current.find((q) => q.id === command.id);
        if (!old) return { kind: 'error', code: 'notFound' };
        if (old.revision !== command.revision)
          return { kind: 'error', code: 'conflict' };
        if (command.kind !== 'archive' && old.status !== 'DRAFT')
          return { kind: 'error', code: 'frozen' };
        next = { ...old, revision: old.revision + 1 };
        if (command.kind === 'metadata') {
          if (Object.keys(validateMetadata(command.metadata, false)).length)
            return { kind: 'error', code: 'invalidMetadata' };
          const m = command.metadata;
          next = {
            ...next,
            title: m.title.trim(),
            description: m.description,
            dueAt: m.dueAt || null,
            timeLimitMinutes: m.timeLimit ? Number(m.timeLimit) : null,
          };
        } else if (command.kind === 'questions') {
          const invalid = validateQuestions(command.questions);
          if (invalid) return { kind: 'error', code: invalid };
          next = {
            ...next,
            questions: command.questions.map((q) => ({
              ...q,
              id: q.id ?? `mock-generated-question-${++sequence.current}`,
            })),
          };
        } else if (command.kind === 'publish') {
          if (!old.questions?.length) return { kind: 'error', code: 'needOne' };
          if (old.dueAt && Date.parse(old.dueAt) <= Date.now())
            return { kind: 'error', code: 'duePast' };
          next = {
            ...next,
            status: 'PUBLISHED',
            publishedAt: new Date().toISOString(),
          };
        } else if (command.kind === 'archive') {
          if (old.status !== 'PUBLISHED')
            return { kind: 'error', code: 'stateConflict' };
          if (!command.reason?.trim() || command.reason.trim().length > 2000)
            return { kind: 'error', code: 'reasonRequired' };
          next = { ...next, status: 'ARCHIVED' };
        }
      }
      const updated =
        command.kind === 'delete'
          ? current.current.filter((q) => q.id !== command.id)
          : command.kind === 'create'
            ? [next, ...current.current]
            : current.current.map((q) => (q.id === next.id ? next : q));
      current.current = updated;
      setItems(updated);
      if (scenario === 'uncertain' && injected.current !== scenario) {
        injected.current = scenario;
        return { kind: 'uncertain', code: 'uncertain' };
      }
      return {
        kind: 'success',
        ...(command.kind === 'delete' ? {} : { quiz: next }),
      };
    } finally {
      locked.current = false;
    }
  };
  return (
    <Context.Provider
      value={{
        mock: true,
        api: undefined,
        revision: 0,
        fetchDetail: async (id) => {
          const item = current.current.find((q) => q.id === id);
          if (!item) throw new QuizError('notFound');
          return item;
        },
        fetchList: async (query) => {
          const rows = current.current.filter(
            (q) =>
              (!query.sessionId || q.sessionId === query.sessionId) &&
              (!query.status || q.status === query.status)
          );
          return { items: rows, total: rows.length, page: 1, pageSize: 20 };
        },
        items,
        scenario: effectiveScenario,
        setScenario: (s) => {
          injected.current = undefined;
          setScenario(s);
          if (s === 'denied' || s === 'notFound') clear();
        },
        execute,
        read: (id) => current.current.find((q) => q.id === id),
        clear,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useQuiz() {
  const context = useContext(Context);
  if (!context) throw new Error('QuizProvider required');
  return context;
}
export { metadataOf };

const fallbackService = createQuizService();
function LiveQuizProvider({
  children,
  api,
}: PropsWithChildren<{ api: QuizService }>) {
  const [items, setItems] = useState<Quiz[]>([]);
  const current = useRef(items);
  const [revision, setRevision] = useState(0);
  const network = useNetInfo();
  const locked = useRef(false);
  const value = useMemo<QuizContext>(() => {
    const clear = () => {
      current.current = [];
      setItems([]);
    };
    const save = (quiz: Quiz) => {
      const previous = current.current.find((q) => q.id === quiz.id);
      if (previous && previous.revision > quiz.revision) return previous;
      const merged = previous ? mergeMetadata(previous, quiz) : quiz;
      current.current = [
        ...current.current.filter((q) => q.id !== quiz.id),
        merged,
      ];
      setItems(current.current);
      return merged;
    };
    const fetchDetail = async (id: string) => {
      try {
        const quiz = await api.detail(id);
        if (quiz.id !== id) throw new QuizError('error', 'INVALID_RESPONSE');
        return save(quiz);
      } catch (e) {
        if (e instanceof QuizError && ['denied', 'notFound'].includes(e.kind))
          clear();
        throw e;
      }
    };
    const fetchList = async (query: ListQuery) => {
      try {
        return await api.list(query);
      } catch (e) {
        if (e instanceof QuizError && e.kind === 'denied') clear();
        throw e;
      }
    };
    return {
      mock: false,
      api,
      items: [],
      revision: 0,
      scenario: 'success',
      setScenario: () => {},
      clear,
      read: (id) => current.current.find((q) => q.id === id),
      fetchDetail,
      fetchList,
      execute: async (command) => {
        if (locked.current) return { kind: 'error', code: 'busy' };
        locked.current = true;
        try {
          const previous =
            command.kind === 'create'
              ? undefined
              : current.current.find((q) => q.id === command.id);
          const result = await api.command(command, previous);
          if (result) save(result);
          else if (command.kind === 'delete') {
            current.current = current.current.filter(
              (q) => q.id !== command.id
            );
            setItems(current.current);
          }
          setRevision((r) => r + 1);
          return {
            kind: 'success',
            ...(result
              ? { quiz: previous ? mergeMetadata(previous, result) : result }
              : {}),
          };
        } catch (e) {
          const error = e instanceof QuizError ? e : new QuizError('uncertain');
          if (error.kind === 'denied' || error.kind === 'notFound') clear();
          if (error.kind === 'uncertain')
            return {
              kind: 'uncertain',
              code: error.code,
              requestId: error.requestId,
            };
          const codes: Record<string, string> = {
            ASSIGNMENT_CONTENT_FROZEN: 'frozen',
            ASSIGNMENT_CLOSED: 'closed',
            ASSIGNMENT_STATE_CONFLICT: 'stateConflict',
            QUIZ_QUESTIONS_REQUIRED: 'needOne',
            INVALID_ASSIGNMENT_DEADLINE: 'duePast',
            INVALID_ASSIGNMENT_CONFIG: 'invalidMetadata',
            INVALID_QUIZ_QUESTIONS: 'invalidQuestions',
          };
          return {
            kind: 'error',
            code:
              error.kind === 'conflict'
                ? 'conflict'
                : (codes[error.code] ??
                  (error.kind === 'error' ? 'error' : error.kind)),
            requestId: error.requestId,
          };
        } finally {
          locked.current = false;
        }
      },
    };
  }, [api]);
  return (
    <Context.Provider
      value={{
        ...value,
        items,
        revision,
        scenario:
          network.isConnected === false || network.isInternetReachable === false
            ? 'offline'
            : 'success',
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function QuizProvider({
  children,
  api,
  mock = api === undefined,
  initialItems,
  initialScenario,
}: PropsWithChildren<{
  api?: QuizService;
  mock?: boolean;
  initialItems?: Quiz[];
  initialScenario?: Scenario;
}>) {
  if (mock)
    return (
      <MockQuizProvider
        {...(initialItems ? { initialItems } : {})}
        {...(initialScenario ? { initialScenario } : {})}
      >
        {children}
      </MockQuizProvider>
    );
  return (
    <LiveQuizProvider api={api ?? fallbackService}>{children}</LiveQuizProvider>
  );
}
