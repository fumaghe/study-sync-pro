import { useState } from 'react';
import { Exam, StudyDay, Settings } from '@/types';
import { addDays, differenceInDays, parseISO, format, isAfter, isSameDay, isBefore, isEqual } from 'date-fns';

// Constants
const STUDY_EFFICIENCY = 0.8; // 80% efficiency when studying
const SKIP_DAYS_FACTOR = 0.7; // Skip 70% of extra days when there's more than needed
const SMALL_EXAM_THRESHOLD = 30; // Exams with fewer than 30 units are considered small
const FAR_AWAY_EXAM_DAYS = 30; // Exams more than 30 days away are considered far

interface StudyPlanGeneratorProps {
  exams: Exam[];
  studyDays: StudyDay[];
  settings: Settings;
  getCompletedUnits: (examId: string) => Set<number>;
}

interface RegenerationOptions {
  keepCompletedSessions?: boolean;
}

export function useStudyPlanGenerator({
  exams,
  studyDays,
  settings,
  getCompletedUnits
}: StudyPlanGeneratorProps) {

  /**
   * Distributes remaining units across available days
   */
  const distributeRemainingUnits = (
    availableDays: StudyDay[],
    exam: Exam, 
    remainingUnits: number,
    completedUnits: Set<number>,
    nextUnitToStart: number
  ) => {
    if (availableDays.length === 0 || remainingUnits <= 0) return;
    
    // Calculate time per unit
    let timePerUnit: number;
    if (exam.usePages) {
      timePerUnit = 1 / (exam.timePerUnit || 20); // Convert pages/hour to hours/page
    } else {
      timePerUnit = exam.timePerUnit || 1; // Default: 1h/chapter
    }
    
    // Calculate review days
    const reviewDaysForExam = exam.customReviewDays !== undefined 
      ? exam.customReviewDays 
      : settings.reviewDays;
    
    const reviewStartIndex = Math.max(0, availableDays.length - reviewDaysForExam);
    const studyDaysAvailable = availableDays.slice(0, reviewStartIndex);
    const reviewDays = availableDays.slice(reviewStartIndex);
    
    // Handle special case if no study days available
    if (studyDaysAvailable.length === 0 && reviewDays.length > 0) {
      const daysToConvert = Math.min(Math.ceil(reviewDays.length / 2), reviewDays.length);
      for (let i = 0; i < daysToConvert; i++) {
        studyDaysAvailable.push(reviewDays[i]);
      }
      reviewDays.splice(0, daysToConvert);
    }
    
    // Calculate units per day
    const unitsPerDay = studyDaysAvailable.length > 0
      ? Math.ceil(remainingUnits / studyDaysAvailable.length)
      : 0;
    
    // Distribute units
    let currentRemainingUnits = remainingUnits;
    let currentUnitNumber = nextUnitToStart;
    
    // Prioritize custom modified days
    const sortedDays = [...studyDaysAvailable].sort((a, b) => {
      // First prioritize by custom modification
      if (a.customModified && !b.customModified) return -1;
      if (!a.customModified && b.customModified) return 1;
      
      // Then sort by date
      return parseISO(a.date).getTime() - parseISO(b.date).getTime();
    });
    
    sortedDays.forEach(day => {
      if (currentRemainingUnits <= 0) return;
      
      // Boost units for custom modified days
      const capacityMultiplier = day.customModified ? 1.5 : 1;
      
      const maxUnitsForToday = Math.min(
        Math.ceil(unitsPerDay * capacityMultiplier),
        currentRemainingUnits,
        Math.floor(day.availableHours / timePerUnit * capacityMultiplier)
      );
      
      const todayUnits = Array.from(
        { length: maxUnitsForToday },
        (_, i) => currentUnitNumber + i
      );
      
      const hoursNeeded = Math.max(0.5, maxUnitsForToday * timePerUnit);
      
      const existingExamIndex = day.exams.findIndex(e => e.examId === exam.id);
      
      if (existingExamIndex >= 0) {
        // Update existing entry if this day wasn't completed
        if (!day.exams[existingExamIndex].completed) {
          day.exams[existingExamIndex] = {
            ...day.exams[existingExamIndex],
            chapters: todayUnits,
            plannedHours: hoursNeeded,
            isReview: false
          };
        }
      } else {
        // Add new entry
        day.exams.push({
          examId: exam.id,
          chapters: todayUnits,
          plannedHours: hoursNeeded,
          actualHours: 0,
          completed: false,
          isReview: false
        });
      }
      
      currentUnitNumber += maxUnitsForToday;
      currentRemainingUnits -= maxUnitsForToday;
    });
    
    // Add review days
    reviewDays.forEach(day => {
      const existingExamIndex = day.exams.findIndex(e => e.examId === exam.id);
      
      if (existingExamIndex >= 0) {
        // Update if not completed
        if (!day.exams[existingExamIndex].completed) {
          day.exams[existingExamIndex] = {
            ...day.exams[existingExamIndex],
            chapters: [],
            isReview: true,
            plannedHours: 1
          };
        }
      } else {
        // Add new review day
        day.exams.push({
          examId: exam.id,
          chapters: [],
          plannedHours: 1,
          actualHours: 0,
          completed: false,
          isReview: true
        });
      }
    });
  };

  /**
   * Main function to generate a complete study plan
   */
  const generateStudyPlan = (options?: RegenerationOptions) => {
    // Let's preserve the existing days but modify as needed 
    // based on keepCompletedSessions option
    let existingDays = [...studyDays];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // If we're not keeping completed sessions, reset the days array
    if (!options?.keepCompletedSessions) {
      existingDays = [];
    } else {
      // Filter out any days that don't have completed exams
      // We'll preserve only days with completed status
      existingDays = existingDays.filter(day => 
        day.exams.some(examDay => examDay.completed)
      );
    }

    const furthestExamDate = exams.reduce((maxDate, exam) => {
      const examDate = parseISO(exam.date);
      return isAfter(examDate, maxDate) ? examDate : maxDate;
    }, parseISO(exams[0].date));
    
    // Generate study days from today until furthest exam + 1 day
    const daysToGenerate = differenceInDays(furthestExamDate, today) + 1;
    
    // Initialize study days
    const newStudyDays: StudyDay[] = [];
    for (let i = 0; i <= daysToGenerate; i++) {
      const currentDate = addDays(today, i);
      const dateString = format(currentDate, 'yyyy-MM-dd');
      
      // Check if this day already exists in our existing days
      const existingDay = existingDays.find(day => day.date === dateString);
      
      if (existingDay) {
        // If the day already exists in our preserved days, use it
        newStudyDays.push(existingDay);
      } else {
        // Otherwise create a fresh day
        const previousDay = studyDays.find(day => day.date === dateString);
        newStudyDays.push({
          date: dateString,
          available: previousDay ? previousDay.available : true,
          availableHours: previousDay ? previousDay.availableHours : settings.defaultDailyHours,
          exams: [], // Start with empty exams for each day
          customModified: previousDay?.customModified || false
        });
      }
    }

    // Get track of which exams already have completed sessions
    const processedExams = new Set<string>();
    
    if (options?.keepCompletedSessions) {
      // Mark exams that have completed sessions
      existingDays.forEach(day => {
        day.exams.forEach(examDay => {
          if (examDay.completed) {
            processedExams.add(examDay.examId);
          }
        });
      });
    }
    
    // Create a map for faster exam lookups
    const examsMap = new Map(exams.map(exam => [exam.id, exam]));
    
    // Calculate study load for each exam
    exams.forEach(exam => {
      const examDate = parseISO(exam.date);
      const daysUntilExam = differenceInDays(examDate, today);
      
      if (daysUntilExam <= 0) return; // Skip past exams
      
      // Skip if this exam has completed sessions and we're keeping them
      if (options?.keepCompletedSessions && processedExams.has(exam.id)) {
        // For exams with completed sessions, we need to recalculate the remaining days
        // We'll get the completed units and distribute the remaining ones
        
        const completedUnits = getCompletedUnits(exam.id);
        const totalUnits = exam.usePages ? (exam.pages || 0) : exam.chapters;
        const remainingUnits = totalUnits - completedUnits.size;
        
        // Only recalculate if there are remaining units
        if (remainingUnits > 0) {
          // Find the latest completed day for this exam
          const completedDays = newStudyDays.filter(day => 
            day.exams.some(e => e.examId === exam.id && e.completed)
          );
          
          let latestCompletedDay: StudyDay | undefined;
          if (completedDays.length > 0) {
            latestCompletedDay = completedDays.reduce((latest, day) => {
              return parseISO(day.date) > parseISO(latest.date) ? day : latest;
            }, completedDays[0]);
          }
          
          // Get available future days after the latest completed day
          const futureDaysStart = latestCompletedDay 
            ? newStudyDays.findIndex(day => day.date === latestCompletedDay.date) + 1
            : 0;
            
          // Respect the study start date if specified
          const startStudyDate = exam.startStudyDate
            ? parseISO(exam.startStudyDate)
            : today;
            
          const availableDays = newStudyDays.slice(futureDaysStart).filter(day => {
            const dayDate = parseISO(day.date);
            return !isSameDay(dayDate, examDate) && // Skip exam day
                  isBefore(dayDate, examDate) && // Only days before exam date
                  (isAfter(dayDate, startStudyDate) || isEqual(dayDate, startStudyDate)) && // Respect startStudyDate
                  day.available; // Only available days
          });
          
          // Calculate study plan for remaining units
          distributeRemainingUnits(
            availableDays, 
            exam, 
            remainingUnits, 
            completedUnits,
            Math.max(...Array.from(completedUnits), 0) + 1
          );
        }
        
        return; // Skip regular distribution for this exam
      }
      
      // Calculate review days based on exam-specific settings or default
      const reviewDaysForExam = exam.customReviewDays !== undefined
        ? exam.customReviewDays
        : settings.reviewDays;

      // Respect the study start date if specified
      const studyStartDate = exam.startStudyDate
        ? parseISO(exam.startStudyDate)
        : today;

      // Get available days excluding exam day and respecting start date
      let availableDays = newStudyDays.filter(day => {
        const dayDate = parseISO(day.date);
        return !isSameDay(dayDate, examDate) &&
              isBefore(dayDate, examDate) &&
              (isAfter(dayDate, studyStartDate) || isEqual(dayDate, studyStartDate)) &&
              day.available &&
              !day.exams.some(e => e.examId === exam.id);
      });

      // Prioritize custom modified days
      availableDays.sort((a, b) => {
        // First prioritize by custom modification
        if (a.customModified && !b.customModified) return -1;
        if (!a.customModified && b.customModified) return 1;
        
        // Then sort by date
        return parseISO(a.date).getTime() - parseISO(b.date).getTime();
      });

      // Calculate total study units (chapters or pages)
      const studyUnits = exam.usePages ? (exam.pages || 0) : exam.chapters;

      // Get time needed per unit
      let timePerUnit: number;
      if (exam.usePages) {
        // For pages: timePerUnit = pages per hour, so convert to hours per page
        timePerUnit = 1 / (exam.timePerUnit || 20); // Default 20 pages/hour
      } else {
        // For chapters: timePerUnit = hours per chapter
        timePerUnit = exam.timePerUnit || 1; // Default: 1h/chapter
      }
      
      // Calculate total study hours needed
      const totalStudyHoursNeeded = studyUnits * timePerUnit;
      
      // Calculate optimal number of study days needed (accounting for efficiency)
      const avgStudyHoursPerDay = settings.defaultDailyHours * STUDY_EFFICIENCY;
      const optimalStudyDaysNeeded = Math.ceil(totalStudyHoursNeeded / avgStudyHoursPerDay);
      
      // Skip days at the beginning if we have more than needed
      let startDayIndex = 0;
      
      // For small exams far in the future, start studying later
      const isSmallExam = studyUnits < SMALL_EXAM_THRESHOLD;
      const isFarAway = daysUntilExam > FAR_AWAY_EXAM_DAYS;
      
      if (availableDays.length > optimalStudyDaysNeeded * 1.5) {
        // We have 50% more days than needed, so we can skip some
        // But don't skip custom modified days
        const customDays = availableDays.filter(day => day.customModified);
        const regularDays = availableDays.filter(day => !day.customModified);
        
        const daysToSkip = Math.floor((regularDays.length - optimalStudyDaysNeeded) * SKIP_DAYS_FACTOR);
        const regularStartIndex = isSmallExam && isFarAway ? daysToSkip : Math.floor(daysToSkip * 0.4);
        
        // Take only the regular days we need, starting from calculated index
        const regularDaysToKeep = regularDays.slice(regularStartIndex);
        
        // Combine with custom days and re-sort
        availableDays = [...customDays, ...regularDaysToKeep].sort((a, b) => {
          if (a.customModified && !b.customModified) return -1;
          if (!a.customModified && b.customModified) return 1;
          return parseISO(a.date).getTime() - parseISO(b.date).getTime();
        });
      }
      
      // Calculate review start index
      const reviewStartIndex = Math.max(0, availableDays.length - reviewDaysForExam);
      
      // Calculate study days (non-review days)
      const studyDaysAvailable = availableDays.slice(0, reviewStartIndex);
      
      if (studyDaysAvailable.length === 0 && reviewDaysForExam > 0) {
        // If we don't have study days but do have review days,
        // use some review days as study days
        const daysToConvert = Math.min(Math.ceil(reviewDaysForExam / 2), availableDays.length);
        for (let i = 0; i < daysToConvert; i++) {
          studyDaysAvailable.push(availableDays[i]);
        }
      }
      
      // Calculate units per study day
      let unitsPerDay = studyDaysAvailable.length > 0
        ? Math.ceil(studyUnits / studyDaysAvailable.length)
        : 0;
      
      // Ensure at least 1 unit per day
      unitsPerDay = Math.max(1, unitsPerDay);
      
      // Distribute units across study days
      let remainingUnits = studyUnits;
      let currentUnit = 1;
      
      // Distribute study content evenly
      studyDaysAvailable.forEach(day => {
        if (remainingUnits <= 0) return;
        
        // Boost units for custom modified days
        const capacityMultiplier = day.customModified ? 1.5 : 1;
        
        const maxUnitsForToday = Math.min(
          Math.ceil(unitsPerDay * capacityMultiplier),
          remainingUnits,
          Math.floor(day.availableHours / timePerUnit * capacityMultiplier)
        );
        
        const todayUnits = Array.from(
          { length: maxUnitsForToday },
          (_, i) => currentUnit + i
        );
        
        const hoursNeeded = Math.max(0.5, maxUnitsForToday * timePerUnit);
        
        day.exams.push({
          examId: exam.id,
          chapters: todayUnits,
          plannedHours: hoursNeeded,
          actualHours: 0,
          completed: false
        });
        
        currentUnit += maxUnitsForToday;
        remainingUnits -= maxUnitsForToday;
      });
      
      // Add review days
      const reviewDays = availableDays.slice(reviewStartIndex);
      reviewDays.forEach(day => {
        day.exams.push({
          examId: exam.id,
          chapters: [],
          plannedHours: 1, // Default 1 hour for review
          actualHours: 0,
          completed: false,
          isReview: true
        });
      });
    });
    
    // Maximize and optimize daily load - distribute remaining time proportionally
    newStudyDays.forEach(day => {
      if (!day.available || day.exams.length === 0) return;
      
      // Calculate total hours needed and currently planned
      const totalHoursNeeded = day.exams.reduce((sum, exam) => sum + exam.plannedHours, 0);
      
      // If we have unused time, distribute it proportionally to exams
      if (totalHoursNeeded < day.availableHours) {
        const extraHours = day.availableHours - totalHoursNeeded;
        
        // Distribute extra hours proportionally
        if (day.exams.length > 0) {
          const extraPerExam = extraHours / day.exams.length;
          day.exams.forEach(examDay => {
            examDay.plannedHours += extraPerExam;
            // Round to 1 decimal place for cleaner display
            examDay.plannedHours = Math.round(examDay.plannedHours * 10) / 10;
          });
        }
      }
      // If we need more hours than available, adjust proportionally
      else if (totalHoursNeeded > day.availableHours) {
        const ratio = day.availableHours / totalHoursNeeded;
        day.exams.forEach(examDay => {
          examDay.plannedHours = Math.round((examDay.plannedHours * ratio) * 10) / 10;
        });
      }
    });
    
    return newStudyDays;
  };

  return {
    generateStudyPlan,
    distributeRemainingUnits
  };
}
