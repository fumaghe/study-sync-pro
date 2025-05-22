
export type Priority = 'low' | 'medium' | 'high';

export interface Exam {
  id: string;
  name: string;
  date: string;
  startStudyDate?: string;
  usePages: boolean;
  chapters: number;
  pages?: number;
  timePerUnit: number;
  initialLevel: number;
  priority: Priority;
  color: string;
  customReviewDays?: number;
}

export interface StudyDayExam {
  examId: string;
  chapters: number[];
  plannedHours: number;
  actualHours: number;
  completed: boolean;
  isReview?: boolean;
  manuallyAssigned?: boolean; // Flag to mark manually assigned sessions
}

export interface StudyDay {
  date: string;
  available: boolean;
  availableHours: number;
  exams: StudyDayExam[];
  customModified?: boolean; // Flag to indicate user manually modified this day
}

export interface StudySession {
  id: string;
  examId: string;
  date: string;
  duration: number;
  completed: boolean;
  chapters: number[];
  notes?: string; // Added notes as optional property
}

export interface Settings {
  pomodoroWork: number;
  pomodoroBreak: number;
  defaultDailyHours: number;
  reviewDays: number;
  notifications: boolean;
  darkMode: boolean;
}
