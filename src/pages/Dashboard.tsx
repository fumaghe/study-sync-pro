
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
          {exams.length > 0 && (
            <Button onClick={handleGeneratePlan}>
              Generate Study Plan
            </Button>
          )}
          <Link to="/exams">
            <Button variant="outline">
              Manage Exams
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <TodayStudyPlan />
        </div>
        <UpcomingExams />
        <Statistics />
      </div>
    </Layout>
  );
};

export default Dashboard;
