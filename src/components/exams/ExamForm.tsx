import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Exam, Priority } from '@/types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { addDays, format } from 'date-fns';
import { useAppContext } from '@/contexts/AppContext';

// Define separate schemas for page-based and chapter-based modes
const baseSchema = z.object({
  name: z.string().min(1, { message: 'Exam name is required' }),
  date: z.string().min(1, { message: 'Date is required' }),
  usePages: z.boolean().default(false),
  initialLevel: z.coerce.number().min(1).max(5, { message: 'Level must be between 1 and 5' }),
  priority: z.enum(['low', 'medium', 'high']),
  customReviewDays: z.coerce.number().min(0).max(14, { message: 'Maximum 14 review days' }).optional(),
});

const pagesSchema = baseSchema.extend({
  usePages: z.literal(true),
  pages: z.coerce.number().min(1, { message: 'Minimum 1 page required' }),
  timePerUnit: z.coerce.number().min(1, { message: 'Must read at least 1 page per hour' }).max(100, { message: 'Maximum 100 pages per hour' }),
});

const chaptersSchema = baseSchema.extend({
  usePages: z.literal(false),
  chapters: z.coerce.number().min(1, { message: 'Minimum 1 chapter required' }),
  timePerUnit: z.coerce.number().min(0.1, { message: 'Must spend at least 0.1 hours per chapter' }).max(10, { message: 'Maximum 10 hours per chapter' }),
});

const formSchema = z.discriminatedUnion('usePages', [
  pagesSchema,
  chaptersSchema
]);

// Create type from the schema
type FormValues = z.infer<typeof formSchema>;
type PagesFormValues = z.infer<typeof pagesSchema>;
type ChaptersFormValues = z.infer<typeof chaptersSchema>;

interface ExamFormProps {
  onSubmit: (data: Omit<Exam, 'id'>) => void;
  initialData?: Exam;
  onCancel?: () => void;
}

const ExamForm: React.FC<ExamFormProps> = ({ onSubmit, initialData, onCancel }) => {
  const today = new Date();
  const minDate = format(today, 'yyyy-MM-dd');
  const defaultDate = format(addDays(today, 14), 'yyyy-MM-dd');
  const { settings, studyDays } = useAppContext();

  // Check if this exam is already in study plan
  const isInStudyPlan = initialData && studyDays.some(
    day => day.exams.some(exam => exam.examId === initialData.id)
  );
  
  // State for showing confirmation dialog
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Prepare default values based on exam mode
  const getDefaultValues = (): FormValues => {
    if (initialData) {
      const isPageMode = initialData.usePages || false;
      
      if (isPageMode) {
        return {
          name: initialData.name,
          date: initialData.date.split('T')[0],
          usePages: true,
          pages: initialData.pages || 0,
          timePerUnit: initialData.timePerUnit || 20, // Default: 20 pages/hour
          initialLevel: initialData.initialLevel,
          priority: initialData.priority,
          customReviewDays: initialData.customReviewDays || settings.reviewDays,
        };
      } else {
        return {
          name: initialData.name,
          date: initialData.date.split('T')[0],
          usePages: false,
          chapters: initialData.chapters,
          timePerUnit: initialData.timePerUnit || 1, // Default: 1 hour/chapter
          initialLevel: initialData.initialLevel,
          priority: initialData.priority,
          customReviewDays: initialData.customReviewDays || settings.reviewDays,
        };
      }
    }
    
    // Default for new exam
    return {
      name: '',
      date: defaultDate,
      usePages: false,
      chapters: 10,
      timePerUnit: 1, // Default 1h per chapter
      initialLevel: 3,
      priority: 'medium' as Priority,
      customReviewDays: settings.reviewDays,
    };
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  const usePages = form.watch('usePages');
  
  // Update timePerUnit default when switching modes
  useEffect(() => {
    const currentValue = form.getValues('timePerUnit');
    if (usePages && currentValue < 1) {
      // Switching to pages mode - default 20 pages per hour
      form.setValue('timePerUnit', 20);
    } else if (!usePages && currentValue > 10) {
      // Switching to chapters mode - default 1 hour per chapter
      form.setValue('timePerUnit', 1);
    }
    
    // Reset the fields according to the mode
    if (usePages) {
      // If switching to pages mode
      form.setValue('pages', form.getValues('chapters') || 100);
      // Remove chapters field as it doesn't exist in this mode
      form.unregister('chapters');
    } else {
      // If switching to chapters mode
      form.setValue('chapters', form.getValues('pages') || 10);
      // Remove pages field as it doesn't exist in this mode
      form.unregister('pages');
    }
  }, [usePages, form]);

  const handleFormSubmit = (values: FormValues) => {
    // If exam is in study plan, show confirmation before proceeding
    if (isInStudyPlan && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }
    
    // Use type guards to safely handle discriminated union
    const examData: Omit<Exam, 'id'> = {
      name: values.name,
      date: new Date(values.date).toISOString(),
      initialLevel: values.initialLevel,
      priority: values.priority,
      usePages: values.usePages,
      timePerUnit: values.timePerUnit,
      customReviewDays: values.customReviewDays,
      color: initialData?.color || '#' + Math.floor(Math.random()*16777215).toString(16), // Add color property: use existing or generate random
      // Add appropriate properties based on the type
      ...(values.usePages 
        ? { chapters: 0, pages: (values as PagesFormValues).pages } 
        : { chapters: (values as ChaptersFormValues).chapters })
    };
    
    onSubmit(examData);
    setShowConfirmation(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        {showConfirmation && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded-md mb-4">
            <h4 className="text-amber-800 dark:text-amber-300 font-medium mb-2">Warning</h4>
            <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
              This exam already has study days assigned. Modifying it will require regenerating the study plan and you may lose progress data.
            </p>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowConfirmation(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" size="sm">
                Update Anyway
              </Button>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exam Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Calculus I" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exam Date</FormLabel>
              <FormControl>
                <Input type="date" min={minDate} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="usePages"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Study Mode</FormLabel>
                <FormDescription>
                  Choose between chapter-based or page-based study
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="text-sm font-medium">
                {field.value ? 'Page-based' : 'Chapter-based'}
              </div>
            </FormItem>
          )}
        />

        {!usePages ? (
          <FormField
            control={form.control}
            name="chapters"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Chapters</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="pages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Pages</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="timePerUnit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {usePages ? 'Pages studied per hour' : 'Hours per chapter'}
              </FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={usePages ? "1" : "0.1"} 
                  max={usePages ? "100" : "10"} 
                  step="0.1" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                {usePages 
                  ? 'How many pages you can complete in one hour (speed)' 
                  : 'How many hours needed to study one chapter (intensity)'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="initialLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Level (1-5)</FormLabel>
                <FormControl>
                  <Input type="number" min="1" max="5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="customReviewDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Review Days</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="14" {...field} />
                </FormControl>
                <FormDescription>
                  Days before exam dedicated to review
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">
            {initialData ? 'Update Exam' : 'Add Exam'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ExamForm;
