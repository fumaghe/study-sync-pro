
import React from 'react';
import Layout from '@/components/layout/Layout';
import UpcomingExams from '@/components/dashboard/UpcomingExams';
import TodayStudyPlan from '@/components/dashboard/TodayStudyPlan';
import Statistics from '@/components/dashboard/Statistics';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { exams, generateStudyPlan } = useAppContext();
  
  const handleGeneratePlan = () => {
    generateStudyPlan();
  };
  
  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {exams.length > 0 && (
            <Button onClick={handleGeneratePlan} className="flex-1 sm:flex-none">
              Generate Study Plan
            </Button>
          )}
          <Link to="/exams" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full">
              Manage Exams
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <TodayStudyPlan />
        <UpcomingExams />
        <Statistics />
      </div>
    </Layout>
  );
};

export default Dashboard;
