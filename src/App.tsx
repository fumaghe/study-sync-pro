
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from './contexts/AppContext';

// Pages
import Dashboard from "./pages/Dashboard";
import ExamsPage from "./pages/ExamsPage";
import StudyPlanPage from "./pages/StudyPlanPage";
import TimerPage from "./pages/TimerPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter basename="/study-sync-pro/">
      <AppProvider>
        <TooltipProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/exams" element={<ExamsPage />} />
            <Route path="/plan" element={<StudyPlanPage />} />
            <Route path="/timer" element={<TimerPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </AppProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
