
import React from 'react';
import Layout from '@/components/layout/Layout';
import UpcomingExams from '@/components/dashboard/UpcomingExams';
import TodayStudyPlan from '@/components/dashboard/TodayStudyPlan';
import Statistics from '@/components/dashboard/Statistics';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const Dashboard: React.FC = () => {
  const { exams, generateStudyPlan } = useAppContext();
  const isMobile = useIsMobile();
  
  const handleGeneratePlan = () => {
    generateStudyPlan();
  };
  
  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          {exams.length > 0 && (
            <Button onClick={handleGeneratePlan} size={isMobile ? "sm" : "default"} className="w-full sm:w-auto">
              Generate Study Plan
            </Button>
          )}
          <Link to="/exams" className="w-full sm:w-auto">
            <Button variant="outline" size={isMobile ? "sm" : "default"} className="w-full">
              Manage Exams
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="flex flex-col gap-4 sm:gap-6">
        <div>
          <TodayStudyPlan />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <UpcomingExams />
          <Statistics />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
