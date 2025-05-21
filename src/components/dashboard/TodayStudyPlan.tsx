
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Exam } from '@/types';
import { Label } from '@/components/ui/label';

interface CompletionDialogState {
  examId: string;
  hours: number;
  chapters: number[];
  allUnits?: boolean;
}

const TodayStudyPlan: React.FC = () => {
  const { exams, studyDays, updateStudyDay } = useAppContext();
  const [editingExam, setEditingExam] = useState<CompletionDialogState | null>(null);
  const [newUnitValue, setNewUnitValue] = useState<string>('');
  
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
  
  const handleToggleExamCompletion = (examId: string, completed: boolean) => {
    if (!todayPlan) return;
    
    if (completed) {
      // Open dialog to input actual hours and chapters studied
      const examDay = todayPlan.exams.find(e => e.examId === examId);
      if (examDay) {
        setEditingExam({
          examId,
          hours: examDay.plannedHours,
          chapters: [...examDay.chapters],
          allUnits: examDay.chapters.length === 0 || examDay.isReview
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
  
  const handleAddNewUnit = () => {
    if (!editingExam || !newUnitValue) return;
    
    const unitNum = parseInt(newUnitValue);
    if (isNaN(unitNum)) return;
    
    // Add the new unit if it doesn't already exist
    if (!editingExam.chapters.includes(unitNum)) {
      setEditingExam({
        ...editingExam,
        chapters: [...editingExam.chapters, unitNum].sort((a, b) => a - b)
      });
    }
    
    setNewUnitValue('');
  };
  
  const handleRemoveUnit = (unit: number) => {
    if (!editingExam) return;
    
    setEditingExam({
      ...editingExam,
      chapters: editingExam.chapters.filter(c => c !== unit)
    });
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
            actualHours: editingExam.hours,
            // Use the chapters from dialog even for review days
            chapters: editingExam.chapters
          };
        }
        return exam;
      })
    };
    
    updateStudyDay(updatedPlan);
    setEditingExam(null);
    setNewUnitValue('');
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
                    <div className="pl-6 text-xs text-muted-foreground">
                      {formatUnitRange(examDay.chapters, exam)}
                    </div>
                  ) : (
                    <div className="pl-6 text-xs text-muted-foreground">General study</div>
                  )}
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
      
      {/* Enhanced dialog for editing actual study progress */}
      <Dialog open={!!editingExam} onOpenChange={(open) => !open && setEditingExam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Study Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Hours Actually Studied</Label>
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
            
            <div className="space-y-2">
              <Label>
                {(() => {
                  const exam = exams.find(e => e.id === editingExam?.examId);
                  return exam?.usePages ? 'Pages Completed' : 'Chapters Completed';
                })()}
              </Label>
              
              {/* Display existing units */}
              {editingExam && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {editingExam.chapters.map((unit, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`unit-${unit}`}
                        checked={true}
                        onCheckedChange={(checked) => {
                          if (checked === false && editingExam.chapters.length > 1) {
                            handleRemoveUnit(unit);
                          }
                        }}
                      />
                      <Label htmlFor={`unit-${unit}`} className="text-sm">
                        {(() => {
                          const exam = exams.find(e => e.id === editingExam?.examId);
                          return exam?.usePages ? `Page ${unit}` : `Chapter ${unit}`;
                        })()}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add custom units */}
              {editingExam && (
                <div className="mt-4">
                  <Label className="text-sm mb-2 block">
                    Add {(() => {
                      const exam = exams.find(e => e.id === editingExam?.examId);
                      return exam?.usePages ? 'pages' : 'chapters';
                    })()}:
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={newUnitValue}
                      onChange={(e) => setNewUnitValue(e.target.value)}
                      className="w-24"
                      placeholder="e.g. 15"
                    />
                    <Button 
                      type="button" 
                      size="sm"
                      onClick={handleAddNewUnit}
                      disabled={!newUnitValue}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
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
