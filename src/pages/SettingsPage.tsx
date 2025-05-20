
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import Layout from '@/components/layout/Layout';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Settings } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from "sonner";

const formSchema = z.object({
  pomodoroWork: z.coerce.number().min(1).max(120),
  pomodoroBreak: z.coerce.number().min(1).max(30),
  defaultDailyHours: z.coerce.number().min(0.5).max(16),
  reviewDays: z.coerce.number().min(0).max(14),
  notifications: z.boolean(),
  darkMode: z.boolean(),
});

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetData } = useAppContext();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: settings,
  });
  
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    updateSettings(values as Settings);
    toast.success("Settings saved successfully!");
  };
  
  const handleReset = () => {
    resetData();
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure your study preferences and application behavior
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Pomodoro Timer</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="pomodoroWork"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="120" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="pomodoroBreak"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Break Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Study Planning</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="defaultDailyHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Study Hours Per Day</FormLabel>
                          <FormControl>
                            <Input type="number" min="0.5" max="16" step="0.5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="reviewDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Review Days Before Exam</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="14" {...field} />
                          </FormControl>
                          <FormMessage />
                          <FormDescription>
                            Days dedicated to review before exam
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Interface Settings</h3>
                  
                  <FormField
                    control={form.control}
                    name="darkMode"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Dark Mode
                          </FormLabel>
                          <FormDescription>
                            Switch between light and dark theme
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
                  
                  <FormField
                    control={form.control}
                    name="notifications"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Browser Notifications
                          </FormLabel>
                          <FormDescription>
                            Allow notifications for timer and reminders
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
                </div>
                
                <Button type="submit" className="w-full">
                  Save Settings
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Manage your application data and reset options
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              All your data is stored locally in your browser. This includes your exams, study plans, and settings.
            </p>
            
            <div className="bg-muted/50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Storage Information</h4>
              <ul className="text-sm space-y-1">
                <li>• Exams and study data are saved in your browser's local storage</li>
                <li>• Data will persist between sessions until you clear it</li>
                <li>• Data is not synced between devices</li>
              </ul>
            </div>
          </CardContent>
          
          <CardFooter className="border-t pt-6">
            <div className="space-y-4 w-full">
              <div className="bg-destructive/10 p-4 rounded-md">
                <h4 className="font-medium text-destructive mb-2">Danger Zone</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Resetting will permanently erase all your data, including exams, study plans, and settings.
                </p>
                <Button variant="destructive" onClick={handleReset} className="w-full">
                  Reset All Data
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default SettingsPage;
