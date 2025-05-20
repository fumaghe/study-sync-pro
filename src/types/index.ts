
export type Priority = 'low' | 'medium' | 'high';

export interface Exam {
  id: string;
  name: string;
  date: string; // ISO string format
  chapters: number;
  pages?: number; // For page-based study
  usePages?: boolean; // Flag to switch between chapters and pages
  timePerUnit?: number; // Hours per chapter or pages per hour
  initialLevel: number; // 1-5
  priority: Priority;
  color?: string;
  customReviewDays?: number; // Optional custom review days per exam
}

export interface StudyDay {
  date: string; // ISO string format
  available: boolean;
  availableHours: number;
  exams: StudyDayExam[];
}

export interface StudyDayExam {
  examId: string;
  chapters: number[]; // Also represents page numbers in page-based mode
  plannedHours: number;
  actualHours: number;
  completed: boolean;
  isReview?: boolean; // Flag for review days
}

export interface StudySession {
  id: string;
  examId: string;
  date: string; // ISO string format
  duration: number; // in minutes
  chapters: number[]; // Also represents page numbers in page-based mode
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
