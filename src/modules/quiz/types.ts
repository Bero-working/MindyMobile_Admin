export type Label = 'A' | 'B' | 'C' | 'D';
export type Purpose = 'TEST' | 'HOMEWORK';
export type QuizStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type Question = {
  key: string;
  id?: string;
  prompt: string;
  options: { label: Label; text: string }[];
  correctOption: Label | null;
};
export type Quiz = {
  id: string;
  sessionId: string;
  title: string;
  description: string;
  purpose: Purpose;
  maxScore: string;
  dueAt: string | null;
  timeLimitMinutes: number | null;
  status: QuizStatus;
  revision: number;
  publishedAt: string | null;
  questions?: Question[];
};
export type Metadata = {
  title: string;
  description: string;
  purpose: Purpose | '';
  maxScore: string;
  dueAt: string;
  timeLimit: string;
};
export type QuizStackParams = {
  MentorQuizzes:
    | {
        classId: string;
        classTitle?: string;
        sessionId?: string;
        sessionTitle?: string;
      }
    | undefined;
  QuizEditor: {
    classId: string;
    sessionId: string;
    sessionTitle?: string;
    assignmentId?: string;
    initialTab?: 'info' | 'questions';
  };
  QuizDetail: { classId: string; assignmentId: string; title?: string };
};
export type Scenario =
  | 'success'
  | 'loading'
  | 'empty'
  | 'offline'
  | 'error'
  | 'refreshError'
  | 'denied'
  | 'notFound'
  | 'conflict'
  | 'uncertain'
  | 'closed';
