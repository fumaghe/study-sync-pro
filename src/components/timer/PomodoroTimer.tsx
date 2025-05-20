
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StudySession } from '@/types';
import { toast } from "sonner";

const PomodoroTimer: React.FC = () => {
  const { exams, settings, studySessions, addStudySession } = useAppContext();
  const [timerState, setTimerState] = useState<'idle' | 'work' | 'break'>('idle');
  const [timeLeft, setTimeLeft] = useState(settings.pomodoroWork * 60);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedChapters, setSelectedChapters] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store session data
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const sessionRef = useRef<StudySession | null>(null);
  
  // Reset timer when settings change
  useEffect(() => {
    if (timerState === 'idle') {
      setTimeLeft(settings.pomodoroWork * 60);
    }
  }, [settings.pomodoroWork, timerState]);
  
  useEffect(() => {
    // Clean up timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    // Request notification permission when component mounts
    if ('Notification' in window && settings.notifications) {
      Notification.requestPermission();
    }
  }, [settings.notifications]);
  
  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted' && settings.notifications) {
      new Notification(title, {
        body,
        icon: '/favicon.ico'
      });
    }
  };
  
  const startTimer = () => {
    if (!selectedExamId) {
      toast.error("Please select an exam first");
      return;
    }
    
    // Initialize new session
    sessionRef.current = {
      id: '',
      examId: selectedExamId,
      date: new Date().toISOString(),
      duration: 0, // Will update this at the end
      chapters: selectedChapters,
      notes: notes || undefined
    };
    
    setSessionMinutes(0);
    setTimerState('work');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          if (timerState === 'work') {
            showNotification('Break Time!', 'Time for a short break. Get up, stretch, and relax.');
            setTimerState('break');
            setTimeLeft(settings.pomodoroBreak * 60);
            
            // Update session minutes
            setSessionMinutes(prev => prev + settings.pomodoroWork);
          } else {
            showNotification('Back to Work!', 'Break is over. Let\'s get back to studying!');
            setTimerState('work');
            setTimeLeft(settings.pomodoroWork * 60);
          }
        }
        return prevTime - 1;
      });
    }, 1000);
  };
  
  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  
  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Save session if we've been studying
    if (sessionRef.current && sessionMinutes > 0) {
      addStudySession({
        ...sessionRef.current,
        duration: sessionMinutes
      });
    }
    
    setTimerState('idle');
    setTimeLeft(settings.pomodoroWork * 60);
    sessionRef.current = null;
    setSessionMinutes(0);
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const calculateProgress = (): number => {
    const totalSeconds = timerState === 'work' 
      ? settings.pomodoroWork * 60 
      : settings.pomodoroBreak * 60;
    return ((totalSeconds - timeLeft) / totalSeconds) * 100;
  };
  
  const selectedExam = exams.find(exam => exam.id === selectedExamId);
  
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Focus Timer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Timer display */}
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-48 h-48 rounded-full relative flex items-center justify-center mb-4">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="transparent" 
                  stroke="currentColor" 
                  strokeWidth="4" 
                  className="text-secondary" 
                />
                
                {/* Progress circle */}
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="transparent" 
                  stroke={timerState === 'work' ? '#9b87f5' : '#7E69AB'} 
                  strokeWidth="4" 
                  strokeLinecap="round"
                  strokeDasharray="282.74"
                  strokeDashoffset={282.74 - (calculateProgress() / 100 * 282.74)}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold">{formatTime(timeLeft)}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {timerState === 'work' ? 'Focus' : timerState === 'break' ? 'Break' : 'Ready'}
                </span>
              </div>
            </div>
            
            {/* Timer controls */}
            <div className="flex gap-2">
              {timerState === 'idle' ? (
                <Button onClick={startTimer} disabled={!selectedExamId}>
                  Start
                </Button>
              ) : (
                <>
                  {timerRef.current ? (
                    <Button variant="outline" onClick={pauseTimer}>
                      Pause
                    </Button>
                  ) : (
                    <Button onClick={startTimer}>
                      Resume
                    </Button>
                  )}
                  <Button variant="destructive" onClick={resetTimer}>
                    End Session
                  </Button>
                </>
              )}
            </div>
            
            {sessionMinutes > 0 && (
              <p className="text-sm mt-2">
                Session time: <span className="font-semibold">{sessionMinutes} minutes</span>
              </p>
            )}
          </div>
          
          {/* Exam selection */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Select Exam</label>
              <Select
                value={selectedExamId || ''}
                onValueChange={setSelectedExamId}
                disabled={timerState !== 'idle'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedExam && (
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Chapters (select 1-{selectedExam.chapters})
                </label>
                <Slider 
                  defaultValue={[1]} 
                  min={1}
                  max={selectedExam.chapters}
                  step={1}
                  onValueChange={(value) => setSelectedChapters(value)}
                  disabled={timerState !== 'idle'}
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Chapter 1</span>
                  <span>Chapter {selectedExam.chapters}</span>
                </div>
                <div className="mt-2 text-sm">
                  {selectedChapters.length > 0 && (
                    <p>Selected: Chapter {selectedChapters.join(', ')}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PomodoroTimer;
