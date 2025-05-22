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
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  pomodoroWork: z.coerce.number().min(1).max(120),
  pomodoroBreak: z.coerce.number().min(1).max(30),
  defaultDailyHours: z.coerce.number().min(0.5).max(16),
  reviewDays: z.coerce.number().min(0).max(14),
  notifications: z.boolean(),
  darkMode: z.boolean(),
  language: z.enum(['en', 'it', 'es', 'fr']),
});

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetData } = useAppContext();
  const { t } = useTranslation();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: settings,
  });
  
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    updateSettings(values as Settings);
    toast.success(t('settings.saveSettings'));
  };
  
  const handleReset = () => {
    resetData();
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold tracking-tight mb-6">{t('settings.title')}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.generalSettings')}</CardTitle>
            <CardDescription>
              {t('settings.configDesc')}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('settings.pomodoroTimer')}</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="pomodoroWork"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.workDuration')}</FormLabel>
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
                          <FormLabel>{t('settings.breakDuration')}</FormLabel>
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
                  <h3 className="text-lg font-medium">{t('settings.studyPlanning')}</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="defaultDailyHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.defaultStudyHours')}</FormLabel>
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
                          <FormLabel>{t('settings.reviewDays')}</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="14" {...field} />
                          </FormControl>
                          <FormMessage />
                          <FormDescription>
                            {t('settings.reviewDaysDesc')}
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('settings.interfaceSettings')}</h3>
                  
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.language')}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English 🇬🇧</SelectItem>
                            <SelectItem value="it">Italiano 🇮🇹</SelectItem>
                            <SelectItem value="es">Español 🇪🇸</SelectItem>
                            <SelectItem value="fr">Français 🇫🇷</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t('settings.languageDesc')}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="darkMode"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {t('settings.darkMode')}
                          </FormLabel>
                          <FormDescription>
                            {t('settings.darkModeDesc')}
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
                            {t('settings.notifications')}
                          </FormLabel>
                          <FormDescription>
                            {t('settings.notificationsDesc')}
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
                  {t('settings.saveSettings')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.dataManagement')}</CardTitle>
            <CardDescription>
              {t('settings.dataDesc')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('settings.storageDetails').split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </p>
            
            <div className="bg-muted/50 p-4 rounded-md">
              <h4 className="font-medium mb-2">{t('settings.storageInfo')}</h4>
              <ul className="text-sm space-y-1">
                <li>• {t('settings.storageDetails').split('\n')[0]}</li>
                <li>• {t('settings.storageDetails').split('\n')[1]}</li>
                <li>• {t('settings.storageDetails').split('\n')[2]}</li>
              </ul>
            </div>
          </CardContent>
          
          <CardFooter className="border-t pt-6">
            <div className="space-y-4 w-full">
              <div className="bg-destructive/10 p-4 rounded-md">
                <h4 className="font-medium text-destructive mb-2">{t('settings.dangerZone')}</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('settings.resetWarning')}
                </p>
                <Button variant="destructive" onClick={handleReset} className="w-full">
                  {t('settings.resetData')}
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
