import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import AuthGuard from './components/AuthGuard';
import LandingPage from './pages/LandingPage';
import TimerPage from './pages/TimerPage';
import HubermanPage from './pages/HubermanPage';
import AuthPage from './pages/AuthPage';
import VerifyPage from './pages/VerifyPage';
import { useStore } from './store';
import { requestNotificationPermission, sendStreakWarningNotification } from './utils/notifications';

export default function App() {
  const initAuth      = useStore(s => s.initAuth);
  const user           = useStore(s => s.user);
  const streak         = useStore(s => s.streak);
  const lastActiveDate = useStore(s => s.lastActiveDate);

  useEffect(() => {
    initAuth();
    requestNotificationPermission();
  }, [initAuth]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'midnight');
  }, []);

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
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/welcome" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/huberman" element={<AuthGuard><HubermanPage /></AuthGuard>} />
          
          <Route path="/" element={<AuthGuard><TimerPage /></AuthGuard>} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
