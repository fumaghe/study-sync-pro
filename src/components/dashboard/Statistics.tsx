
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { differenceInDays, parseISO, isBefore, isAfter, addDays, format } from 'date-fns';
import { 
  BookOpen, 
  Clock, 
  Calendar,
  CheckCheck, 
  TrendingUp,
  BarChart, 
  AlertTriangle,
  CircleCheck
} from 'lucide-react';
import ProgressRing from '@/components/ui/ProgressRing';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar
} from 'recharts';
import { useTranslation } from 'react-i18next';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: number;
  color?: string;
}

interface ExamProgressData {
  id: string;
  name: string;
  progress: number;
  daysLeft: number;
  isAtRisk: boolean;
}

const Statistics: React.FC = () => {
  const { exams, studyDays, studySessions } = useAppContext();
  const { t } = useTranslation();
  
  // Calculate various statistics
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate total hours studied
    const totalHours = studySessions.reduce((total, session) => {
      return total + (session.duration / 60);
    }, 0);
    
    // Calculate completed study days (days with at least one completed exam)
    const completedDays = new Set(
      studyDays
        .filter(day => day.exams.some(exam => exam.completed))
        .map(day => day.date)
    );
    
    // Calculate study streak (consecutive days)
    let currentStreak = 0;
    let maxStreak = 0;
    
    // Start from yesterday and go backwards
    let checkDate = addDays(today, -1);
    
    while (completedDays.has(format(checkDate, 'yyyy-MM-dd'))) {
      currentStreak++;
      checkDate = addDays(checkDate, -1);
    }
    
    // Calculate average study hours per day
    const avgHoursPerDay = completedDays.size > 0 
      ? totalHours / completedDays.size 
      : 0;
    
    // Find closest upcoming exam
    const upcomingExams = exams
      .filter(exam => isAfter(parseISO(exam.date), today))
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    
    const closestExam = upcomingExams.length > 0 ? upcomingExams[0] : null;
    const daysToNextExam = closestExam
      ? differenceInDays(parseISO(closestExam.date), today)
      : 0;
    
    // Calculate total completed units (pages/chapters)
    let completedUnits = 0;
    let totalUnits = 0;
    
    // Create a map for fast exam lookup
    const examsMap = new Map(exams.map(exam => [exam.id, exam]));
    
    studyDays.forEach(day => {
      day.exams.forEach(examDay => {
        if (examDay.completed) {
          completedUnits += examDay.chapters.length;
        }
        
        const exam = examsMap.get(examDay.examId);
        if (exam) {
          totalUnits += exam.usePages ? (exam.pages || 0) : exam.chapters;
        }
      });
    });
    
    // Calculate overall progress percentage
    const overallProgress = totalUnits > 0
      ? Math.round((completedUnits / totalUnits) * 100)
      : 0;
    
    // Prepare weekly study data for chart
    const lastTwoWeeks = Array.from({ length: 14 }, (_, i) => {
      const date = addDays(today, -13 + i);
      const dateString = format(date, 'yyyy-MM-dd');
      
      // Get all sessions for this day
      const daySessionsMinutes = studySessions
        .filter(session => session.date === dateString)
        .reduce((sum, session) => sum + session.duration, 0);
      
      return {
        date: format(date, 'dd/MM'),
        hours: Math.round((daySessionsMinutes / 60) * 10) / 10
      };
    });
    
    // Calculate individual exam progress
    const examProgress: ExamProgressData[] = [];
    
    exams.forEach(exam => {
      if (isBefore(parseISO(exam.date), today)) return; // Skip past exams
      
      const daysLeft = differenceInDays(parseISO(exam.date), today);
      
      // Count completed units for this exam
      const completedExamUnits = new Set<number>();
      studyDays.forEach(day => {
        day.exams
          .filter(e => e.examId === exam.id && e.completed)
          .forEach(examDay => {
            examDay.chapters.forEach(unit => completedExamUnits.add(unit));
          });
      });
      
      const totalExamUnits = exam.usePages ? (exam.pages || 0) : exam.chapters;
      const examProgressPercentage = totalExamUnits > 0
        ? Math.round((completedExamUnits.size / totalExamUnits) * 100)
        : 0;
      
      // Determine if exam is at risk (progress less than days passed)
      // Calculate days since start of study or today if no start date
      const startDate = exam.startStudyDate ? parseISO(exam.startStudyDate) : today;
      const totalDaysToStudy = differenceInDays(parseISO(exam.date), startDate);
      const daysPassed = Math.max(0, differenceInDays(today, startDate));
      
      // Expected progress based on time passed
      const expectedProgress = totalDaysToStudy > 0
        ? Math.round((daysPassed / totalDaysToStudy) * 100)
        : 0;
      
      // Exam is at risk if actual progress is significantly less than expected
      const isAtRisk = examProgressPercentage < expectedProgress - 10;
      
      examProgress.push({
        id: exam.id,
        name: exam.name,
        progress: examProgressPercentage,
        daysLeft,
        isAtRisk
      });
    });
    
    // Sort exams by days left
    examProgress.sort((a, b) => a.daysLeft - b.daysLeft);
    
    return {
      totalHours: Math.round(totalHours * 10) / 10,
      sessionsCount: studySessions.length,
      upcomingExamsCount: upcomingExams.length,
      daysToNextExam,
      completedDaysCount: completedDays.size,
      currentStreak,
      avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
      completedUnits,
      overallProgress,
      weeklyData: lastTwoWeeks,
      examProgress
    };
  }, [exams, studyDays, studySessions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
      {/* Total Hours */}
      <StatsCard
        title={t('statistics.totalHours')}
        value={stats.totalHours}
        icon={<Clock className="h-4 w-4" />}
        description={t('statistics.totalHoursDesc')}
        color="bg-blue-500/10 text-blue-700"
      />
      
      {/* Study Sessions */}
      <StatsCard
        title={t('statistics.sessions')}
        value={stats.sessionsCount}
        icon={<BookOpen className="h-4 w-4" />}
        description={t('statistics.sessionsDesc')}
        color="bg-green-500/10 text-green-700"
      />
      
      {/* Units Completed */}
      <StatsCard
        title={t('statistics.unitsCompleted')}
        value={stats.completedUnits}
        icon={<CheckCheck className="h-4 w-4" />}
        description={t('statistics.unitsDesc')}
        color="bg-purple-500/10 text-purple-700"
      />
      
      {/* Study Streak */}
      <StatsCard
        title={t('statistics.studyStreak')}
        value={stats.currentStreak}
        icon={<TrendingUp className="h-4 w-4" />}
        description={t('statistics.streakDesc')}
        color="bg-orange-500/10 text-orange-700"
      />
      
      {/* Weekly Hours Chart */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('statistics.weeklyProgress')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.weeklyData}
                margin={{
                  top: 5,
                  right: 5,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.split('/')[0]}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                  unit="h"
                />
                <Tooltip 
                  formatter={(value) => [`${value} ${t('statistics.hours')}`, t('statistics.study')]}
                  labelFormatter={(label) => `${t('statistics.date')}: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="#9b87f5"
                  fill="#9b87f5"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Overall Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('statistics.overallProgress')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-2">
            <ProgressRing 
              progress={stats.overallProgress} 
              radius={60} 
              strokeWidth={10}
              labelFontSize="text-base"
              color="#9b87f5"
            />
            <p className="text-sm text-muted-foreground mt-4">
              {stats.completedUnits} {t('statistics.unitsCompleted').toLowerCase()}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Average Hours */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('statistics.dailyAverage')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-2 bg-green-500/20 p-2 rounded-full">
                  <BarChart className="h-4 w-4 text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t('statistics.hoursPerDay')}</p>
                </div>
              </div>
              <p className="text-2xl font-bold">{stats.avgHoursPerDay}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-2 bg-blue-500/20 p-2 rounded-full">
                  <Calendar className="h-4 w-4 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t('statistics.studyDays')}</p>
                </div>
              </div>
              <p className="text-2xl font-bold">{stats.completedDaysCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Exams Progress */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('statistics.examProgress')}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.examProgress.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.examProgress.map(exam => (
                  <div key={exam.id} className="flex flex-col p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">{exam.name}</p>
                      {exam.isAtRisk ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {t('statistics.atRisk')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CircleCheck className="h-3 w-3 mr-1" />
                          {t('statistics.onTrack')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span>{t('statistics.progress')}: {exam.progress}%</span>
                      <span>{t('statistics.daysLeft')}: {exam.daysLeft}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          exam.isAtRisk ? "bg-red-500" : "bg-green-500"
                        }`}
                        style={{ width: `${exam.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Graph view for exam progress */}
              <div className="mt-6 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={stats.examProgress.map(e => ({ 
                      name: e.name.substring(0, 15) + (e.name.length > 15 ? '...' : ''),
                      progress: e.progress,
                      risk: e.isAtRisk ? 100 : 0
                    }))}
                    margin={{
                      top: 5,
                      right: 5,
                      left: 0,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis unit="%" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value}${name === "progress" ? "%" : ""}`, 
                        name === "progress" ? t('statistics.progress') : ""
                      ]}
                    />
                    <Bar dataKey="progress" name={t('statistics.progress')} fill="#9b87f5" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">{t('statistics.noExams')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Helper component for stat cards
const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  description, 
  trend, 
  color = "bg-primary/10"
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className={`p-2 rounded-full ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Statistics;
