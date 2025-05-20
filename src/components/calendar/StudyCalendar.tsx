
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StudyDay } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const StudyCalendar: React.FC = () => {
  const { exams, studyDays, updateStudyDay } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStudyDay, setSelectedStudyDay] = useState<StudyDay | null>(null);
  const [availableHours, setAvailableHours] = useState(4);
  const [isAvailable, setIsAvailable] = useState(true);
  
  // Find days with study plans for highlighting in the calendar
  const getDayClass = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const day = studyDays.find((d) => d.date === dateString);
    
    if (day) {
      if (!day.available) return 'bg-muted text-muted-foreground';
      if (day.exams.length > 0) return 'bg-primary/25 font-semibold';
    }
    return '';
  };
  
  // Handle date selection in calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDate(date);
    const dateString = format(date, 'yyyy-MM-dd');
    const day = studyDays.find((d) => d.date === dateString);
    
    if (day) {
      setSelectedStudyDay(day);
      setAvailableHours(day.availableHours);
      setIsAvailable(day.available);
    } else {
      setSelectedStudyDay({
        date: dateString,
        available: true,
        availableHours: 4,
        exams: []
      });
      setAvailableHours(4);
      setIsAvailable(true);
    }
    
    setIsDialogOpen(true);
  };
  
  // Save changes to study day
  const saveStudyDay = () => {
    if (selectedStudyDay) {
      const updatedDay = {
        ...selectedStudyDay,
        available: isAvailable,
        availableHours: availableHours
      };
      
      updateStudyDay(updatedDay);
    }
    setIsDialogOpen(false);
  };
  
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Study Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          className="p-3 pointer-events-auto"
          modifiers={{
            customStyles: (date) => getDayClass(date) !== '',
          }}
          modifiersStyles={{
            customStyles: {
              fontWeight: 'bold',
            },
          }}
          classNames={{
            day_today: "bg-accent text-accent-foreground",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day: (date) => getDayClass(date),
          }}
        />
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}
              </DialogTitle>
              <DialogDescription>
                Customize your study plan for this day
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id="available"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="available" className="text-sm font-medium">
                  Available for studying
                </label>
              </div>
              
              {isAvailable && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Hours available for studying
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={availableHours}
                    onChange={(e) => setAvailableHours(parseFloat(e.target.value))}
                  />
                </div>
              )}
              
              {selectedStudyDay && selectedStudyDay.exams.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Exams to study</label>
                  <ul className="space-y-1">
                    {selectedStudyDay.exams.map((examDay) => {
                      const exam = exams.find((e) => e.id === examDay.examId);
                      if (!exam) return null;
                      
                      return (
                        <li key={exam.id} className="text-sm flex justify-between">
                          <span>{exam.name}</span>
                          <span>{examDay.plannedHours} hours</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button onClick={saveStudyDay}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default StudyCalendar;
