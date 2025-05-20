
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StudyCalendar from '@/components/calendar/StudyCalendar';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Exam } from '@/types';

const StudyPlanPage: React.FC = () => {
  const { exams, studyDays, updateStudyDay, generateStudyPlan } = useAppContext();
  const [editingDay, setEditingDay] = React.useState<{
    date: string;
    examId: string;
    hours: number;
    currentChapters: number[];
  } | null>(null);
  
  // Group study days by week for better visualization
  const groupedDays = studyDays.reduce<{ [weekKey: string]: typeof studyDays }>((acc, day) => {
    const date = parseISO(day.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = format(weekStart, 'yyyy-MM-dd');
    
    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    
    acc[weekKey].push(day);
    return acc;
  }, {});
  
  // Sort weeks chronologically
  const sortedWeeks = Object.keys(groupedDays).sort();
  
  // Check for empty but available days (for optimization suggestion)
  const emptyAvailableDays = studyDays.filter(day => day.available && day.exams.length === 0);
  const hasEmptyDays = emptyAvailableDays.length > 0;
  
  const handleToggleCompletion = (day: string, examId: string, completed: boolean) => {
    const studyDay = studyDays.find(d => d.date === day);
    if (!studyDay) return;
    
    if (completed) {
      // Open the edit dialog when marking as complete
      const examDay = studyDay.exams.find(e => e.examId === examId);
      if (examDay) {
        setEditingDay({
          date: day,
          examId,
          hours: examDay.plannedHours,
          currentChapters: [...examDay.chapters],
        });
      }
    } else {
      // Just update completion status when unchecking
      const updatedDay = {
        ...studyDay,
        exams: studyDay.exams.map(exam => {
          if (exam.examId === examId) {
            return {
              ...exam,
              completed: false
            };
          }
          return exam;
        })
      };
      
      updateStudyDay(updatedDay);
    }
  };
  
  const handleSaveActualStudy = () => {
    if (!editingDay) return;
    
    const studyDay = studyDays.find(d => d.date === editingDay.date);
    if (!studyDay) return;
    
    const updatedDay = {
      ...studyDay,
      exams: studyDay.exams.map(exam => {
        if (exam.examId === editingDay.examId) {
          return {
            ...exam,
            completed: true,
            actualHours: editingDay.hours
          };
        }
        return exam;
      })
    };
    
    updateStudyDay(updatedDay);
    setEditingDay(null);
  };
  
  const formatUnitRange = (chapters: number[], exam?: Exam): string => {
    if (!chapters.length) return 'All content';
    if (!exam) return chapters.join(', ');
    
    if (exam.usePages) {
      const min = Math.min(...chapters);
      const max = Math.max(...chapters);
      return `Pages ${min}–${max}`;
    } else {
      return `Chapters: ${chapters.join(', ')}`;
    }
  };
  
  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Study Plan</h1>
        <Button onClick={() => generateStudyPlan()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate Plan
        </Button>
      </div>
      
      {hasEmptyDays && (
        <Alert className="mb-6 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            There are {emptyAvailableDays.length} available days with no study tasks assigned. 
            Consider regenerating the plan to optimize your schedule.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <StudyCalendar />
        </div>
        
        <div className="md:col-span-2">
          {sortedWeeks.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <h2 className="text-2xl font-medium mb-2">No study plan yet</h2>
                <p className="text-muted-foreground mb-6">
                  Click the button above to generate your personalized study plan
                </p>
                <Button onClick={() => generateStudyPlan()}>
                  Generate Study Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {sortedWeeks.map(weekKey => {
                const days = groupedDays[weekKey];
                const weekStart = parseISO(weekKey);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                
                return (
                  <Card key={weekKey}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        Week of {format(weekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {days.map(day => {
                          const dayDate = parseISO(day.date);
                          
                          if (!day.available || day.exams.length === 0) {
                            return (
                              <div key={day.date} className="py-2 px-4 rounded-md border border-dashed flex items-center">
                                <span className="text-muted-foreground">
                                  {format(dayDate, 'EEEE, MMM d')} - {!day.available ? 'Day Off' : 'No study tasks'}
                                </span>
                              </div>
                            );
                          }
                          
                          return (
                            <div key={day.date} className="border rounded-md overflow-hidden">
                              <div className="bg-muted/50 py-2 px-4 flex justify-between items-center">
                                <span className="font-medium">{format(dayDate, 'EEEE, MMM d')}</span>
                                <span className="text-sm text-muted-foreground">{day.availableHours} hours available</span>
                              </div>
                              <div className="divide-y">
                                {day.exams.map(examDay => {
                                  const exam = exams.find(e => e.id === examDay.examId);
                                  if (!exam) return null;
                                  
                                  const isReviewDay = examDay.isReview || examDay.chapters.length === 0;
                                  
                                  return (
                                    <div key={exam.id} className="py-3 px-4 flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <Checkbox 
                                          id={`${day.date}-${exam.id}`}
                                          checked={examDay.completed}
                                          onCheckedChange={(checked) => 
                                            handleToggleCompletion(day.date, exam.id, checked === true)
                                          }
                                        />
                                        <div className={`${examDay.completed ? 'line-through text-muted-foreground' : ''}`}>
                                          <p className="font-medium">{exam.name}</p>
                                          {isReviewDay ? (
                                            <p className="text-xs text-muted-foreground flex items-center">
                                              <Badge variant="outline" className="mr-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700">
                                                Review Day
                                              </Badge>
                                              Practice all {exam.usePages ? 'pages' : 'chapters'}
                                            </p>
                                          ) : examDay.chapters.length > 0 ? (
                                            <p className="text-xs text-muted-foreground">
                                              {formatUnitRange(examDay.chapters, exam)}
                                            </p>
                                          ) : (
                                            <p className="text-xs text-muted-foreground">General study</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {examDay.completed && examDay.actualHours > 0 && (
                                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700">
                                            {examDay.actualHours}h done
                                          </Badge>
                                        )}
                                        <Badge variant="outline">
                                          {examDay.plannedHours} hours
                                        </Badge>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Dialog for editing actual study progress */}
      <Dialog open={!!editingDay} onOpenChange={(open) => !open && setEditingDay(null)}>
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
                value={editingDay?.hours || 0}
                onChange={(e) => setEditingDay(prev => 
                  prev ? {...prev, hours: parseFloat(e.target.value) || 0} : null
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDay(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveActualStudy}>
              Save Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default StudyPlanPage;
