
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Exam } from '@/types';

const TodayStudyPlan: React.FC = () => {
  const { exams, studyDays, updateStudyDay } = useAppContext();
  const [editingExam, setEditingExam] = React.useState<{
    examId: string;
    hours: number;
  } | null>(null);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayPlan = studyDays.find(day => day.date === today);
  
  const formatUnitRange = (chapters: number[], exam?: Exam): string => {
    if (!chapters.length) return 'All content';
    if (!exam) return chapters.join(', ');
    
    if (exam.usePages) {
      const min = Math.min(...chapters);
      const max = Math.max(...chapters);
      return `Pages ${min}–${max}`;
    } else {
      return `Chapter ${chapters.join(', ')}`;
    }
  };
  
  const handleToggleChapterCompletion = (examId: string, chapterIndex: number, completed: boolean) => {
    if (!todayPlan) return;
    
    const updatedPlan = {
      ...todayPlan,
      exams: todayPlan.exams.map(exam => {
        if (exam.examId === examId) {
          // Find if we need to update the chapter completion
          const updatedChapters = exam.chapters.map((chapter, idx) => 
            idx === chapterIndex ? (completed ? chapter : chapter) : chapter
          );
          
          return {
            ...exam,
            completed: completed && exam.chapters.length === 1
          };
        }
        return exam;
      })
    };
    
    updateStudyDay(updatedPlan);
  };
  
  const handleToggleExamCompletion = (examId: string, completed: boolean) => {
    if (!todayPlan) return;
    
    if (completed) {
      // Open dialog to input actual hours
      const examDay = todayPlan.exams.find(e => e.examId === examId);
      if (examDay) {
        setEditingExam({
          examId,
          hours: examDay.plannedHours
        });
      }
    } else {
      // Just mark as not completed
      const updatedPlan = {
        ...todayPlan,
        exams: todayPlan.exams.map(exam => {
          if (exam.examId === examId) {
            return {
              ...exam,
              completed: false
            };
          }
          return exam;
        })
      };
      
      updateStudyDay(updatedPlan);
    }
  };
  
  const handleSaveActualStudy = () => {
    if (!editingExam || !todayPlan) return;
    
    const updatedPlan = {
      ...todayPlan,
      exams: todayPlan.exams.map(exam => {
        if (exam.examId === editingExam.examId) {
          return {
            ...exam,
            completed: true,
            actualHours: editingExam.hours
          };
        }
        return exam;
      })
    };
    
    updateStudyDay(updatedPlan);
    setEditingExam(null);
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Today's Study Plan</CardTitle>
          <Link to="/plan">
            <Button variant="outline" size="sm">
              Full Plan
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {todayPlan && todayPlan.exams.length > 0 ? (
          <div className="space-y-6">
            {todayPlan.exams.map((examDay) => {
              const exam = exams.find(e => e.id === examDay.examId);
              if (!exam) return null;
              
              const isReviewDay = examDay.isReview || examDay.chapters.length === 0;
              
              return (
                <div key={exam.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`exam-${exam.id}`}
                        checked={examDay.completed}
                        onCheckedChange={(checked) => 
                          handleToggleExamCompletion(exam.id, checked === true)
                        }
                      />
                      <label 
                        htmlFor={`exam-${exam.id}`}
                        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${examDay.completed ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {exam.name}
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {examDay.actualHours > 0 ? `${examDay.actualHours}h done of ` : ''}{examDay.plannedHours}h planned
                    </span>
                  </div>
                  
                  {isReviewDay ? (
                    <div className="pl-6 text-xs text-muted-foreground">
                      Review day - Practice all {exam.usePages ? 'pages' : 'chapters'}
                    </div>
                  ) : examDay.chapters.length > 0 ? (
                    <div className="pl-6 space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`exam-${exam.id}-chapters`}
                          checked={examDay.completed}
                          onCheckedChange={(checked) => 
                            handleToggleChapterCompletion(exam.id, 0, checked === true)
                          }
                        />
                        <label 
                          htmlFor={`exam-${exam.id}-chapters`}
                          className={`text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${examDay.completed ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {formatUnitRange(examDay.chapters, exam)}
                        </label>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : todayPlan && todayPlan.exams.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No study tasks scheduled for today
            </p>
            <Link to="/plan">
              <Button>Update Study Plan</Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No study plan generated yet
            </p>
            <Link to="/exams">
              <Button>Start by Adding Exams</Button>
            </Link>
          </div>
        )}
      </CardContent>
      
      {/* Dialog for editing actual study progress */}
      <Dialog open={!!editingExam} onOpenChange={(open) => !open && setEditingExam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Study Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Hours Actually Studied</label>
              <Input 
                type="number"
                min="0"
                step="0.1"
                value={editingExam?.hours || 0}
                onChange={(e) => setEditingExam(prev => 
                  prev ? {...prev, hours: parseFloat(e.target.value) || 0} : null
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingExam(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveActualStudy}>
              Save Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TodayStudyPlan;
