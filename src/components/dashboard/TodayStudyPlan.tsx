
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const TodayStudyPlan: React.FC = () => {
  const { exams, studyDays, updateStudyDay } = useAppContext();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayPlan = studyDays.find(day => day.date === today);
  
  const toggleChapterCompletion = (examId: string, chapterIndex: number, completed: boolean) => {
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
  
  const toggleExamCompletion = (examId: string, completed: boolean) => {
    if (!todayPlan) return;
    
    const updatedPlan = {
      ...todayPlan,
      exams: todayPlan.exams.map(exam => {
        if (exam.examId === examId) {
          return {
            ...exam,
            completed
          };
        }
        return exam;
      })
    };
    
    updateStudyDay(updatedPlan);
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
              
              return (
                <div key={exam.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`exam-${exam.id}`}
                        checked={examDay.completed}
                        onCheckedChange={(checked) => 
                          toggleExamCompletion(exam.id, checked === true)
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
                      {examDay.plannedHours} hours
                    </span>
                  </div>
                  
                  {examDay.chapters.length > 0 ? (
                    <div className="pl-6 space-y-1 text-sm">
                      {examDay.chapters.map((chapter, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`exam-${exam.id}-chapter-${index}`}
                            checked={examDay.completed}
                            onCheckedChange={(checked) => 
                              toggleChapterCompletion(exam.id, index, checked === true)
                            }
                          />
                          <label 
                            htmlFor={`exam-${exam.id}-chapter-${index}`}
                            className={`text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${examDay.completed ? 'line-through text-muted-foreground' : ''}`}
                          >
                            Chapter {chapter}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pl-6 text-xs text-muted-foreground">
                      Review day - Practice all chapters
                    </div>
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
    </Card>
  );
};

export default TodayStudyPlan;
