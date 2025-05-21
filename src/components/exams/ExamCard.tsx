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
  today.setHours(0, 0, 0, 0);

  const daysUntilExam = differenceInDays(examDate, today);
  const isPastExam = daysUntilExam < 0;

  // Ore totali studiate
  const totalStudiedHours = studySessions
    .filter(session => session.examId === exam.id)
    .reduce((total, session) => total + (session.duration / 60), 0);

  // Capitoli/pagine completati
  const completedUnits = new Set<number>();
  studyDays.forEach(day => {
    day.exams
      .filter(e => e.examId === exam.id && e.completed)
      .forEach(e => e.chapters.forEach(unit => completedUnits.add(unit)));
  });

  const totalUnits = exam.usePages ? exam.pages : exam.chapters;
  const progress = totalUnits ? (completedUnits.size / totalUnits) * 100 : 0;

  const priorityColor = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    high: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
  } as const;

  if (compact) {
    return (
      <Card
        className="card-hover overflow-hidden"
        style={{ borderTopColor: exam.color, borderTopWidth: '3px' }}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-base truncate">{exam.name}</h3>
            <Badge className={priorityColor[exam.priority]}>
              {exam.priority}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className={isPastExam ? 'text-destructive' : undefined}>
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
    <Card
      className="card-hover overflow-hidden"
      style={{ borderTopColor: exam.color, borderTopWidth: '3px' }}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{exam.name}</CardTitle>
          <Badge className={priorityColor[exam.priority]}>
            {exam.priority}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Date</p>
            <p className="font-medium">{format(examDate, 'MMMM dd, yyyy')}</p>
            <p
              className={`text-sm mt-1 ${
                isPastExam ? 'text-destructive' : 'text-muted-foreground'
              }`}
            >
              {isPastExam
                ? `${Math.abs(daysUntilExam)} days ago`
                : `${daysUntilExam} days left`}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {exam.usePages ? 'Pages' : 'Chapters'}
            </p>
            <p className="font-medium">
              {exam.usePages ? exam.pages : exam.chapters}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {completedUnits.size} completed
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Review Days</p>
            <p className="font-medium">
              {exam.customReviewDays !== undefined
                ? exam.customReviewDays
                : '3 (default)'}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Initial Level
            </p>
            <p className="font-medium">{exam.initialLevel}/10</p>
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
            <Button size="sm" variant="outline" onClick={onEdit}>
              Edit
            </Button>
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
