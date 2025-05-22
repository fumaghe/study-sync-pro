
import { Exam, StudyDay } from '@/types';

// Colors for exam badges
const EXAM_COLORS = [
  '#9b87f5', // Primary purple
  '#7E69AB', // Secondary purple
  '#3498db', // Blue
  '#2ecc71', // Green
  '#e74c3c', // Red
  '#f39c12', // Orange
  '#1abc9c', // Turquoise
  '#9b59b6', // Violet
];

/**
 * Generates a random color for exam badges
 */
export const generateExamColor = (): string => {
  return EXAM_COLORS[Math.floor(Math.random() * EXAM_COLORS.length)];
};

/**
 * Hook providing utilities for exam-related operations
 */
export const useExamUtils = (studyDays: StudyDay[]) => {
  /**
   * Gets all completed units for an exam based on completed study days
   */
  const getCompletedUnits = (examId: string): Set<number> => {
    const completedUnits = new Set<number>();
    
    // Look through all completed days for this exam
    studyDays.forEach(day => {
      day.exams.forEach(examDay => {
        if (examDay.examId === examId && examDay.completed) {
          // Add all chapters/pages that were completed
          examDay.chapters.forEach(unit => completedUnits.add(unit));
        }
      });
    });
    
    return completedUnits;
  };

  /**
   * Calculates the optimal distribution of units (chapters/pages) per day
   * based on exam difficulty and time available
   */
  const calculateUnitsPerDay = (
    exam: Exam, 
    totalDays: number, 
    availableHoursPerDay: number
  ): number => {
    const totalUnits = exam.usePages ? (exam.pages || 0) : exam.chapters;
    const timePerUnit = exam.usePages 
      ? 1 / (exam.timePerUnit || 20) // Convert pages/hour to hours/page
      : exam.timePerUnit || 1; // Default: 1h/chapter
    
    const unitsPerDay = Math.min(
      Math.ceil(totalUnits / totalDays),
      Math.floor(availableHoursPerDay / timePerUnit)
    );
    
    return Math.max(1, unitsPerDay); // Ensure at least 1 unit per day
  };
  
  /**
   * Calculates the priority score for an exam
   * Higher score means higher priority for study allocation
   */
  const calculatePriorityScore = (exam: Exam): number => {
    const dateScore = new Date(exam.date).getTime();
    const priorityMultiplier = exam.priority === 'high' ? 3 : exam.priority === 'medium' ? 2 : 1;
    const difficultyScore = exam.initialLevel * 100;
    
    return dateScore - (priorityMultiplier * 86400000) - difficultyScore;
  };

  return {
    getCompletedUnits,
    calculateUnitsPerDay,
    calculatePriorityScore,
  };
};
