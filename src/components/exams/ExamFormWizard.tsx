
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Check } from 'lucide-react';
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

const ExamFormWizard: React.FC<ExamFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const { settings } = useAppContext();
  const [startStudyDateEnabled, setStartStudyDateEnabled] = useState<boolean>(
    !!initialValues?.startStudyDate
  );
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
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
    
    // Default values based on usePages discriminator
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
    mode: 'onChange',
  });
  
  // Watch fields for conditional rendering and validation
  const usePages = form.watch('usePages');
  const formValues = form.watch();
  
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

  // Check if the current step is valid
  const isCurrentStepValid = () => {
    const { name, date, chapters, pages, usePages, timePerUnit, initialLevel, priority } = formValues;
    
    switch (currentStep) {
      case 1:
        return !!name && !!date; // Basic info
      case 2:
        if (usePages) {
          return pages && pages > 0 && timePerUnit > 0 && initialLevel >= 0;
        } else {
          return chapters && chapters > 0 && timePerUnit > 0 && initialLevel >= 0;
        }
      case 3:
        return true; // Final step always valid as customReviewDays is optional
      default:
        return false;
    }
  };

  // Navigation functions
  const goToNextStep = () => {
    if (currentStep < totalSteps && isCurrentStepValid()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Render the progress indicator
  const renderStepIndicator = () => {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step === currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : step < currentStep 
                    ? 'bg-primary/30 text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'}`}
              >
                {step < currentStep ? <Check className="h-4 w-4" /> : step}
              </div>
              <span className="text-xs mt-1 text-muted-foreground">
                {step === 1 ? 'Basic Info' : step === 2 ? 'Study Details' : 'Review'}
              </span>
            </div>
          ))}
        </div>
        <div className="relative mt-1 h-1 w-full bg-muted">
          <div 
            className="absolute left-0 top-0 h-1 bg-primary transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Render step 1: Basic exam information
  const renderStep1 = () => {
    return (
      <>
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
      </>
    );
  };

  // Render step 2: Study parameters based on mode
  const renderStep2 = () => {
    return (
      <>
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
      </>
    );
  };

  // Render step 3: Final settings and review
  const renderStep3 = () => {
    return (
      <>
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

        {/* Summary of all information */}
        <div className="rounded-lg border p-4 space-y-4 mt-2">
          <h3 className="font-medium text-lg">Summary</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exam Name:</span>
              <span className="font-medium">{formValues.name || 'Not set'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exam Date:</span>
              <span className="font-medium">{formatDate(formValues.date) || 'Not set'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Study Mode:</span>
              <span className="font-medium">{formValues.usePages ? 'Pages' : 'Chapters'}</span>
            </div>
            
            {formValues.usePages ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Pages:</span>
                <span className="font-medium">{formValues.pages || '0'}</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Chapters:</span>
                <span className="font-medium">{formValues.chapters || '0'}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {formValues.usePages ? 'Pages per Hour:' : 'Hours per Chapter:'}
              </span>
              <span className="font-medium">{formValues.timePerUnit || '0'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Initial Knowledge Level:</span>
              <span className="font-medium">{formValues.initialLevel}/10</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority:</span>
              <Badge 
                variant="outline" 
                className={
                  priorityOptions.find(option => option.value === formValues.priority)?.color || ''
                }
              >
                {formValues.priority?.charAt(0).toUpperCase() + formValues.priority?.slice(1) || 'Not set'}
              </Badge>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Study Start Date:</span>
              <span className="font-medium">
                {startStudyDateEnabled && formValues.startStudyDate 
                  ? formatDate(formValues.startStudyDate) 
                  : 'Automatic'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Review Days:</span>
              <span className="font-medium">
                {formValues.customReviewDays !== undefined 
                  ? formValues.customReviewDays 
                  : `${settings.reviewDays} (Default)`}
              </span>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(handleFormSubmit)} 
        className="space-y-6 max-h-[70vh] md:max-h-full overflow-y-auto pr-1 pb-4 md:pb-0 scroll-pt-8"
      >
        {renderStepIndicator()}
        
        <div className="space-y-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
        
        <div className="flex justify-between space-x-4 pt-2 sticky bottom-0 bg-background pb-2">
          {currentStep > 1 ? (
            <Button type="button" variant="outline" onClick={goToPreviousStep}>
              Back
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          
          {currentStep < totalSteps ? (
            <Button 
              type="button" 
              onClick={goToNextStep}
              disabled={!isCurrentStepValid()}
            >
              Next
            </Button>
          ) : (
            <Button type="submit">
              {initialValues ? 'Update Exam' : 'Add Exam'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};

export default ExamFormWizard;
