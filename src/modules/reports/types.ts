import type { DateRange } from './model';

export type ReportsStackParams = {
  MentorReportClasses: undefined;
  MentorAttendanceReport: { classId: string; classTitle?: string };
  MentorStudentReport: {
    classId: string;
    studentId: string;
    classTitle?: string;
    studentName?: string;
    range?: DateRange;
    tab?: 'history' | 'progress';
  };
  ManagerAttendanceReport: { classId: string; classTitle?: string };
};
