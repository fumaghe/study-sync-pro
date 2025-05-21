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

/* -------------------------------------------------------------------------- */
/*                              Validation schema                             */
/* -------------------------------------------------------------------------- */

const baseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  date: z.string().min(1, 'Exam date is required'),
  startStudyDate: z.string().optional(),
  usePages: z.boolean().default(false),
  timePerUnit: z.number().min(0.1, 'Must be a positive number'),
  initialLevel: z.number().min(0).max(10),
  priority: z.enum(['low', 'medium', 'high'] as const),
  customReviewDays: z.number().min(0).optional(),
});

const pagesSchema = baseSchema.extend({
  usePages: z.literal(true),
  pages: z.number().min(1, 'Number of pages must be at least 1'),
});

const chaptersSchema = baseSchema.extend({
  usePages: z.literal(false),
  chapters: z.number().min(1, 'Number of chapters must be at least 1'),
});

const examSchema = z.discriminatedUnion('usePages', [
  pagesSchema,
  chaptersSchema,
]);

type ExamFormValues = z.infer<typeof examSchema>;

interface ExamFormProps {
  initialValues?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

/* -------------------------------------------------------------------------- */
/*                               Main component                               */
/* -------------------------------------------------------------------------- */
const ExamFormWizard: React.FC<ExamFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const { settings } = useAppContext();

  /* ----------------------------- Local states ----------------------------- */
  const [startStudyDateEnabled, setStartStudyDateEnabled] = useState<boolean>(
    !!initialValues?.startStudyDate
  );
  const [customReviewDaysEnabled, setCustomReviewDaysEnabled] =
    useState<boolean>(!!initialValues?.customReviewDays);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  /* ----------------------- Default form field values ---------------------- */
  const getDefaultValues = (): Partial<ExamFormValues> => {
    if (initialValues) {
      return {
        ...initialValues,
        date: initialValues.date || format(new Date(), 'yyyy-MM-dd'),
        startStudyDate: initialValues.startStudyDate || undefined,
        customReviewDays:
          initialValues.customReviewDays ?? settings.reviewDays,
      };
    }
    return {
      name: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startStudyDate: undefined,
      usePages: false,
      chapters: 10,
      timePerUnit: 1,
      initialLevel: 0,
      priority: 'medium' as Priority,
      customReviewDays: settings.reviewDays,
    };
  };

