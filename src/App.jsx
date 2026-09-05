import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import AuthGuard from './components/AuthGuard';
import LandingPage from './pages/LandingPage';
import TimerPage from './pages/TimerPage';
import AuthPage from './pages/AuthPage';
import VerifyPage from './pages/VerifyPage';
import LeaderboardPage from './pages/LeaderboardPage';
import { useStore } from './store';
import { 
  requestNotificationPermission, 
  sendStreakWarningNotification,
  sendInactivityWarningNotification 
} from './utils/notifications';

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

  // Streak & Inactivity warning notification check
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const hasCompletedToday = lastActiveDate === today;

    if (!hasCompletedToday) {
      if (streak > 0) {
        const isNotLoggedIn = !user;
        sendStreakWarningNotification(streak, isNotLoggedIn);
      } else if (lastActiveDate) {
        const lastActiveTime = new Date(lastActiveDate).getTime();
        const todayTime = new Date(today).getTime();
        const daysSince = Math.round((todayTime - lastActiveTime) / (1000 * 60 * 60 * 24));
        if (daysSince >= 2) {
          sendInactivityWarningNotification(daysSince);
        }
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
          <Route path="/leaderboard" element={<AuthGuard><LeaderboardPage /></AuthGuard>} />
          <Route path="/" element={<AuthGuard><TimerPage /></AuthGuard>} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
