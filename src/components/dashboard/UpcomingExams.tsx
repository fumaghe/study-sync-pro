
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { differenceInDays } from 'date-fns';
import ExamCard from '@/components/exams/ExamCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const UpcomingExams: React.FC = () => {
  const { exams } = useAppContext();
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time part
  
  const upcomingExams = exams
    .filter(exam => {
      const examDate = new Date(exam.date);
      return examDate >= today;
    })
    .sort((a, b) => {
      const daysToA = differenceInDays(new Date(a.date), today);
      const daysToB = differenceInDays(new Date(b.date), today);
      return daysToA - daysToB;
    });
    
  const hasExams = upcomingExams.length > 0;

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Upcoming Exams</CardTitle>
          <Link to="/exams">
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              {hasExams ? 'View All' : 'Add Exam'}
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {hasExams ? (
          <div className="grid gap-3 sm:gap-4">
            {upcomingExams.slice(0, 3).map((exam) => (
              <ExamCard key={exam.id} exam={exam} compact />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <p className="text-muted-foreground mb-4">No upcoming exams found</p>
            <Link to="/exams">
              <Button>Add Your First Exam</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingExams;
