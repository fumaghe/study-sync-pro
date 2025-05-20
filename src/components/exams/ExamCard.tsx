
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Exam } from '@/types';
import { format, differenceInDays } from 'date-fns';
import { useAppContext } from '@/contexts/AppContext';
import ProgressRing from '@/components/ui/ProgressRing';

interface ExamCardProps {
  exam: Exam;
  compact?: boolean;
  onEdit?: () => void;
}

const ExamCard: React.FC<ExamCardProps> = ({ exam, compact = false, onEdit }) => {
  const { studyDays, studySessions, deleteExam } = useAppContext();
  
  const examDate = new Date(exam.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time part
  
  const daysUntilExam = differenceInDays(examDate, today);
  const isPastExam = daysUntilExam < 0;
  
  // Calculate progress
  const totalStudiedHours = studySessions
    .filter(session => session.examId === exam.id)
    .reduce((total, session) => total + (session.duration / 60), 0);
    
  // Count completed chapters from study days
  const completedChapters = new Set<number>();
  studyDays.forEach(day => {
    day.exams
      .filter(dayExam => dayExam.examId === exam.id && dayExam.completed)
      .forEach(dayExam => {
        dayExam.chapters.forEach(chapter => completedChapters.add(chapter));
      });
  });
  
  const progress = exam.chapters > 0 ? (completedChapters.size / exam.chapters) * 100 : 0;
  
  const priorityColor = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  
  if (compact) {
    return (
      <Card className="card-hover overflow-hidden" style={{ borderTopColor: exam.color, borderTopWidth: '3px' }}>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-base truncate">{exam.name}</h3>
            <Badge className={priorityColor[exam.priority]}>{exam.priority}</Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className={isPastExam ? 'text-destructive' : ''}>
              {isPastExam 
                ? `${Math.abs(daysUntilExam)} days ago` 
                : `${daysUntilExam} days left`}
            </span>
            <span>{format(examDate, 'MMM dd')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="card-hover overflow-hidden" style={{ borderTopColor: exam.color, borderTopWidth: '3px' }}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{exam.name}</CardTitle>
          <Badge className={priorityColor[exam.priority]}>{exam.priority}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Date</p>
            <p className="font-medium">{format(examDate, 'MMMM dd, yyyy')}</p>
            <p className={`text-sm mt-1 ${isPastExam ? 'text-destructive' : 'text-muted-foreground'}`}>
              {isPastExam 
                ? `${Math.abs(daysUntilExam)} days ago` 
                : `${daysUntilExam} days left`}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Chapters</p>
            <p className="font-medium">{exam.chapters}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {completedChapters.size} completed
            </p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Initial Level</p>
            <p className="font-medium">{exam.initialLevel}/5</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex-shrink-0">
            <ProgressRing 
              progress={progress} 
              strokeWidth={4} 
              radius={30} 
              color={exam.color || '#9b87f5'} 
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Progress</p>
            <p className="font-medium">{Math.round(progress)}% complete</p>
            <p className="text-sm text-muted-foreground mt-1">
              {totalStudiedHours.toFixed(1)} hours studied
            </p>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => deleteExam(exam.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExamCard;
