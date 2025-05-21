import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Exam, StudyDay, StudySession, Settings, Priority, StudyDayExam } from '@/types';
import { addDays, differenceInDays, parseISO, format, isAfter, isSameDay, isBefore, startOfDay, subDays } from 'date-fns';
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface RegenerationOptions {
  keepCompletedSessions: boolean;
}

interface AppContextType {
  exams: Exam[];
  studyDays: StudyDay[];
  studySessions: StudySession[];
  settings: Settings;
  addExam: (exam: Omit<Exam, 'id'>) => void;
  updateExam: (exam: Exam) => void;
  deleteExam: (id: string) => void;
  updateStudyDay: (day: StudyDay) => void;
  addStudySession: (session: Omit<StudySession, 'id'>) => void;
  updateSettings: (settings: Settings) => void;
  generateStudyPlan: (options?: RegenerationOptions) => void;
  resetData: () => void;
  showRegenerationDialog: boolean;
  setShowRegenerationDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

const defaultSettings: Settings = {
  pomodoroWork: 25,
  pomodoroBreak: 5,
  defaultDailyHours: 4,
  reviewDays: 3,
  notifications: true,
  darkMode: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Function to generate a random color for exams
const generateExamColor = () => {
  const colors = [
    '#9b87f5', // Primary purple
    '#7E69AB', // Secondary purple
    '#3498db', // Blue
    '#2ecc71', // Green
    '#e74c3c', // Red
    '#f39c12', // Orange
    '#1abc9c', // Turquoise
    '#9b59b6', // Violet
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [studyDays, setStudyDays] = useState<StudyDay[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [showRegenerationDialog, setShowRegenerationDialog] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadedExams = localStorage.getItem('exams');
    const loadedStudyDays = localStorage.getItem('studyDays');
    const loadedStudySessions = localStorage.getItem('studySessions');
    const loadedSettings = localStorage.getItem('settings');

    if (loadedExams) {
      setExams(JSON.parse(loadedExams));
    }
    if (loadedStudyDays) {
      setStudyDays(JSON.parse(loadedStudyDays));
    }
    if (loadedStudySessions) {
      setStudySessions(JSON.parse(loadedStudySessions));
    }
    if (loadedSettings) {
      setSettings(JSON.parse(loadedSettings));
    }

    // Check system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setSettings(prev => ({ ...prev, darkMode: true }));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('exams', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('studyDays', JSON.stringify(studyDays));
  }, [studyDays]);

  useEffect(() => {
    localStorage.setItem('studySessions', JSON.stringify(studySessions));
  }, [studySessions]);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
    
    // Apply dark mode
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // Check for completed days and recalculate plan if needed
  useEffect(() => {
    const hasCompletedDays = studyDays.some(day => 
      day.exams.some(exam => exam.completed && exam.actualHours > 0)
    );
    
    if (hasCompletedDays) {
      // We could optionally auto-recalculate here
    }
  }, [studyDays]);

  const addExam = (exam: Omit<Exam, 'id'>) => {
    const newExam = {
      ...exam,
      id: Date.now().toString(),
      color: generateExamColor(),
    };
    setExams([...exams, newExam]);
    toast.success(`Exam "${exam.name}" added successfully!`);
  };

  const updateExam = (updatedExam: Exam) => {
    setExams(exams.map(exam => exam.id === updatedExam.id ? updatedExam : exam));
    toast.success(`Exam "${updatedExam.name}" updated successfully!`);
  };

  const deleteExam = (id: string) => {
    const examToDelete = exams.find(exam => exam.id === id);
    setExams(exams.filter(exam => exam.id !== id));
    
    // Also remove this exam from study days
    setStudyDays(studyDays.map(day => ({
      ...day,
      exams: day.exams.filter(exam => exam.examId !== id)
    })));
    
    // Remove study sessions for this exam
    setStudySessions(studySessions.filter(session => session.examId !== id));
    
    if (examToDelete) {
      toast.success(`Exam "${examToDelete.name}" deleted successfully!`);
    }
  };

  const updateStudyDay = (updatedDay: StudyDay) => {
    setStudyDays(days => {
      const newDays = [...days];
      const existingDayIndex = newDays.findIndex(day => day.date === updatedDay.date);
      
      if (existingDayIndex >= 0) {
        newDays[existingDayIndex] = updatedDay;
        
        // Check if we need to recalculate the plan going forward
        const hasCompletedExams = updatedDay.exams.some(exam => exam.completed && exam.actualHours > 0);
        
        if (hasCompletedExams) {
          // Recalculate future days based on completed exams
          recalculateFutureDays(newDays, existingDayIndex);
        }
        
        return newDays;
      } else {
        return [...days, updatedDay];
      }
    });
  };

  // Enhanced function to recalculate future study days based on progress
  const recalculateFutureDays = (allDays: StudyDay[], updatedDayIndex: number) => {
    const updatedDay = allDays[updatedDayIndex];
    const date = parseISO(updatedDay.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Track progress and remaining work for each exam
    const examProgress: Record<string, {
      completedUnits: Set<number>,
      remainingUnits: number,
      examObj: Exam | undefined
    }> = {};
    
    // Initialize exam progress
    updatedDay.exams.forEach(examDay => {
      if (examDay.completed) {
        const examObj = exams.find(e => e.id === examDay.examId);
        if (!examObj) return;
        
        if (!examProgress[examDay.examId]) {
          examProgress[examDay.examId] = {
            completedUnits: new Set<number>(),
            remainingUnits: examObj.usePages ? (examObj.pages || 0) : examObj.chapters,
            examObj
          };
        }
        
        // Add completed units to the set
        examDay.chapters.forEach(unit => {
          examProgress[examDay.examId].completedUnits.add(unit);
        });
        
        // Update remaining units
        examProgress[examDay.examId].remainingUnits = 
          (examObj.usePages ? (examObj.pages || 0) : examObj.chapters) - 
          examProgress[examDay.examId].completedUnits.size;
      }
    });
    
    // Now adjust future days based on the updated progress
    Object.entries(examProgress).forEach(([examId, progress]) => {
      if (!progress.examObj) return;
      
      const { examObj, remainingUnits } = progress;
      const examDate = parseISO(examObj.date);
      
      // Skip if exam date is in the past
      if (examDate < today) return;
      
      // Calculate remaining days until exam (excluding exam day itself)
      const daysUntilExam = differenceInDays(examDate, today);
      if (daysUntilExam <= 0) return;
      
      // Find review start day (days before exam)
      const reviewDaysForExam = examObj.customReviewDays !== undefined 
        ? examObj.customReviewDays 
        : settings.reviewDays;
      
      const reviewStartDay = Math.max(0, daysUntilExam - reviewDaysForExam - 1); // -1 to exclude exam day
      
      // Calculate actual time needed per unit
      let actualTimePerUnit: number;
      
      if (examObj.usePages) {
        // For pages: timePerUnit = pages per hour
        actualTimePerUnit = 1 / (examObj.timePerUnit || 20); // Convert pages/hour to hours/page
      } else {
        // For chapters: timePerUnit = hours per chapter
        actualTimePerUnit = examObj.timePerUnit || 1; // Default: 1h/chapter
      }
      
      // Calculate how many hours of study are needed in total
      const totalHoursNeeded = remainingUnits * actualTimePerUnit;
      
      // Find all future days for this exam
      let futureExamDays = allDays.filter((day, index) => {
        const dayDate = parseISO(day.date);
        return index > updatedDayIndex && // Only consider days after the updated day
               !isSameDay(dayDate, examDate) && // Skip the exam day itself
               isBefore(dayDate, examDate) && // Only consider days before exam date
               day.available; // Only consider available days
      });
      
      // Sort days by date (just to be safe)
      futureExamDays.sort((a, b) => {
        return parseISO(a.date).getTime() - parseISO(b.date).getTime();
      });
      
      // Determine optimal start day based on study load
      // Skip days if we have more than needed
      const totalAvailableHours = futureExamDays.reduce((sum, day) => sum + day.availableHours, 0);
      const daysNeeded = Math.min(
        Math.ceil(totalHoursNeeded / (settings.defaultDailyHours * 0.8)), // Assume 80% efficiency
        futureExamDays.length
      );
      
      // If we have more days than needed, skip the earliest ones
      if (futureExamDays.length > daysNeeded * 1.5 && daysNeeded > 0) {
        const daysToSkip = Math.floor((futureExamDays.length - daysNeeded) * 0.7); // Skip 70% of extra days
        futureExamDays = futureExamDays.slice(daysToSkip);
      }
      
      // Calculate smart distribution
      let remainingToDistribute = remainingUnits;
      // Important: Calculate the next unit to assign based on the highest completed unit
      // This fixes the issue of not correctly tracking progress
      let nextUnitToAssign = progress.completedUnits.size > 0 
        ? Math.max(...Array.from(progress.completedUnits)) + 1
        : 1;
      
      // For small exams far in the future, skip some days at the beginning
      const isSmallExamFarAway = 
        remainingUnits < 30 && // Small number of units
        daysUntilExam > 30 && // More than a month away
        futureExamDays.length > 15; // Have enough days to optimize
      
      if (isSmallExamFarAway) {
        const daysToSkip = Math.floor(futureExamDays.length * 0.6); // Skip 60% of days for small far exams
        futureExamDays = futureExamDays.slice(daysToSkip);
      }
      
      // If we have very few days left, prioritize more units per day
      const compressedSchedule = futureExamDays.length < remainingUnits / 5;
      
      // Calculate average units per day for balanced distribution
      const avgUnitsPerDay = remainingToDistribute / Math.max(1, futureExamDays.length - reviewDaysForExam);
      
      // Distribute remaining units across future days
      futureExamDays.forEach((day, index) => {
        // Check if this is a review day (close to exam)
        const isReviewDay = index >= futureExamDays.length - reviewDaysForExam;
        
        // Find the existing exam entry for this day, or create a new one
        const examDayIndex = day.exams.findIndex(e => e.examId === examId);
        
        if (isReviewDay) {
          // Review day - keep or add with empty chapters
          if (examDayIndex >= 0) {
            day.exams[examDayIndex].isReview = true;
            day.exams[examDayIndex].chapters = [];
          } else {
            day.exams.push({
              examId,
              chapters: [],
              plannedHours: 1, // Default 1 hour for review
              actualHours: 0,
              completed: false,
              isReview: true
            });
          }
        } else if (remainingToDistribute > 0) {
          // Calculate units for this day based on availability and balance
          const maxUnitsForTime = Math.floor(day.availableHours / actualTimePerUnit);
          
          // Adjust units per day if we're on a compressed schedule
          let unitsToday = compressedSchedule
            ? Math.min(Math.ceil(remainingToDistribute / Math.max(1, futureExamDays.length - index - reviewDaysForExam)), maxUnitsForTime)
            : Math.min(Math.ceil(avgUnitsPerDay), remainingToDistribute, maxUnitsForTime);
          
          // Ensure we assign at least one unit per day if there are units left
          unitsToday = Math.max(1, unitsToday);
          
          // Generate the units (chapters or pages) for today
          const todayUnits: number[] = [];
          for (let i = 0; i < unitsToday; i++) {
            if (nextUnitToAssign <= (examObj.usePages ? (examObj.pages || 0) : examObj.chapters)) {
              todayUnits.push(nextUnitToAssign++);
              remainingToDistribute--;
            }
          }
          
          const hoursNeeded = Math.max(0.5, unitsToday * actualTimePerUnit);
          
          if (examDayIndex >= 0) {
            day.exams[examDayIndex].chapters = todayUnits;
            day.exams[examDayIndex].plannedHours = hoursNeeded;
            day.exams[examDayIndex].isReview = false;
          } else {
            day.exams.push({
              examId,
              chapters: todayUnits,
              plannedHours: hoursNeeded,
              actualHours: 0,
              completed: false,
              isReview: false
            });
          }
        } else if (examDayIndex >= 0 && !isReviewDay) {
          // Remove non-review days if we've distributed all units
          day.exams.splice(examDayIndex, 1);
        }
      });
    });
  };

  const addStudySession = (session: Omit<StudySession, 'id'>) => {
    const newSession = {
      ...session,
      id: Date.now().toString(),
    };
    setStudySessions([...studySessions, newSession]);
    
    // Update study day with actual hours
    const sessionExam = exams.find(exam => exam.id === session.examId);
    if (sessionExam) {
      toast.success(`Added ${session.duration} minutes for ${sessionExam.name}`);
    }
  };

  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    toast.success("Settings updated successfully!");
  };

  const priorityWeight = (priority: Priority): number => {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  };

  // Helper to get completed units for an exam based on completed study days
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

  const generateStudyPlan = useCallback(() => {
    setShowRegenerationDialog(false);
    
    const daysToExam = (examDate: Date): number => {
      return differenceInDays(examDate, startOfDay(new Date()));
    };
    
    // List of days between now and the furthest exam
    const today = startOfDay(new Date());
    const latestExamDate = new Date(Math.max(...exams.map(e => new Date(e.date).getTime())));
    
    // Create array of all days between today and the latest exam
    const allDays: StudyDay[] = [];
    const totalDays = differenceInDays(latestExamDate, today) + 1;
    
    for (let i = 0; i < totalDays; i++) {
      const currentDate = addDays(today, i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      // Check if this day already exists in our study days
      const existingDay = studyDays.find(day => day.date === dateStr);
      
      if (existingDay) {
        // Keep the existing study day configuration
        allDays.push({
          ...existingDay,
          exams: existingDay.exams.filter(exam => {
            // Keep manually assigned study sessions
            return exam.manuallyAssigned === true;
          })
        });
      } else {
        // Create a new day with default settings
        allDays.push({
          date: dateStr,
          available: !isWeekend(currentDate), // Default to weekends off
          availableHours: 6, // Changed from 4 to 6 as requested
          exams: []
        });
      }
    }
    
    // Initialize unit allocation map
    const unitAllocationMap = new Map();
    
    // Prepare available days list, respecting start study dates
    exams.forEach(exam => {
      const examId = exam.id;
      const examDate = parseISO(exam.date);
      const startDate = exam.startStudyDate ? parseISO(exam.startStudyDate) : today;
      const reviewDays = exam.customReviewDays || settings.reviewDays || 3;
      
      // Calculate the study period end date (before review)
      const endDate = subDays(examDate, reviewDays + 1);
      
      // Filter days that are available for this exam
      const availableDaysForExam = allDays.filter(day => {
        const dayDate = parseISO(day.date);
        // Only include days:
        // 1. On or after the start study date
        // 2. On or before the end date
        // 3. That are marked as available
        return (
          dayDate >= startDate && 
          dayDate <= endDate && 
          day.available
        );
      });
      
      // Calculate total units (chapters or pages)
      const totalUnits = exam.usePages ? exam.pages! : exam.chapters;
      
      // Initialize unit allocation arrays
      unitAllocationMap.set(examId, {
        availableDays: availableDaysForExam,
        endDate,
        reviewStartDate: addDays(endDate, 1),
        totalUnits,
        hoursPerUnit: exam.timePerUnit,
        usePages: exam.usePages,
        allocated: false
      });
    });
    
    // Attempt to allocate units to days
    let attemptCount = 0;
    const MAX_ATTEMPTS = 10;
    
    while (Array.from(unitAllocationMap.values()).some(data => !data.allocated) && attemptCount < MAX_ATTEMPTS) {
      attemptCount++;
      
      // Sort exams by priority (based on how close the exam is and its priority level)
      const examPriorityOrder = exams
        .map(exam => {
          const daysLeft = daysToExam(parseISO(exam.date));
          // Create a priority score: lower means higher priority
          let priorityScore = daysLeft;
          
          // Adjust based on priority level
          if (exam.priority === 'high') priorityScore -= 10;
          else if (exam.priority === 'low') priorityScore += 10;
          
          // Adjust based on initial level
          priorityScore += exam.initialLevel;
          
          return {
            examId: exam.id,
            priorityScore
          };
        })
        .sort((a, b) => a.priorityScore - b.priorityScore);
      
      // Process exams in priority order
      for (const { examId } of examPriorityOrder) {
        const allocationData = unitAllocationMap.get(examId);
        if (allocationData.allocated) continue;
        
        const exam = exams.find(e => e.id === examId)!;
        
        // Get the available days for this exam
        const { availableDays, totalUnits, hoursPerUnit, usePages } = allocationData;
        
        // If there are no available days, mark as allocated (we can't do anything)
        if (availableDays.length === 0) {
          unitAllocationMap.set(examId, { ...allocationData, allocated: true });
          continue;
        }
        
        // Calculate total available hours across all days
        const totalAvailableHours = availableDays.reduce((sum, day) => {
          // Subtract hours already allocated to other exams
          const usedHours = day.exams.reduce((total, e) => total + e.plannedHours, 0);
          return sum + Math.max(0, day.availableHours - usedHours);
        }, 0);
        
        // Calculate total hours needed for this exam
        const totalHoursNeeded = totalUnits * hoursPerUnit;
        
        // If we can't fit the exam in available time, mark as allocated and continue
        if (totalAvailableHours < totalHoursNeeded) {
          unitAllocationMap.set(examId, { ...allocationData, allocated: true });
          continue;
        }
        
        // Calculate units per day based on difficulty and available time
        const avgUnitsPerDay = Math.max(1, Math.floor(totalUnits / availableDays.length));
        const unitsLeft = [...Array(totalUnits)].map((_, i) => i + 1);
        
        // Allocate units to days
        for (const day of availableDays) {
          if (unitsLeft.length === 0) break;
          
          // Calculate available hours for this day
          const usedHours = day.exams.reduce((total, e) => total + e.plannedHours, 0);
          const availableHours = Math.max(0, day.availableHours - usedHours);
          
          if (availableHours <= 0) continue;
          
          // Decide how many units to allocate to this day
          const unitsToAllocate = Math.min(
            avgUnitsPerDay, 
            Math.floor(availableHours / hoursPerUnit),
            unitsLeft.length
          );
          
          if (unitsToAllocate <= 0) continue;
          
          // Get units for this day
          const dayUnits = unitsLeft.splice(0, unitsToAllocate);
          const plannedHours = unitsToAllocate * hoursPerUnit;
          
          // Add to day's exams
          day.exams.push({
            examId,
            chapters: dayUnits,
            plannedHours,
            actualHours: 0,
            completed: false
          });
        }
        
        // If we still have units left, try to distribute them to days with remaining capacity
        if (unitsLeft.length > 0) {
          for (const day of availableDays) {
            if (unitsLeft.length === 0) break;
            
            // Calculate remaining hours for this day
            const usedHours = day.exams.reduce((total, e) => total + e.plannedHours, 0);
            const remainingHours = Math.max(0, day.availableHours - usedHours);
            
            // Skip if no remaining hours
            if (remainingHours < hoursPerUnit) continue;
            
            // Find the existing exam entry for this day
            const examEntry = day.exams.find(e => e.examId === examId);
            
            // Calculate how many more units we can add
            const additionalUnits = Math.min(
              Math.floor(remainingHours / hoursPerUnit),
              unitsLeft.length
            );
            
            if (additionalUnits <= 0) continue;
            
            // Get additional units
            const moreUnits = unitsLeft.splice(0, additionalUnits);
            const additionalHours = additionalUnits * hoursPerUnit;
            
            if (examEntry) {
              // Add to existing entry
              examEntry.chapters.push(...moreUnits);
              examEntry.plannedHours += additionalHours;
            } else {
              // Create new entry
              day.exams.push({
                examId,
                chapters: moreUnits,
                plannedHours: additionalHours,
                actualHours: 0,
                completed: false
              });
            }
          }
        }
        
        // Add review days
        const reviewStartDate = allocationData.reviewStartDate;
        const reviewDays = exam.customReviewDays || settings.reviewDays || 3;
        
        // Find days available for review
        const reviewDaysAvailable = allDays.filter(day => {
          const dayDate = parseISO(day.date);
          return (
            dayDate >= reviewStartDate && 
            dayDate < parseISO(exam.date) && 
            day.available
          );
        });
        
        // Allocate review sessions
        const reviewsToAllocate = Math.min(reviewDays, reviewDaysAvailable.length);
        
        for (let i = 0; i < reviewsToAllocate; i++) {
          const reviewDay = reviewDaysAvailable[i];
          
          // Calculate available hours for this review day
          const usedHours = reviewDay.exams.reduce((total, e) => total + e.plannedHours, 0);
          const availableHours = Math.max(0, reviewDay.availableHours - usedHours);
          
          if (availableHours <= 1) continue; // Need at least an hour for review
          
          // Allocate 1-2 hours for review based on available time
          const reviewHours = Math.min(2, availableHours);
          
          reviewDay.exams.push({
            examId,
            chapters: [], // Empty array indicates review of all content
            plannedHours: reviewHours,
            actualHours: 0,
            completed: false,
            isReview: true
          });
        }
        
        // Mark this exam as allocated
        unitAllocationMap.set(examId, { ...allocationData, allocated: true });
      }
    }
    
    // Update study days state
    setStudyDays(allDays);
  }, [exams, studyDays, settings, setStudyDays]);

  // New helper function to distribute remaining units
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
    
    studyDaysAvailable.forEach(day => {
      if (currentRemainingUnits <= 0) return;
      
      const maxUnitsForToday = Math.min(
        unitsPerDay,
        currentRemainingUnits,
        Math.floor(day.availableHours / timePerUnit)
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

  const resetData = () => {
    if (window.confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      setExams([]);
      setStudyDays([]);
      setStudySessions([]);
      setSettings(defaultSettings);
      localStorage.clear();
      toast.success("All data has been reset!");
    }
  };

  const value = {
    exams,
    studyDays,
    studySessions,
    settings,
    addExam,
    updateExam,
    deleteExam,
    updateStudyDay,
    addStudySession,
    updateSettings,
    generateStudyPlan,
    resetData,
    showRegenerationDialog,
    setShowRegenerationDialog
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// New component for regeneration dialog
const RegenerationDialog: React.FC = () => {
  const { showRegenerationDialog, setShowRegenerationDialog, generateStudyPlan } = useAppContext();
  const [keepCompleted, setKeepCompleted] = useState(true);
  
  const handleRegenerate = (keep: boolean) => {
    generateStudyPlan({ keepCompletedSessions: keep });
    setShowRegenerationDialog(false);
  };

  return (
    <Dialog open={showRegenerationDialog} onOpenChange={setShowRegenerationDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerate Study Plan</DialogTitle>
          <DialogDescription>
            Choose how you want to regenerate your study plan
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="keep-completed"
              checked={keepCompleted}
              onCheckedChange={(checked) => setKeepCompleted(checked === true)}
            />
            <div>
              <label htmlFor="keep-completed" className="font-medium text-sm">
                Keep completed sessions
              </label>
              <p className="text-muted-foreground text-xs">
                The plan will be recalculated only for future days, preserving your completed study sessions.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Checkbox
              id="regenerate-all"
              checked={!keepCompleted}
              onCheckedChange={(checked) => setKeepCompleted(!checked)}
            />
            <div>
              <label htmlFor="regenerate-all" className="font-medium text-sm">
                Regenerate everything
              </label>
              <p className="text-muted-foreground text-xs">
                The existing plan will be completely erased and recreated from scratch.
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowRegenerationDialog(false)}>
            Cancel
          </Button>
          <Button onClick={() => handleRegenerate(keepCompleted)}>
            Regenerate Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppContextProvider;
