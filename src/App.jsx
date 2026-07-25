import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TimerPage from './pages/TimerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AuthPage from './pages/AuthPage';
import VerifyPage from './pages/VerifyPage';
import TasksPage from './pages/TasksPage';
import { useStore } from './store';
import { requestNotificationPermission, sendStreakWarningNotification } from './utils/notifications';

export default function App() {
  const initAuth      = useStore(s => s.initAuth);
  const selectedTheme = useStore(s => s.selectedTheme);
  const user           = useStore(s => s.user);
  const streak         = useStore(s => s.streak);
  const lastActiveDate = useStore(s => s.lastActiveDate);

  useEffect(() => {
    initAuth();
    requestNotificationPermission();
  }, [initAuth]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', selectedTheme || 'midnight');
  }, [selectedTheme]);

  // Streak warning notification check
  useEffect(() => {
    // If user has an active streak but has not focused on any tasks today
    if (streak > 0) {
      const today = new Date().toISOString().split('T')[0];
      const hasCompletedToday = lastActiveDate === today;

      if (!hasCompletedToday) {
        const isNotLoggedIn = !user;
        sendStreakWarningNotification(streak, isNotLoggedIn);
      }
    }
  }, [streak, lastActiveDate, user]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TimerPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/tasks" element={<TasksPage />} />
      </Routes>
    </BrowserRouter>
  );
}
