
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  addDays, differenceInDays, format, parseISO, startOfDay, subDays, 
  isSameDay, isAfter, isBefore, differenceInWeeks 
} from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import { 
  CalendarDays, ChartLine, ChartBar, CircleHalf, CirclePercent
} from "lucide-react";

const Statistics: React.FC = () => {
  const { exams, studySessions, studyDays } = useAppContext();
  const isMobile = useIsMobile();
  const today = startOfDay(new Date());
  
  // Calculate study data for the last 7 days
  const lastWeek = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      const dayStr = format(date, 'yyyy-MM-dd');
      
      const hoursStudied = studySessions
        .filter(session => session.date.startsWith(dayStr))
        .reduce((sum, session) => sum + session.duration / 60, 0);
      
      return {
        day: format(date, 'EEE'),
        fullDate: dayStr,
        hours: Math.round(hoursStudied * 10) / 10, // Round to 1 decimal place
      };
    });
  }, [studySessions, today]);
  
  // Calculate hours per exam
  const examHours = useMemo(() => {
    return exams.map(exam => {
      const hoursStudied = studySessions
        .filter(session => session.examId === exam.id)
        .reduce((sum, session) => sum + session.duration / 60, 0);

      const totalUnits = exam.usePages ? (exam.pages || 0) : exam.chapters;
      let completedUnits = 0;
      
      studyDays.forEach(day => {
        day.exams.forEach(examDay => {
          if (examDay.examId === exam.id && examDay.completed) {
            completedUnits += examDay.chapters.length;
          }
        });
      });
      
      const progress = totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0;
      
      return {
        id: exam.id,
        name: exam.name,
        hours: Math.round(hoursStudied * 10) / 10,
        color: exam.color,
        progress: Math.min(100, Math.round(progress)),
        completedUnits,
        totalUnits,
        date: exam.date,
        daysLeft: differenceInDays(parseISO(exam.date), today)
      };
    }).filter(item => item.hours > 0 || item.daysLeft >= 0);
  }, [exams, studySessions, studyDays, today]);
  
  // Calculate streak and consistent study days
  const studyStreak = useMemo(() => {
    let currentStreak = 0;
    let longestStreak = 0;
    let previousDate: Date | null = null;
    
    // Group sessions by date
    const sessionsByDate = studySessions.reduce((acc, session) => {
      const dateStr = session.date.split('T')[0];
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(session);
      return acc;
    }, {} as Record<string, StudySession[]>);
    
    // Convert to array of dates and sort
    const studyDates = Object.keys(sessionsByDate)
      .map(dateStr => parseISO(dateStr))
      .sort((a, b) => a.getTime() - b.getTime());
    
    // Calculate streaks
    studyDates.forEach(date => {
      if (!previousDate) {
        currentStreak = 1;
      } else {
        const dayDiff = differenceInDays(date, previousDate);
        if (dayDiff === 1) {
          currentStreak++;
        } else if (dayDiff > 1) {
          currentStreak = 1;
        }
      }
      
      longestStreak = Math.max(longestStreak, currentStreak);
      previousDate = date;
    });
    
    // Check if streak is still active
    const lastStudyDate = studyDates[studyDates.length - 1];
    const isActiveStreak = lastStudyDate && differenceInDays(today, lastStudyDate) <= 1;
    
    return {
      current: isActiveStreak ? currentStreak : 0,
      longest: longestStreak,
      daysStudied: studyDates.length,
      consistency: studyDates.length > 0 
        ? Math.round((studyDates.length / (differenceInDays(today, studyDates[0]) + 1)) * 100) 
        : 0
    };
  }, [studySessions, today]);
  
  // Calculate average hours studied per active day
  const avgHoursPerStudyDay = useMemo(() => {
    if (studySessions.length === 0) return 0;
    
    const totalHours = studySessions.reduce((sum, session) => sum + session.duration / 60, 0);
    const uniqueDays = new Set(studySessions.map(session => session.date.split('T')[0])).size;
    
    return uniqueDays > 0 ? Math.round((totalHours / uniqueDays) * 10) / 10 : 0;
  }, [studySessions]);
  
  // Calculate exams with risk (low progress compared to days left)
  const examsAtRisk = useMemo(() => {
    return examHours
      .filter(exam => exam.daysLeft > 0)
      .map(exam => {
        const progressPercentage = exam.progress;
        const timePercentage = 100 - ((exam.daysLeft / (differenceInDays(parseISO(exam.date), today) + exam.daysLeft)) * 100);
        const discrepancy = timePercentage - progressPercentage;
        
        let riskLevel = "low";
        if (discrepancy > 40) riskLevel = "high";
        else if (discrepancy > 20) riskLevel = "medium";
        
        return {
          ...exam,
          discrepancy,
          riskLevel
        };
      })
      .sort((a, b) => b.discrepancy - a.discrepancy);
  }, [examHours, today]);
  
  // Find closest exam
  const closestExam = useMemo(() => {
    return exams
      .filter(exam => {
        const examDate = parseISO(exam.date);
        return differenceInDays(examDate, today) >= 0;
      })
      .sort((a, b) => {
        const daysToA = differenceInDays(parseISO(a.date), today);
        const daysToB = differenceInDays(parseISO(b.date), today);
        return daysToA - daysToB;
      })[0];
  }, [exams, today]);
  
  const daysToClosestExam = closestExam 
    ? differenceInDays(parseISO(closestExam.date), today) 
    : null;

  // Calculate completed pages or chapters
  const totalCompleted = useMemo(() => {
    let totalCompleted = 0;
    
    studyDays.forEach(day => {
      day.exams.forEach(examDay => {
        if (examDay.completed) {
          totalCompleted += examDay.chapters.length;
        }
      });
    });
    
    return totalCompleted;
  }, [studyDays]);
  
  // Calculate total hours studied
  const totalHoursStudied = examHours.reduce((sum, item) => sum + item.hours, 0);
  const totalSessions = studySessions.length;
  
  const upcomingExamsCount = exams.filter(exam => {
    const examDate = parseISO(exam.date);
    return differenceInDays(examDate, today) >= 0;
  }).length;
  
  // Color helpers
  const getRiskColor = (riskLevel: string) => {
    switch(riskLevel) {
      case "high": return "#e74c3c";
      case "medium": return "#f39c12";
      default: return "#2ecc71";
    }
  };
  
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "#2ecc71";
    if (progress >= 50) return "#f39c12";
    return "#e74c3c";
  };
  
  const COLORS = ['#9b87f5', '#7E69AB', '#3498db', '#2ecc71', '#e74c3c', '#f39c12'];

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartBar className="h-5 w-5" />
          Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="text-center p-3 sm:p-4 bg-accent rounded-lg">
            <p className="text-xl sm:text-2xl font-bold">{Math.round(totalHoursStudied)}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Total hours</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-accent rounded-lg">
            <p className="text-xl sm:text-2xl font-bold">{avgHoursPerStudyDay}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Avg hrs/day</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-accent rounded-lg">
            <p className="text-xl sm:text-2xl font-bold">{totalCompleted}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Units completed</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-accent rounded-lg">
            <p className="text-xl sm:text-2xl font-bold">{studyStreak.current}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Day streak</p>
          </div>
        </div>
        
        {/* Second row stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="text-center p-3 sm:p-4 bg-accent rounded-lg">
            <p className="text-xl sm:text-2xl font-bold">{totalSessions}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Study sessions</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-accent rounded-lg">
            <p className="text-xl sm:text-2xl font-bold">{studyStreak.consistency}%</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Consistency</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-accent rounded-lg">
            <p className="text-xl sm:text-2xl font-bold">{upcomingExamsCount}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Upcoming exams</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-accent rounded-lg">
            <p className="text-xl sm:text-2xl font-bold">{daysToClosestExam !== null ? daysToClosestExam : '-'}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Days to next exam</p>
          </div>
        </div>

        {/* Study Hours Chart */}
        {lastWeek.some(day => day.hours > 0) && (
          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-medium flex items-center gap-1">
              <ChartLine className="h-4 w-4" />
              Study Hours (Last 7 Days)
            </h3>
            <div className={`h-${isMobile ? '32' : '40'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lastWeek} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9b87f5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#9b87f5" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => [`${value} hrs`, 'Hours']} />
                  <Area 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="#9b87f5" 
                    fillOpacity={1} 
                    fill="url(#colorHours)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Exam Progress Section */}
        {examHours.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-medium flex items-center gap-1">
              <CirclePercent className="h-4 w-4" />
              Exam Progress
            </h3>
            <div className="space-y-3">
              {examHours
                .filter(exam => exam.daysLeft >= 0)
                .sort((a, b) => a.daysLeft - b.daysLeft)
                .slice(0, 4)
                .map(exam => (
                  <div key={exam.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="font-medium truncate" style={{maxWidth: '60%'}} title={exam.name}>
                        {exam.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={exam.daysLeft < 7 ? "destructive" : "secondary"} className="text-[10px]">
                          {exam.daysLeft} days left
                        </Badge>
                        <span className="font-semibold">{exam.progress}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-accent rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${exam.progress}%`, 
                          backgroundColor: getProgressColor(exam.progress)
                        }}
                      />
                    </div>
                  </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Exams at Risk */}
        {examsAtRisk.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-medium flex items-center gap-1">
              <CircleHalf className="h-4 w-4" />
              Exams Needing Attention
            </h3>
            <div className="space-y-2">
              {examsAtRisk.slice(0, 2).map(exam => (
                <div 
                  key={exam.id} 
                  className="flex justify-between items-center p-2 rounded-md border" 
                  style={{ borderColor: getRiskColor(exam.riskLevel) }}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate" style={{maxWidth: '150px'}} title={exam.name}>
                      {exam.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Progress: {exam.progress}% (Target: {Math.round(100 - ((exam.daysLeft / (differenceInDays(parseISO(exam.date), today) + exam.daysLeft)) * 100))}%)
                    </span>
                  </div>
                  <Badge 
                    className="capitalize" 
                    style={{
                      backgroundColor: getRiskColor(exam.riskLevel),
                      color: 'white'
                    }}
                  >
                    {exam.riskLevel} risk
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hours Distribution Pie Chart */}
        {examHours.length > 0 && !isMobile && (
          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-medium flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              Hours by Exam
            </h3>
            <div className="h-48 flex flex-col items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={examHours}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="hours"
                    nameKey="name"
                    label={({ name, percent }) => 
                      isMobile ? 
                        `${(percent * 100).toFixed(0)}%` : 
                        `${name}: ${(percent * 100).toFixed(0)}%`
                    }
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
