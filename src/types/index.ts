
export type Priority = 'low' | 'medium' | 'high';

export interface Exam {
  id: string;
  name: string;
  date: string; // ISO string format
  chapters: number;
  initialLevel: number; // 1-5
  priority: Priority;
  color?: string;
}

export interface StudyDay {
  date: string; // ISO string format
  available: boolean;
  availableHours: number;
  exams: StudyDayExam[];
}

export interface StudyDayExam {
  examId: string;
  chapters: number[];
  plannedHours: number;
  actualHours: number;
  completed: boolean;
}

export interface StudySession {
  id: string;
  examId: string;
  date: string; // ISO string format
  duration: number; // in minutes
  chapters: number[];
  notes?: string;
}

export interface Settings {
  pomodoroWork: number; // in minutes
  pomodoroBreak: number; // in minutes
  defaultDailyHours: number;
  reviewDays: number; // days before exam dedicated to review
  notifications: boolean;
  darkMode: boolean;
}
