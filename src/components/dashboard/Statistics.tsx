
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { addDays, differenceInDays, format, parseISO, startOfDay, subDays } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, 
  PieChart, Pie, Cell
} from 'recharts';

const Statistics: React.FC = () => {
  const { exams, studySessions } = useAppContext();
  const today = startOfDay(new Date());

  // Calculate total study hours in the last 7 days
  const lastWeek = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dayStr = format(date, 'yyyy-MM-dd');
    
    const hoursStudied = studySessions
      .filter(session => session.date.startsWith(dayStr))
      .reduce((sum, session) => sum + session.duration / 60, 0);
    
    return {
      day: format(date, 'EEE'),
      hours: Math.round(hoursStudied * 10) / 10, // Round to 1 decimal place
    };
  });

  // Calculate hours per exam
  const examHours = exams.map(exam => {
    const hoursStudied = studySessions
      .filter(session => session.examId === exam.id)
      .reduce((sum, session) => sum + session.duration / 60, 0);
    
    return {
      name: exam.name,
      hours: Math.round(hoursStudied * 10) / 10,
      color: exam.color,
    };
  }).filter(item => item.hours > 0);
  
  // Calculate some stats
  const totalHoursStudied = examHours.reduce((sum, item) => sum + item.hours, 0);
  const totalSessions = studySessions.length;
  
  const upcomingExamsCount = exams.filter(exam => {
    const examDate = parseISO(exam.date);
    return differenceInDays(examDate, today) >= 0;
  }).length;
  
  // Find closest exam
  const closestExam = exams
    .filter(exam => {
      const examDate = parseISO(exam.date);
      return differenceInDays(examDate, today) >= 0;
    })
    .sort((a, b) => {
      const daysToA = differenceInDays(parseISO(a.date), today);
      const daysToB = differenceInDays(parseISO(b.date), today);
      return daysToA - daysToB;
    })[0];
  
  const daysToClosestExam = closestExam 
    ? differenceInDays(parseISO(closestExam.date), today) 
    : null;

  const COLORS = ['#9b87f5', '#7E69AB', '#3498db', '#2ecc71', '#e74c3c', '#f39c12'];

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-accent rounded-lg">
            <p className="text-2xl font-bold">{Math.round(totalHoursStudied)}</p>
            <p className="text-sm text-muted-foreground">Total hours</p>
          </div>
          <div className="text-center p-4 bg-accent rounded-lg">
            <p className="text-2xl font-bold">{totalSessions}</p>
            <p className="text-sm text-muted-foreground">Study sessions</p>
          </div>
          <div className="text-center p-4 bg-accent rounded-lg">
            <p className="text-2xl font-bold">{upcomingExamsCount}</p>
            <p className="text-sm text-muted-foreground">Upcoming exams</p>
          </div>
          <div className="text-center p-4 bg-accent rounded-lg">
            <p className="text-2xl font-bold">{daysToClosestExam !== null ? daysToClosestExam : '-'}</p>
            <p className="text-sm text-muted-foreground">Days to next exam</p>
          </div>
        </div>

        {lastWeek.some(day => day.hours > 0) && (
          <div className="space-y-2 mb-6">
            <h3 className="text-sm font-medium">Study Hours (Last 7 Days)</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lastWeek} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`${value} hrs`, 'Hours']} />
                  <Bar dataKey="hours" fill="#9b87f5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {examHours.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Hours by Exam</h3>
            <div className="h-64 flex flex-col items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={examHours}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="hours"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {examHours.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} hrs`, 'Hours']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Statistics;
