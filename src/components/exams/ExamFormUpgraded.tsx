
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Priority } from '@/types';
import { useAppContext } from '@/contexts/AppContext';

// Base schema for common fields
const baseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string().min(1, "Exam date is required"),
  startStudyDate: z.string().optional(),
  usePages: z.boolean().default(false),
  timePerUnit: z.number().min(0.1, "Must be a positive number"),
  initialLevel: z.number().min(0).max(10),
  priority: z.enum(['low', 'medium', 'high'] as const),
  customReviewDays: z.number().min(0).optional(),
});

// Schema for pages-based exams
const pagesSchema = baseSchema.extend({
  usePages: z.literal(true),
  pages: z.number().min(1, "Number of pages must be at least 1"),
});

// Schema for chapters-based exams
const chaptersSchema = baseSchema.extend({
  usePages: z.literal(false),
  chapters: z.number().min(1, "Number of chapters must be at least 1"),
});

// Combined schema using discriminated union
const examSchema = z.discriminatedUnion('usePages', [pagesSchema, chaptersSchema]);

type ExamFormValues = z.infer<typeof examSchema>;

interface ExamFormProps {
  initialValues?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ExamFormUpgraded: React.FC<ExamFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const { settings } = useAppContext();
  const [startStudyDateEnabled, setStartStudyDateEnabled] = useState<boolean>(
    !!initialValues?.startStudyDate
  );
  
  // Default form values with proper typing
  const getDefaultValues = (): Partial<ExamFormValues> => {
    if (initialValues) {
      return {
        ...initialValues,
        // Convert dates to strings as expected by the form
        date: initialValues.date || format(new Date(), 'yyyy-MM-dd'),
        startStudyDate: initialValues.startStudyDate || undefined,
      };
    }
    
    // Type-safe default values based on usePages discriminator
    return {
      name: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startStudyDate: undefined,
      usePages: false,
      chapters: 10,
      timePerUnit: 1,
      initialLevel: 0,
      priority: 'medium' as Priority,
      customReviewDays: undefined,
    };
  };
  
  // Initialize the form
  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: getDefaultValues(),
  });
  
  // Watch the usePages field to conditionally render form fields
  const usePages = form.watch('usePages');
  
  // Handle form submission
  const handleFormSubmit = (data: ExamFormValues) => {
    // Only include startStudyDate if it's enabled
    const formattedData = {
      ...data,
      startStudyDate: startStudyDateEnabled ? data.startStudyDate : undefined,
    };
    
    onSubmit(formattedData);
  };
  
  // Format a date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return '';
    }
  };
  
  // Priority labels with colors
  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' },
    { value: 'high', label: 'High', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300' },
  ];
  
  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(handleFormSubmit)} 
        className="space-y-6 max-h-[70vh] md:max-h-full overflow-y-auto pr-1 pb-4 md:pb-0 scroll-pt-8"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exam Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Mathematics Final" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Exam Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? formatDate(field.value) : "Select date"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(field.value)}
                      onSelect={(date) => date && field.onChange(format(date, 'yyyy-MM-dd'))}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Start Study Date Field */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel className="text-sm font-medium">Study Start Date</FormLabel>
              <Switch 
                checked={startStudyDateEnabled} 
                onCheckedChange={setStartStudyDateEnabled} 
              />
            </div>
            {startStudyDateEnabled && (
              <FormField
                control={form.control}
                name="startStudyDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? formatDate(field.value) : "Select start date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => date && field.onChange(format(date, 'yyyy-MM-dd'))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription className="text-xs">
                      When to begin studying for this exam
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
        
        <FormField
          control={form.control}
          name="usePages"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Study by Pages</FormLabel>
                <FormDescription>
                  Choose whether to track study by pages or chapters
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        {usePages ? (
          <FormField
            control={form.control}
            name="pages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Pages</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  The total number of pages to study
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="chapters"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Chapters</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  The total number of chapters to study
                </FormDescription>
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
                {usePages ? 'Pages per Hour' : 'Hours per Chapter'}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={usePages ? 1 : 0.1}
                  step={usePages ? 1 : 0.1}
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                {usePages
                  ? 'How many pages you can study in one hour'
                  : 'How many hours it takes to study one chapter'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="initialLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initial Knowledge Level</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  <Slider
                    min={0}
                    max={10}
                    step={1}
                    defaultValue={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Beginner (0)</span>
                    <span>Expert (10)</span>
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                How much do you know about this subject already?
              </FormDescription>
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
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a priority level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        <Badge
                          variant="outline"
                          className={`mr-2 ${option.color}`}
                        >
                          {option.label}
                        </Badge>
                        <span>{option.label} Priority</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                How important is this exam compared to others?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="customReviewDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Review Days</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder={settings.reviewDays.toString()}
                  {...field}
                  value={field.value === undefined ? '' : field.value}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === '' ? undefined : Number(value));
                  }}
                />
              </FormControl>
              <FormDescription>
                How many days before the exam to start reviewing (leave empty to use default: {settings.reviewDays})
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-4 pt-2 sticky bottom-0 bg-background pb-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialValues ? 'Update Exam' : 'Add Exam'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ExamFormUpgraded;
