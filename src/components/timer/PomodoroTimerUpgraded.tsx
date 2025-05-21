
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import ProgressRing from '@/components/ui/ProgressRing';
import { Play, Pause, Timer } from 'lucide-react';
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

enum TimerState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  BREAK = 'break',
  COMPLETE = 'complete'
}

const PomodoroTimerUpgraded: React.FC = () => {
  const { exams, addStudySession, settings } = useAppContext();
  const { toast } = useToast();
  
  // Timer state
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [chapters, setChapters] = useState<number[]>([]);
  const [timerState, setTimerState] = useState<TimerState>(TimerState.IDLE);
  const [timeLeft, setTimeLeft] = useState<number>(settings.pomodoroWork * 60);
  const [initialTime, setInitialTime] = useState<number>(settings.pomodoroWork * 60);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [showCompleteDialog, setShowCompleteDialog] = useState<boolean>(false);
  const [chapterInput, setChapterInput] = useState<string>("");
  
  // Refs to store interval ID and last tick time for more accurate timing
  const timerRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  
  // Initialize the timer with settings
  useEffect(() => {
    if (timerState === TimerState.IDLE) {
      setTimeLeft(settings.pomodoroWork * 60);
      setInitialTime(settings.pomodoroWork * 60);
    }
  }, [settings.pomodoroWork, timerState]);
  
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
            
            // If we're in work mode, prompt for completion
            if (timerState === TimerState.RUNNING) {
              setElapsedTime(initialTime);
              setShowCompleteDialog(true);
              setTimerState(TimerState.COMPLETE);
            }
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
    setTimeLeft(settings.pomodoroWork * 60);
    setInitialTime(settings.pomodoroWork * 60);
    setElapsedTime(0);
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
  
  // Complete a session
  const handleCompleteSession = () => {
    if (selectedExam) {
      // Calculate duration in minutes (rounding to nearest minute)
      const durationMinutes = Math.round(elapsedTime / 60);
      
      addStudySession({
        examId: selectedExam,
        date: new Date().toISOString(),
        duration: durationMinutes,
        chapters: [...chapters]
      });
      
      toast({
        title: "Session saved",
        description: `Study session of ${durationMinutes} minutes recorded!`
      });
      
      // Reset timer and clear selection
      handleReset();
      setChapters([]);
      setShowCompleteDialog(false);
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
  
  return (
    <>
      <Card className="animate-fade-in">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <Select
                value={selectedExam}
                onValueChange={setSelectedExam}
                disabled={timerState !== TimerState.IDLE && timerState !== TimerState.COMPLETE}
              >
                <SelectTrigger className="w-[240px]">
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
            
            <div className="relative w-64 h-64">
              <ProgressRing 
                progress={progress}
                size={256}
                strokeWidth={8}
                color={timerState === TimerState.BREAK ? 'bg-green-500' : 'bg-primary'}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold">
                  {formatTime(timeLeft)}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {timerState === TimerState.RUNNING ? "Focus Time" : 
                   timerState === TimerState.PAUSED ? "Paused" :
                   timerState === TimerState.BREAK ? "Break Time" : "Ready"}
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-x-4">
              <Button onClick={handlePlayPause}>
                {(timerState === TimerState.IDLE || timerState === TimerState.PAUSED || timerState === TimerState.COMPLETE) ? 
                  <><Play className="mr-2 h-4 w-4" /> {timerState === TimerState.PAUSED ? "Resume" : "Start"}</> : 
                  <><Pause className="mr-2 h-4 w-4" /> Pause</>}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={timerState === TimerState.IDLE}>
                <Timer className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
            
            {selectedExam && (
              <div className="mt-6 w-full">
                <h3 className="mb-2 font-medium">Study Content</h3>
                
                <div className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Add chapter/page"
                      value={chapterInput}
                      onChange={(e) => setChapterInput(e.target.value)}
                    />
                  </div>
                  <Button size="sm" onClick={handleAddChapter} disabled={!chapterInput}>
                    Add
                  </Button>
                </div>
                
                {chapters.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {chapters.map(chapter => (
                      <div key={chapter} className="bg-muted px-2 py-1 rounded-md flex items-center gap-1">
                        <span className="text-sm">{chapter}</span>
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
                    No chapters/pages added yet
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
                        {chapter}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    No chapters/pages added
                  </p>
                )}
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
