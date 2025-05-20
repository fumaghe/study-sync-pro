
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Exam, StudyDay, StudySession, Settings, Priority, StudyDayExam } from '@/types';
import { addDays, differenceInDays, parseISO, format, isAfter } from 'date-fns';
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
      const existingDayIndex = days.findIndex(day => day.date === updatedDay.date);
      if (existingDayIndex >= 0) {
        const newDays = [...days];
        newDays[existingDayIndex] = updatedDay;
        return newDays;
      } else {
        return [...days, updatedDay];
      }
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

    // Clear existing study plan - FIX for regeneration issue
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
      
      if (daysUntilExam < 0) return; // Skip past exams
      
      // Calculate review days based on exam-specific settings or default
      const reviewDaysForExam = exam.customReviewDays !== undefined ? exam.customReviewDays : settings.reviewDays;
      const reviewStartDay = Math.max(0, daysUntilExam - reviewDaysForExam);
      
      // Calculate chapters per day, excluding review days
      const availableDays = reviewStartDay;
      
      // Calculate study units (chapters or pages)
      const studyUnits = exam.usePages ? exam.pages : exam.chapters;
      const timePerUnit = exam.timePerUnit || (exam.usePages ? 0.5 : 1); // Default: 30min/page or 1h/chapter
      
      const unitsPerDay = availableDays > 0 ? studyUnits / availableDays : 0;

      // Distribute chapters/pages
      let remainingUnits = studyUnits;
      for (let i = 0; i <= daysUntilExam; i++) {
        if (!newStudyDays[i].available) continue;

        const isReviewDay = i >= reviewStartDay;
        let unitsToday = 0;
        
        if (!isReviewDay && remainingUnits > 0) {
          // Calculate units for today based on available time
          const maxUnitsForTime = newStudyDays[i].availableHours / timePerUnit;
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

          newStudyDays[i].exams.push(dayExam);
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