  /* ----------------------------- useForm hook ----------------------------- */
  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  });

  const usePages = form.watch('usePages');
  const formValues = form.watch();

  /* ---------------------------- Submit handler ---------------------------- */
  const handleFormSubmit = (data: ExamFormValues) => {
    const formattedData = {
      ...data,
      startStudyDate: startStudyDateEnabled ? data.startStudyDate : undefined,
      customReviewDays: customReviewDaysEnabled
        ? data.customReviewDays
        : undefined,
    };
    onSubmit(formattedData);
  };

  /* ----------------------------- Helpers UI ------------------------------ */
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return '';
    }
  };

  const priorityOptions = [
    {
      value: 'low',
      label: 'Low',
      color:
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    },
    {
      value: 'medium',
      label: 'Medium',
      color:
        'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    },
    {
      value: 'high',
      label: 'High',
      color:
        'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
    },
  ];

  const isCurrentStepValid = () => {
    const {
      name,
      date,
      usePages,
      timePerUnit,
      initialLevel,
      pages,
      chapters,
    } = formValues as any;

    switch (currentStep) {
      case 1:
        return !!name && !!date; // review-days opzionale
      case 2:
        if (usePages) {
          return pages > 0 && timePerUnit > 0 && initialLevel >= 0;
        }
        return chapters > 0 && timePerUnit > 0 && initialLevel >= 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const goToNextStep = () => {
    if (currentStep < totalSteps && isCurrentStepValid()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                UI segments                                 */
  /* -------------------------------------------------------------------------- */

  const renderStepIndicator = () => (
    <div className="mb-6">
      <div className="flex justify-between items-center">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div key={step} className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                step === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : step < currentStep
                  ? 'bg-primary/30 text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {step < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                step
              )}
            </div>
            <span className="text-xs mt-1 text-muted-foreground">
              {step === 1
                ? 'Basic Info'
                : step === 2
                ? 'Study Details'
                : 'Review'}
            </span>
          </div>
        ))}
      </div>
      <div className="relative mt-1 h-1 w-full bg-muted">
        <div
          className="absolute left-0 top-0 h-1 bg-primary transition-all duration-300"
          style={{
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
          }}
        />
      </div>
    </div>
  );

  /* ------------------------------- STEP 1 --------------------------------- */
  const renderStep1 = () => (
    <>
      {/* Exam name ------------------------------------------------------- */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Exam Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Mathematics" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Exam date ------------------------------------------------------- */}
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
                    variant="outline"
                    className={cn(
                      'w-full pl-3 text-left font-normal',
                      !field.value && 'text-muted-foreground'
                    )}
                  >
                    {field.value ? formatDate(field.value) : 'Select date'}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={new Date(field.value)}
                  onSelect={(date) =>
                    date && field.onChange(format(date, 'yyyy-MM-dd'))
                  }
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

      {/* Pages / Chapters toggle ----------------------------------------- */}
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

      {/* Custom review days --------------------------------------------- */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <FormLabel className="text-sm font-medium">
            Custom Review Days
          </FormLabel>
          <Switch
            checked={customReviewDaysEnabled}
            onCheckedChange={setCustomReviewDaysEnabled}
          />
        </div>
        {customReviewDaysEnabled && (
          <FormField
            control={form.control}
            name="customReviewDays"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value)
                      )
                    }
                  />
                </FormControl>
                <FormDescription>
                  Days before the exam dedicated to review (default:{' '}
                  {settings.reviewDays})
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </>
  );

  /* ------------------------------- STEP 2 --------------------------------- */
  const renderStep2 = () => (
    <>
      {/* Pages / Chapters count ----------------------------------------- */}
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

      {/* Time per unit --------------------------------------------------- */}
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
                onChange={(e) =>
                  field.onChange(Number(e.target.value))
                }
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

      {/* Initial knowledge slider --------------------------------------- */}
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

      {/* Priority selector ---------------------------------------------- */}
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
                        className={cn('mr-2', option.color)}
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

      {/* Optional start study date -------------------------------------- */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <FormLabel className="text-sm font-medium">
            Study Start Date
          </FormLabel>
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
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value
                          ? formatDate(field.value)
                          : 'Select start date'}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={
                        field.value ? new Date(field.value) : undefined
                      }
                      onSelect={(date) =>
                        date &&
                        field.onChange(format(date, 'yyyy-MM-dd'))
                      }
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

  /* ------------------------------- STEP 3 --------------------------------- */
  const renderStep3 = () => (
    <>
      {/* ----------------------------- Summary ----------------------------- */}
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="font-medium text-lg">Summary</h3>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Exam Name:</span>
            <span className="font-medium">
              {formValues.name || 'Not set'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Exam Date:</span>
            <span className="font-medium">
              {formatDate(formValues.date) || 'Not set'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Study Mode:</span>
            <span className="font-medium">
              {formValues.usePages ? 'Pages' : 'Chapters'}
            </span>
          </div>

          {formValues.usePages ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Pages:</span>
              <span className="font-medium">
                {(formValues as any).pages || '0'}
              </span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Total Chapters:
              </span>
              <span className="font-medium">
                {(formValues as any).chapters || '0'}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {formValues.usePages ? 'Pages per Hour:' : 'Hours per Chapter:'}
            </span>
            <span className="font-medium">
              {formValues.timePerUnit || '0'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Initial Knowledge Level:
            </span>
            <span className="font-medium">
              {formValues.initialLevel}/10
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Priority:</span>
            <Badge
              variant="outline"
              className={
                priorityOptions.find(
                  (option) => option.value === formValues.priority
                )?.color || ''
              }
            >
              {formValues.priority
                ? formValues.priority.charAt(0).toUpperCase() +
                  formValues.priority.slice(1)
                : 'Not set'}
            </Badge>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Study Start Date:
            </span>
            <span className="font-medium">
              {startStudyDateEnabled && formValues.startStudyDate
                ? formatDate(formValues.startStudyDate)
                : 'Automatic'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Review Days:</span>
            <span className="font-medium">
              {customReviewDaysEnabled &&
              formValues.customReviewDays !== undefined
                ? formValues.customReviewDays
                : `${settings.reviewDays} (Default)`}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */
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
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
            >
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
