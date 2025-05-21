export type Priority = 'low' | 'medium' | 'high';

export interface Exam {
  id: string;
  name: string;
  date: string;
  startStudyDate?: string; // New field for study start date
  chapters: number;
  pages?: number;
  usePages: boolean;
  timePerUnit: number;
  initialLevel: number;
  priority: Priority;
  customReviewDays?: number;
  color: string;
}

export interface StudyDayExam {
  examId: string;
  chapters: number[];
  plannedHours: number;
  actualHours: number;
  completed: boolean;
  isReview?: boolean;
}

export interface StudyDay {
  date: string;
  available: boolean;
  availableHours: number;
  exams: StudyDayExam[];
}

export interface StudySession {
  id: string;
  examId: string;
  date: string;
  duration: number;
  chapters: number[];
}

export interface Settings {
  pomodoroWork: number;
  pomodoroBreak: number;
  defaultDailyHours: number;
  reviewDays: number;
  notifications: boolean;
  darkMode: boolean;
}
