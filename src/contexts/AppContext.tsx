import React, { createContext, useContext, useState, useEffect } from 'react';
import { Exam, StudyDay, StudySession, Settings, Priority, StudyDayExam } from '@/types';
import { addDays, differenceInDays, parseISO, format, isAfter, isSameDay } from 'date-fns';
import { toast } from "sonner";

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
  generateStudyPlan: () => void;
  resetData: () => void;
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

  // New function to recalculate future study days based on progress
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
      const timePerUnit = examObj.timePerUnit || (examObj.usePages ? 0.5 : 1);
      
      // Skip if exam date is in the past
      if (examDate < today) return;
      
      // Calculate remaining days until exam (excluding exam day)
      const daysUntilExam = differenceInDays(examDate, today) - 1;
      if (daysUntilExam <= 0) return;
      
      // Find review start day (days before exam)
      const reviewDaysForExam = examObj.customReviewDays !== undefined 
        ? examObj.customReviewDays 
        : settings.reviewDays;
      
      const reviewStartDay = Math.max(0, daysUntilExam - reviewDaysForExam);
      
      // Calculate units per day for remaining days
      const availableDays = Math.max(1, reviewStartDay); // Ensure at least 1 day
      const unitsPerDay = remainingUnits / availableDays;
      
      // Calculate actual time needed per unit
      let actualTimePerUnit: number;
      
      if (examObj.usePages) {
        // For pages: timePerUnit = pages per hour
        actualTimePerUnit = 1 / (examObj.timePerUnit || 20); // Default 20 pages/hour
      } else {
        // For chapters: timePerUnit = hours per chapter
        actualTimePerUnit = examObj.timePerUnit || 1;
      }
      
      // Find all future days for this exam
      let futureExamDays = allDays.filter((day, index) => {
        const dayDate = parseISO(day.date);
        return index > updatedDayIndex && // Only consider days after the updated day
               !isSameDay(dayDate, examDate) && // Skip the exam day itself
               dayDate <= examDate && // Only consider days before or on exam date
               day.available; // Only consider available days
      });
      
      // Sort days by date (just to be safe)
      futureExamDays.sort((a, b) => {
        return parseISO(a.date).getTime() - parseISO(b.date).getTime();
      });
      
      // Calculate smart distribution
      let remainingToDistribute = remainingUnits;
      let nextUnitToAssign = Array.from(progress.completedUnits).length + 1;
      
      // Determine if this is a small exam far in the future
      const isSmallExamFarAway = 
        remainingUnits < 30 && // Small number of units
        daysUntilExam > 30; // More than a month away
      
      // For small exams far in the future, skip some days at the beginning
      if (isSmallExamFarAway) {
        const daysToSkip = Math.floor(daysUntilExam * 0.6); // Skip 60% of days
        futureExamDays = futureExamDays.slice(daysToSkip);
      }
      
      // If we have very few days left, prioritize more units per day
      const compressedSchedule = futureExamDays.length < remainingUnits / 5;
      
      // Distribute remaining units across future days
      futureExamDays.forEach((day, index) => {
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
          // Calculate units for this day based on availability
          const maxUnitsForTime = day.availableHours / actualTimePerUnit;
          
          // Adjust units per day if we're on a compressed schedule
          let unitsToday = compressedSchedule
            ? Math.min(Math.ceil(remainingToDistribute / Math.max(1, futureExamDays.length - index - reviewDaysForExam)), maxUnitsForTime)
            : Math.min(Math.ceil(unitsPerDay), remainingToDistribute, maxUnitsForTime);
          
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

  const generateStudyPlan = () => {
    if (exams.length === 0) {
      toast.error("Add some exams before generating a study plan!");
      return;
    }

    // Clear existing study plan - fix for regeneration issue
    setStudyDays([]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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
      
      // Create fresh study days for all dates, preserving only availability settings if they exist
      const existingDay = studyDays.find(day => day.date === dateString);
      
      newStudyDays.push({
        date: dateString,
        available: existingDay ? existingDay.available : true,
        availableHours: existingDay ? existingDay.availableHours : settings.defaultDailyHours,
        exams: [] // Start with empty exams for each day
      });
    }
    
    // Calculate study load for each exam
    exams.forEach(exam => {
      const examDate = parseISO(exam.date);
      const daysUntilExam = differenceInDays(examDate, today);
      
      if (daysUntilExam <= 0) return; // Skip past exams
      
      // Calculate review days based on exam-specific settings or default
      const reviewDaysForExam = exam.customReviewDays !== undefined ? exam.customReviewDays : settings.reviewDays;
      
      // Skip the exam day itself - we don't want to study on the day of the exam
      // Find the index of the exam day
      const examDayIndex = newStudyDays.findIndex(day => {
        const dayDate = parseISO(day.date);
        return isSameDay(dayDate, examDate);
      });
      
      if (examDayIndex >= 0) {
        // Mark the exam day as not available for this exam
        // We still keep it available for other exams that might be later
        // Just don't assign this exam to this day
      }
      
      // Calculate available days for study (excluding exam day and review days)
      const reviewStartDay = Math.max(0, daysUntilExam - reviewDaysForExam - 1);
      
      // Skip days at the beginning for small exams far in the future
      const isSmallExam = (exam.usePages ? (exam.pages || 0) : exam.chapters) < 30;
      const isFarAway = daysUntilExam > 30;
      
      let startDayIndex = 0;
      if (isSmallExam && isFarAway) {
        // For small exams far away, start studying later
        startDayIndex = Math.floor(reviewStartDay * 0.4); // Skip 40% of available days
      }
      
      const availableDays = Math.max(1, reviewStartDay - startDayIndex);
      
      // Calculate study units (chapters or pages)
      const studyUnits = exam.usePages ? (exam.pages || 0) : exam.chapters;
      
      // Get time needed per unit
      let timePerUnit: number;
      if (exam.usePages) {
        // For pages: timePerUnit = pages per hour
        // So we need to convert to hours per page for calculations
        timePerUnit = 1 / (exam.timePerUnit || 20); // Default 20 pages/hour
      } else {
        // For chapters: timePerUnit = hours per chapter
        timePerUnit = exam.timePerUnit || 1; // Default: 1h/chapter
      }
      
      const unitsPerDay = studyUnits / availableDays;

      // Distribute chapters/pages across available days
      let remainingUnits = studyUnits;
      
      for (let i = startDayIndex; i < newStudyDays.length; i++) {
        const currentDay = newStudyDays[i];
        const dayDate = parseISO(currentDay.date);
        
        // Skip if this is the exam day
        if (isSameDay(dayDate, examDate)) {
          continue;
        }
        
        if (!currentDay.available) continue;

        // Calculate days from today to this day
        const daysFromToday = differenceInDays(dayDate, today);
        
        // Skip days before we start studying
        if (daysFromToday < startDayIndex) continue;
        
        // Check if this is a review day
        const isReviewDay = daysFromToday >= reviewStartDay && daysFromToday < daysUntilExam;
        
        let unitsToday = 0;
        
        if (!isReviewDay && remainingUnits > 0 && daysFromToday < daysUntilExam) {
          // Calculate units for today based on available time
          const maxUnitsForTime = currentDay.availableHours / timePerUnit;
          unitsToday = Math.min(Math.ceil(unitsPerDay), remainingUnits, maxUnitsForTime);
          remainingUnits -= unitsToday;
        }
        
        if (unitsToday > 0 || isReviewDay) {
          // Calculate weight based on priority and initial level
          const weight = priorityWeight(exam.priority) * (6 - exam.initialLevel);
          
          // Calculate hours based on weight and units (chapters or pages)
          const hoursNeeded = isReviewDay ? 1 : Math.max(0.5, unitsToday * timePerUnit);
          
          // Add exam to this day
          const dayExam: StudyDayExam = {
            examId: exam.id,
            chapters: isReviewDay ? [] : Array.from({ length: unitsToday }, (_, j) => {
              const completedUnits = studyUnits - remainingUnits - unitsToday;
              return completedUnits + j + 1;
            }),
            plannedHours: hoursNeeded,
            actualHours: 0,
            completed: false,
            isReview: isReviewDay
          };

          currentDay.exams.push(dayExam);
        }
      }
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
    
    setStudyDays(newStudyDays);
    toast.success("Study plan generated successfully!");
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
    resetData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
