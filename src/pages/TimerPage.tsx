
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import PomodoroTimerUpgraded from '@/components/timer/PomodoroTimerUpgraded';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { formatStudyTime } from '@/lib/formatters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PomodoroTimer from '@/components/timer/PomodoroTimer';

const TimerPage: React.FC = () => {
  const { studySessions, exams } = useAppContext();
  const [timerVersion, setTimerVersion] = useState<'upgraded' | 'classic'>('upgraded');
  
  // Group sessions by date, most recent first
  const sessionsByDate = studySessions.reduce<{ [date: string]: typeof studySessions }>((acc, session) => {
    const dateStr = session.date.split('T')[0]; // Extract YYYY-MM-DD
    
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    
    acc[dateStr].push(session);
    return acc;
  }, {});
  
  // Sort dates in descending order
  const sortedDates = Object.keys(sessionsByDate).sort().reverse();
  
  return (
    <Layout>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Focus Timer</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Tabs defaultValue="upgraded" className="mb-4" onValueChange={(val: string) => setTimerVersion(val as 'upgraded' | 'classic')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upgraded">Visual Timer</TabsTrigger>
              <TabsTrigger value="classic">Classic Timer</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {timerVersion === 'upgraded' ? <PomodoroTimerUpgraded /> : <PomodoroTimer />}
        </div>
        
        <div>
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Recent Study Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedDates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No study sessions recorded yet. Use the timer to track your study time!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedDates.slice(0, 7).map(dateStr => {
                    const sessions = sessionsByDate[dateStr];
                    const date = new Date(dateStr);
                    
                    return (
                      <div key={dateStr}>
                        <h3 className="text-sm font-medium mb-2">{format(date, 'EEEE, MMMM d, yyyy')}</h3>
                        <div className="space-y-2">
                          {sessions.map(session => {
                            const exam = exams.find(e => e.id === session.examId);
                            
                            return (
                              <div 
                                key={session.id} 
                                className="flex justify-between items-center p-3 bg-accent rounded-md"
                              >
                                <div>
                                  <p className="font-medium">{exam?.name || 'Unknown Exam'}</p>
                                  {session.chapters.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      Chapters: {session.chapters.join(', ')}
                                    </p>
                                  )}
                                </div>
                                <span className="text-sm">{session.duration} min</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TimerPage;
