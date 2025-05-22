
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import ProgressRing from '@/components/ui/ProgressRing';
import { Play, Pause, Timer, RefreshCw } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { addDays, format, parseISO } from 'date-fns';

enum TimerState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  BREAK = 'break',
  COMPLETE = 'complete'
}

interface TimerStorage {
  startTimestamp: number | null;
  duration: number | null;
  timerState: TimerState;
  elapsedTime: number;
  selectedExam: string;
  chapters: number[];
}

const PomodoroTimerUpgraded: React.FC = () => {
  const { exams, addStudySession, settings, studyDays, updateStudyDay } = useAppContext();
  const { toast } = useToast();
  
  // Timer state
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [chapters, setChapters] = useState<number[]>([]);
  const [suggestedChapters, setSuggestedChapters] = useState<number[]>([]);
  const [timerState, setTimerState] = useState<TimerState>(TimerState.IDLE);
  const [timeLeft, setTimeLeft] = useState<number>(settings.pomodoroWork * 60);
  const [initialTime, setInitialTime] = useState<number>(settings.pomodoroWork * 60);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [showCompleteDialog, setShowCompleteDialog] = useState<boolean>(false);
  const [chapterInput, setChapterInput] = useState<string>("");
  const [timerTheme, setTimerTheme] = useState<'tomato' | 'plant' | 'book'>('tomato');
  const [markChaptersCompleted, setMarkChaptersCompleted] = useState<boolean>(true);
  const [breakTime, setBreakTime] = useState<boolean>(false);
  
  // Refs to store interval ID and last tick time for more accurate timing
  const timerRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  
  // Load timer state from localStorage on component mount
  useEffect(() => {
    const storedTimerState = localStorage.getItem('pomodoroTimerState');
    
    if (storedTimerState) {
      try {
        const parsedState = JSON.parse(storedTimerState) as TimerStorage;
        
        // Check if the timer was running and if it's still valid
        if (parsedState.startTimestamp && parsedState.timerState === TimerState.RUNNING) {
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - parsedState.startTimestamp) / 1000);
          
          // If we're still within the timer duration, restore the state
          if (elapsedSeconds <= (parsedState.duration || 0)) {
            setSelectedExam(parsedState.selectedExam);
            setChapters(parsedState.chapters);
            setElapsedTime(parsedState.elapsedTime + elapsedSeconds);
            setTimeLeft((parsedState.duration || 0) - elapsedSeconds);
            setTimerState(TimerState.RUNNING);
            setInitialTime(parsedState.duration || settings.pomodoroWork * 60);
          }
        } else if (parsedState.timerState === TimerState.PAUSED) {
          // Restore paused timer state
          setSelectedExam(parsedState.selectedExam);
          setChapters(parsedState.chapters);
          setElapsedTime(parsedState.elapsedTime);
          setTimeLeft(parsedState.duration || 0 - parsedState.elapsedTime);
          setTimerState(TimerState.PAUSED);
          setInitialTime(parsedState.duration || settings.pomodoroWork * 60);
        }
      } catch (error) {
        console.error("Error parsing timer state from localStorage", error);
      }
    }
  }, [settings.pomodoroWork]);
  
  // Initialize the timer with settings
  useEffect(() => {
    if (timerState === TimerState.IDLE) {
      setTimeLeft(settings.pomodoroWork * 60);
      setInitialTime(settings.pomodoroWork * 60);
    }
  }, [settings.pomodoroWork, timerState]);
  
  // Look up today's study plan when the exam changes
  useEffect(() => {
    if (selectedExam) {
      const today = format(new Date(), 'yyyy-MM-dd');
      const todaysPlan = studyDays.find(day => day.date === today);
      
      if (todaysPlan) {
        const examPlan = todaysPlan.exams.find(exam => exam.examId === selectedExam);
        
        if (examPlan && examPlan.chapters.length > 0) {
          setSuggestedChapters(examPlan.chapters);
        } else {
          setSuggestedChapters([]);
        }
      }
    } else {
      setSuggestedChapters([]);
    }
  }, [selectedExam, studyDays]);
  
  // Handle visibility change (tab switching, app backgrounding)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Save current timestamp when page is hidden
        if (timerState === TimerState.RUNNING) {
          localStorage.setItem('pomodoroHiddenAt', Date.now().toString());
        }
      } else {
        // When page becomes visible again, adjust timer
        if (timerState === TimerState.RUNNING) {
          const hiddenAt = localStorage.getItem('pomodoroHiddenAt');
          if (hiddenAt) {
            const now = Date.now();
            const hiddenTime = now - parseInt(hiddenAt);
            const hiddenSeconds = Math.floor(hiddenTime / 1000);
            
            // Update elapsed time and time left
            setElapsedTime(prev => prev + hiddenSeconds);
            setTimeLeft(prev => Math.max(0, prev - hiddenSeconds));
            
            // Update lastTickRef to now
            lastTickRef.current = now;
            
            // Check if timer should complete
            if (timeLeft - hiddenSeconds <= 0) {
              handleTimerComplete();
            }
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [timerState, timeLeft]);
  
  // Save timer state to localStorage
  useEffect(() => {
    const timerStorage: TimerStorage = {
      startTimestamp: lastTickRef.current,
      duration: initialTime,
      timerState,
      elapsedTime,
      selectedExam,
      chapters
    };
    
    localStorage.setItem('pomodoroTimerState', JSON.stringify(timerStorage));
  }, [timerState, elapsedTime, initialTime, selectedExam, chapters]);
  
  // Timer logic
  useEffect(() => {
    if (timerState === TimerState.RUNNING) {
      lastTickRef.current = Date.now();
      
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const deltaSeconds = Math.floor((now - (lastTickRef.current || now)) / 1000);
        lastTickRef.current = now;
        
        setTimeLeft(prev => {
          const newTime = Math.max(0, prev - deltaSeconds);
          
          // If timer hits zero
          if (newTime === 0) {
            clearInterval(timerRef.current!);
            
            handleTimerComplete();
          }
          
          return newTime;
        });
        
        setElapsedTime(prev => prev + deltaSeconds);
        
      }, 1000);
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [timerState, initialTime]);
  
  const handleTimerComplete = () => {
    // Play sound if available
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (error) {
      console.log('Audio not supported');
    }
    
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Complete!', {
        body: breakTime ? 'Break is over. Ready to focus?' : 'Good job! Time for a break.',
        icon: '/favicon.ico'
      });
    }
    
    if (breakTime) {
      // Break timer finished, switch back to work mode
      setBreakTime(false);
      setTimerState(TimerState.IDLE);
    } else {
      // Work timer finished
      setElapsedTime(initialTime);
      setShowCompleteDialog(true);
      setTimerState(TimerState.COMPLETE);
      
      // Show toast notification
      toast({
        title: "Focus session complete!",
        description: "Great job! Take a break before continuing."
      });
    }
  };
  
  // Handle play/pause
  const handlePlayPause = () => {
    if (timerState === TimerState.IDLE || timerState === TimerState.COMPLETE) {
      if (!selectedExam) {
        toast({
          title: "Select an exam",
          description: "Please select an exam before starting the timer",
          variant: "destructive"
        });
        return;
      }
      
      // Start the timer
      setTimerState(TimerState.RUNNING);
      lastTickRef.current = Date.now();
      setElapsedTime(0);
      
      // Set timeLeft based on mode (work or break)
      if (breakTime) {
        setTimeLeft(settings.pomodoroBreak * 60);
        setInitialTime(settings.pomodoroBreak * 60);
      } else {
        setTimeLeft(settings.pomodoroWork * 60);
        setInitialTime(settings.pomodoroWork * 60);
      }
    } 
    else if (timerState === TimerState.RUNNING) {
      // Pause the timer
      setTimerState(TimerState.PAUSED);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } 
    else if (timerState === TimerState.PAUSED) {
      // Resume the timer
      setTimerState(TimerState.RUNNING);
      lastTickRef.current = Date.now();
    }
  };
  
  // Reset timer
  const handleReset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimerState(TimerState.IDLE);
    
    // Reset to appropriate time based on mode
    if (breakTime) {
      setTimeLeft(settings.pomodoroBreak * 60);
      setInitialTime(settings.pomodoroBreak * 60);
    } else {
      setTimeLeft(settings.pomodoroWork * 60);
      setInitialTime(settings.pomodoroWork * 60);
    }
    
    setElapsedTime(0);
    
    // Clear localStorage timer data
    localStorage.removeItem('pomodoroTimerState');
    localStorage.removeItem('pomodoroHiddenAt');
  };
  
  // Switch between work and break mode
  const handleToggleMode = () => {
    // Reset the timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setBreakTime(!breakTime);
    setTimerState(TimerState.IDLE);
    
    if (breakTime) {
      // Switching to work mode
      setTimeLeft(settings.pomodoroWork * 60);
      setInitialTime(settings.pomodoroWork * 60);
    } else {
      // Switching to break mode
      setTimeLeft(settings.pomodoroBreak * 60);
      setInitialTime(settings.pomodoroBreak * 60);
    }
    
    setElapsedTime(0);
  };
  
  // Add all suggested chapters
  const handleAddSuggestedChapters = () => {
    if (suggestedChapters.length > 0) {
      // Add only chapters that aren't already in the list
      const newChapters = [...chapters];
      suggestedChapters.forEach(chapter => {
        if (!newChapters.includes(chapter)) {
          newChapters.push(chapter);
        }
      });
      setChapters(newChapters.sort((a, b) => a - b));
      
      toast({
        title: "Chapters added",
        description: `Added ${suggestedChapters.length} chapters from today's study plan`
      });
    }
  };
  
  // Add a chapter to study
  const handleAddChapter = () => {
    const chapter = parseInt(chapterInput);
    if (!isNaN(chapter) && chapter > 0) {
      if (!chapters.includes(chapter)) {
        setChapters([...chapters, chapter].sort((a, b) => a - b));
      }
      setChapterInput("");
    }
  };
  
  // Remove a chapter
  const handleRemoveChapter = (chapter: number) => {
    setChapters(chapters.filter(c => c !== chapter));
  };
  
  // Update study plan with completed chapters
  const markChaptersAsCompleted = () => {
    if (!markChaptersCompleted || chapters.length === 0) return;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaysPlan = studyDays.find(day => day.date === today);
    
    if (todaysPlan) {
      // Find the exam in today's plan
      const examIndex = todaysPlan.exams.findIndex(exam => exam.examId === selectedExam);
      
      if (examIndex >= 0) {
        // Create a copy of today's plan to modify
        const updatedDay = { ...todaysPlan };
        
        // Mark chapters as completed
        updatedDay.exams[examIndex] = {
          ...updatedDay.exams[examIndex],
          completed: true,
          actualHours: Math.round(elapsedTime / 60) / 60, // Convert seconds to hours
        };
        
        // Update the study day
        updateStudyDay(updatedDay);
        
        toast({
          title: "Study plan updated",
          description: "Your completed chapters have been marked in the study plan!"
        });
      }
    }
  };
  
  // Complete a session
  const handleCompleteSession = () => {
    if (selectedExam) {
      // Calculate duration in minutes (rounding to nearest minute)
      const durationMinutes = Math.round(elapsedTime / 60);
      
      addStudySession({
        examId: selectedExam,
        date: new Date().toISOString(),
        duration: durationMinutes,
        chapters: [...chapters],
        completed: true
      });
      
      // Mark chapters as completed in the study plan if option is selected
      markChaptersAsCompleted();
      
      toast({
        title: "Session saved",
        description: `Study session of ${durationMinutes} minutes recorded!`
      });
      
      // Reset timer and clear selection
      handleReset();
      setChapters([]);
      setShowCompleteDialog(false);
      
      // Switch to break mode after completing a session
      setBreakTime(true);
      setTimeLeft(settings.pomodoroBreak * 60);
      setInitialTime(settings.pomodoroBreak * 60);
    }
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress percentage
  const progress = Math.round(((initialTime - timeLeft) / initialTime) * 100);
  
  // Get the currently selected exam object
  const currentExam = exams.find(exam => exam.id === selectedExam);
  
  return (
    <>
      <Card className="animate-fade-in">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center">
            <div className="mb-6 w-full">
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Select
                    value={selectedExam}
                    onValueChange={setSelectedExam}
                    disabled={timerState !== TimerState.IDLE && timerState !== TimerState.COMPLETE}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {exams.map(exam => (
                        <SelectItem key={exam.id} value={exam.id}>
                          {exam.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select 
                    value={timerTheme} 
                    onValueChange={(value: 'tomato' | 'plant' | 'book') => setTimerTheme(value)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tomato">🍅 Tomato</SelectItem>
                      <SelectItem value="plant">🌱 Plant</SelectItem>
                      <SelectItem value="book">📚 Book</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="relative w-64 h-64">
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${breakTime ? 'opacity-100' : 'opacity-0'}`}>
                <Badge variant="secondary" className="absolute -top-2 text-sm px-3 py-1 z-10">
                  Break Time
                </Badge>
              </div>
              
              <ProgressRing 
                progress={progress}
                radius={128}
                strokeWidth={8}
                color={breakTime ? 'bg-green-500' : 'bg-primary'}
                theme={timerTheme}
                showLabel={false}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold">
                  {formatTime(timeLeft)}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {breakTime ? "Break Time" :
                    timerState === TimerState.RUNNING ? "Focus Time" : 
                    timerState === TimerState.PAUSED ? "Paused" : "Ready"}
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-x-4">
              <Button onClick={handlePlayPause} variant={breakTime ? "secondary" : "default"}>
                {(timerState === TimerState.IDLE || timerState === TimerState.PAUSED || timerState === TimerState.COMPLETE) ? 
                  <><Play className="mr-2 h-4 w-4" /> {timerState === TimerState.PAUSED ? "Resume" : "Start"}</> : 
                  <><Pause className="mr-2 h-4 w-4" /> Pause</>}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={timerState === TimerState.IDLE}>
                <RefreshCw className="mr-2 h-4 w-4" /> Reset
              </Button>
              <Button 
                variant={breakTime ? "default" : "secondary"} 
                onClick={handleToggleMode}
                disabled={timerState === TimerState.RUNNING}
              >
                <Timer className="mr-2 h-4 w-4" /> 
                {breakTime ? "Work Mode" : "Break Mode"}
              </Button>
            </div>
            
            {selectedExam && !breakTime && (
              <div className="mt-8 w-full">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Study Content</h3>
                  
                  {suggestedChapters.length > 0 && (
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={handleAddSuggestedChapters}
                    >
                      Add Today's Chapters
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="1"
                      placeholder={currentExam?.usePages ? "Add page number" : "Add chapter number"}
                      value={chapterInput}
                      onChange={(e) => setChapterInput(e.target.value)}
                    />
                  </div>
                  <Button size="sm" onClick={handleAddChapter} disabled={!chapterInput}>
                    Add
                  </Button>
                </div>
                
                {suggestedChapters.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground mb-2">
                      From today's study plan:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedChapters.map(chapter => (
                        <Badge key={chapter} variant="outline" className="px-2 py-1">
                          {currentExam?.usePages ? `Page ${chapter}` : `Ch. ${chapter}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {chapters.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {chapters.map(chapter => (
                      <div key={chapter} className="bg-muted px-2 py-1 rounded-md flex items-center gap-1">
                        <span className="text-sm">{currentExam?.usePages ? `Page ${chapter}` : `Ch. ${chapter}`}</span>
                        <button 
                          onClick={() => handleRemoveChapter(chapter)}
                          className="text-muted-foreground hover:text-destructive ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">
                    No {currentExam?.usePages ? "pages" : "chapters"} added yet
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session Complete!</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              You completed a study session of {Math.round(elapsedTime / 60)} minutes.
            </p>
            
            <div className="space-y-4">
              <div>
                <Label>Chapters/Pages Studied:</Label>
                {chapters.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {chapters.map(chapter => (
                      <div key={chapter} className="bg-muted px-2 py-1 rounded-md">
                        {currentExam?.usePages ? `Page ${chapter}` : `Chapter ${chapter}`}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    No chapters/pages added
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="markCompleted" 
                  checked={markChaptersCompleted} 
                  onCheckedChange={(checked) => setMarkChaptersCompleted(!!checked)} 
                />
                <label
                  htmlFor="markCompleted"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Mark these chapters as completed in study plan
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteSession}>
              Save Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PomodoroTimerUpgraded;
