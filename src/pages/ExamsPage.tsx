
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import ExamCard from '@/components/exams/ExamCard';
import ExamForm from '@/components/exams/ExamForm';
import { Exam } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ExamsPage: React.FC = () => {
  const { exams, addExam, updateExam } = useAppContext();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  
  const handleAddExam = (data: Omit<Exam, 'id'>) => {
    addExam(data);
    setIsAddDialogOpen(false);
  };
  
  const handleEditExam = (exam: Exam) => {
    setCurrentExam(exam);
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateExam = (updatedExam: Omit<Exam, 'id'>) => {
    if (currentExam) {
      updateExam({
        ...updatedExam,
        id: currentExam.id,
        color: currentExam.color,
      });
    }
    setIsEditDialogOpen(false);
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Manage Exams</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          Add New Exam
        </Button>
      </div>
      
      {exams.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-2xl font-medium mb-2">No exams yet</h2>
          <p className="text-muted-foreground mb-6">
            Start by adding your upcoming exams to create a study plan
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            Add Your First Exam
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {exams.map(exam => (
            <ExamCard 
              key={exam.id} 
              exam={exam}
              onEdit={() => handleEditExam(exam)}
            />
          ))}
        </div>
      )}
      
      {/* Add Exam Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Exam</DialogTitle>
            <DialogDescription>
              Enter the details of your upcoming exam
            </DialogDescription>
          </DialogHeader>
          <ExamForm 
            onSubmit={handleAddExam} 
            onCancel={() => setIsAddDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Exam Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Exam</DialogTitle>
            <DialogDescription>
              Update the details of your exam
            </DialogDescription>
          </DialogHeader>
          {currentExam && (
            <ExamForm 
              onSubmit={handleUpdateExam} 
              initialData={currentExam}
              onCancel={() => setIsEditDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ExamsPage;
