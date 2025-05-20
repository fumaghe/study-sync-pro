
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, BookOpen, Calendar as CalendarIcon, Clock, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const MobileNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: Calendar },
    { path: '/exams', label: 'Exams', icon: BookOpen },
    { path: '/plan', label: 'Plan', icon: CalendarIcon },
    { path: '/timer', label: 'Timer', icon: Clock },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background md:hidden z-50">
      <nav className="grid grid-cols-5 h-14">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs",
              currentPath === item.path
                ? "text-primary-purple"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default MobileNav;
