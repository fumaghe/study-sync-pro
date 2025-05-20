
import React from 'react';
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
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addDays, format } from 'date-fns';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Exam name is required' }),
  date: z.string().min(1, { message: 'Date is required' }),
  chapters: z.coerce.number().min(1, { message: 'Minimum 1 chapter required' }),
  initialLevel: z.coerce.number().min(1).max(5, { message: 'Level must be between 1 and 5' }),
  priority: z.enum(['low', 'medium', 'high']),
});

interface ExamFormProps {
  onSubmit: (data: Omit<Exam, 'id'>) => void;
  initialData?: Exam;
  onCancel?: () => void;
}

const ExamForm: React.FC<ExamFormProps> = ({ onSubmit, initialData, onCancel }) => {
  const today = new Date();
  const minDate = format(today, 'yyyy-MM-dd');
  const defaultDate = format(addDays(today, 14), 'yyyy-MM-dd');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      ...initialData,
      date: initialData.date.split('T')[0], // Convert ISO string to YYYY-MM-DD
    } : {
      name: '',
      date: defaultDate,
      chapters: 10,
      initialLevel: 3,
      priority: 'medium' as Priority,
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      name: values.name,
      date: new Date(values.date).toISOString(),
      chapters: values.chapters,
      initialLevel: values.initialLevel,
      priority: values.priority,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

        <div className="grid md:grid-cols-3 gap-4">
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
