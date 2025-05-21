
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { Calendar, ChevronRight } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

const Header: React.FC = () => {
  const location = useLocation();
  const { exams } = useAppContext();
  
  const currentPage = location.pathname.split('/')[1] || 'dashboard';
  const pageTitle = getPageTitle(currentPage);
  
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <div className="flex items-center font-heading text-lg font-bold text-primary-purple mr-4">
          <Link to="/" className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            <span>StudyPlanner</span>
          </Link>
        </div>
        
        <div className="flex items-center">
          <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
          <span className="text-sm font-medium text-foreground">{pageTitle}</span>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <Link to="/exams" className="hidden md:block">
            <Button variant="ghost" size="sm">
              Exams ({exams.length})
            </Button>
          </Link>
          <Link to="/plan" className="hidden md:block">
            <Button variant="ghost" size="sm">
              Study Plan
            </Button>
          </Link>
          <Link to="/timer" className="hidden md:block">
            <Button variant="ghost" size="sm">
              Focus Timer
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

function getPageTitle(pathName: string): string {
  switch (pathName) {
    case 'dashboard':
      return 'Dashboard';
    case 'exams':
      return 'Manage Exams';
    case 'plan':
      return 'Study Plan';
    case 'timer':
      return 'Focus Timer';
    case 'settings':
      return 'Settings';
    default:
      return 'Dashboard';
  }
}

export default Header;
