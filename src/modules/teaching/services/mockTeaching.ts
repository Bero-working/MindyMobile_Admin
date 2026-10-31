import type {
  Scenario,
  TeachingClass,
  TeachingSession,
  TeachingStudent,
  TeachingSource,
  TeachingData,
} from '../types';
import { addDays, vietnamDate } from '../format';
export function createTeachingMock(
  scenario: Scenario = 'success'
): TeachingSource {
  const today = vietnamDate();
  const base: TeachingClass = {
    id: 'primary',
    name: 'IELTS Foundation K12',
    code: 'IF-K12',
    status: 'IN_PROGRESS',
    scope: 'CLASS',
    assignment: 'PRIMARY',
    mentor: 'Trần Thị Linh',
    startDate: '2026-10-01',
    endDate: '2027-01-30',
    deliveryMode: 'OFFLINE',
    availableSeats: 4,
    maxStudents: 20,
    course: 'IELTS-F · IELTS Foundation',
    readClassRoster: true,
    unitCount: 4,
    sessionCount: 5,
    currentUnit: 2,
    elapsedSessions: 2,
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    scheduleDays: [0, 2, 4],
    scheduleTime: '18:30',
    room: 'Phòng 302',
    nextSessionAt: `${today}T18:30:00+07:00`,
    enrollmentCounts: {
      ACTIVE: 14,
      PENDING_PAYMENT: 2,
      COMPLETED: 0,
      CANCELLED: 1,
    },
  };
  const classes: TeachingClass[] = [
    base,
    {
      ...base,
      id: 'substitute',
      name: 'Giao tiếp B1 · Lớp 07',
      code: 'GTB1-07',
      scope: 'SESSION',
      assignment: 'SUBSTITUTE',
      mentor: 'Lê Văn Phúc',
      deliveryMode: 'ONLINE',
      readClassRoster: false,
      unitCount: 1,
      sessionCount: 1,
      currentUnit: 1,
      room: null,
    },
    ...(['OPEN', 'COMPLETED', 'CANCELLED', 'DRAFT'] as const).map(
      (status, i) => ({
        ...base,
        id: status.toLowerCase(),
        name: `English ${i + 1}`,
        code: `ENG-${i + 1}`,
        status,
        currentUnit:
          status === 'COMPLETED' ? base.unitCount : status === 'OPEN' ? 0 : 1,
        nextSessionAt: null,
      })
    ),
  ];
  const session: TeachingSession = {
    id: 'today-primary',
    classId: 'primary',
    unitId: 'unit-1',
    title: 'Buổi 8: Line graphs',
    startsAt: `${today}T18:30:00+07:00`,
    endsAt: `${today}T20:00:00+07:00`,
    status: 'IN_PROGRESS',
    assignment: 'PRIMARY',
    readSessionContext: true,
    effectiveMentor: 'Trần Thị Linh',
    effectiveMentorId: 'mock-mentor-a',
    primaryMentor: 'Trần Thị Linh',
    room: 'Phòng 302',
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    version: 3,
    makeup: false,
    actualStart: null,
    actualEnd: null,
  };
  const sessions: TeachingSession[] = [
    session,
    {
      ...session,
      id: 'today-substitute',
      classId: 'substitute',
      status: 'SCHEDULED',
      assignment: 'SUBSTITUTE',
      effectiveMentor: 'Trần Thị Linh',
      primaryMentor: 'Lê Văn Phúc',
      room: null,
    },
    {
      ...session,
      id: 'next-primary',
      unitId: 'unit-2',
      title: 'Buổi 10: Bar charts',
      status: 'SCHEDULED',
      startsAt: `${addDays(today, 2)}T18:30:00+07:00`,
      endsAt: `${addDays(today, 2)}T20:00:00+07:00`,
    },
    {
      ...session,
      id: 'past-primary',
      title: 'Buổi 7: Describing trends',
      status: 'COMPLETED',
      startsAt: `${addDays(today, -2)}T18:30:00+07:00`,
      endsAt: `${addDays(today, -2)}T20:00:00+07:00`,
      actualStart: `${addDays(today, -2)}T18:32:00+07:00`,
      actualEnd: `${addDays(today, -2)}T20:01:00+07:00`,
    },
    {
      ...session,
      id: 'assigned-other',
      title: 'Buổi 9: Pronunciation',
      status: 'SCHEDULED',
      startsAt: `${addDays(today, 1)}T18:30:00+07:00`,
      endsAt: `${addDays(today, 1)}T20:00:00+07:00`,
      readSessionContext: false,
      effectiveMentor: 'Lê Văn Phúc',
    },
    {
      ...session,
      id: 'legacy',
      title: 'Buổi 1: Getting started',
      status: 'COMPLETED',
      startsAt: `${addDays(today, -21)}T18:30:00+07:00`,
      endsAt: `${addDays(today, -21)}T20:00:00+07:00`,
      effectiveMentor: null,
      readSessionContext: false,
      meetingUrl: null,
      actualStart: `${addDays(today, -21)}T18:30:00+07:00`,
      actualEnd: `${addDays(today, -21)}T20:00:00+07:00`,
    },
    {
      ...session,
      id: 'cancelled-session',
      classId: 'cancelled',
      title: 'Buổi đã hủy',
      status: 'CANCELLED',
      effectiveMentor: null,
      readSessionContext: false,
      meetingUrl: null,
    },
  ];
  const students: TeachingStudent[] = [
    {
      id: 'enrollment-1',
      name: 'Ngô Bảo Ngọc',
      enrollment: 'ACTIVE',
      order: 'PAID',
      method: 'CASH',
      paidAt: '2026-10-28T08:00:00Z',
      expiresAt: null,
      email: 'ngoc@example.test',
      phone: '0900000001',
      studentStatus: 'ACTIVE',
      admission: 'REGULAR',
    },
    {
      id: 'enrollment-2',
      name: 'Châu Minh Khoa',
      enrollment: 'PENDING_PAYMENT',
      order: 'PENDING',
      method: 'CASH',
      paidAt: null,
      expiresAt: '2026-11-02T11:00:00Z',
      email: 'khoa@example.test',
      phone: null,
      studentStatus: 'PENDING_VERIFICATION',
      admission: 'MAKEUP',
    },
  ];
  return {
    async read(request) {
      if (scenario === 'loading') return new Promise(() => {});
      if (['offline', 'error', 'denied', 'notFound'].includes(scenario))
        return {
          kind: scenario as 'offline' | 'error' | 'denied' | 'notFound',
          ...(scenario === 'error' ? { requestId: 'mock-p1' } : {}),
        };
      if (
        scenario === 'studentsError' &&
        ['students', 'sessionStudents'].includes(request.kind)
      )
        return { kind: 'error' };
      if (
        scenario === 'unitError' &&
        request.kind === 'sessions' &&
        request.unitId
      )
        return { kind: 'error' };
      if (scenario === 'unavailable' && request.kind === 'sessionStudents')
        return { kind: 'unavailable' };
      const data: TeachingData = {
        classes: [],
        sessions: [],
        students: [],
        units: [],
        total: 0,
      };
      const found = classes.find((c) => c.id === request.classId);
      const info =
        found && scenario === 'noRoster'
          ? { ...found, readClassRoster: false }
          : found;
      const context = sessions.find((s) => s.id === request.sessionId);
      if (request.kind === 'classes') {
        data.classes = classes.filter(
          (c) =>
            (request.role === 'MANAGER' || c.status !== 'DRAFT') &&
            (!request.status || c.status === request.status) &&
            (!request.q ||
              `${c.name} ${c.code}`
                .toLowerCase()
                .includes(request.q.trim().toLowerCase()))
        );
        if (request.role === 'MENTOR' && !request.includeCardDetails)
          data.classes = data.classes.map((item) => ({
            ...item,
            currentUnit: null,
            elapsedSessions: null,
            sessionCount: null,
          }));
      } else if (request.kind === 'schedule')
        data.sessions = sessions.filter(
          (s) =>
            s.readSessionContext &&
            (!request.from ||
              Date.parse(s.startsAt) >= Date.parse(request.from)) &&
            (!request.to || Date.parse(s.startsAt) < Date.parse(request.to))
        );
      else if (
        request.kind === 'context' ||
        request.kind === 'sessionStudents'
      ) {
        if (!context) return { kind: 'notFound' };
        if (request.role === 'MENTOR' && !context.readSessionContext)
          return { kind: 'denied' };
        data.session = context;
        if (
          request.kind === 'sessionStudents' &&
          context.status !== 'CANCELLED'
        )
          data.students = students;
      } else {
        if (!info) return { kind: 'notFound' };
        data.classInfo = info;
        if (request.kind === 'students') {
          if (request.role === 'MENTOR' && !info.readClassRoster)
            return { kind: 'denied' };
          data.students = students.filter(
            (s) => !request.status || s.order === request.status
          );
        }
        if (request.kind === 'units' && info.status !== 'CANCELLED')
          data.units = Array.from({ length: info.unitCount ?? 0 }, (_, i) => ({
            id: `unit-${i + 1}`,
            position: i + 1,
            title:
              ['Introduction', 'Line graphs', 'Bar charts', 'Review'][i] ??
              'Review',
          }));
        if (request.kind === 'sessions')
          data.sessions = sessions.filter(
            (s) =>
              s.classId === info.id &&
              (!request.unitId || s.unitId === request.unitId)
          );
      }
      if (scenario === 'empty') {
        data.classes = [];
        data.sessions = [];
        data.students = [];
        data.units = [];
      }
      const field =
        request.kind === 'classes'
          ? 'classes'
          : request.kind === 'students' || request.kind === 'sessionStudents'
            ? 'students'
            : request.kind === 'units'
              ? 'units'
              : 'sessions';
      data.total = data[field].length;
      const offset = ((request.page ?? 1) - 1) * (request.pageSize ?? 20);
      const end = offset + (request.pageSize ?? 20);
      if (field === 'classes') data.classes = data.classes.slice(offset, end);
      else if (field === 'sessions')
        data.sessions = data.sessions.slice(offset, end);
      else if (field === 'students')
        data.students = data.students.slice(offset, end);
      else data.units = data.units.slice(offset, end);
      return { kind: 'success', data };
    },
  };
}
