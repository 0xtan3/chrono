/**
 * Browser push notification helpers to keep the focus streak alive.
 */

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function sendStreakWarningNotification(streakDays, isNotLoggedIn) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const today = new Date().toISOString().split('T')[0];
  const storageKey = `chrono_streak_notif_${today}`;
  const lastSent = sessionStorage.getItem(storageKey);
  const now = Date.now();

  // Deduplicate: Don't send more than once every 4 hours in the same session
  if (lastSent && now - parseInt(lastSent, 10) < 4 * 60 * 60 * 1000) {
    return;
  }

  sessionStorage.setItem(storageKey, String(now));

  const title = '🔥 Save Your Chrono Streak!';
  const body = isNotLoggedIn
    ? `You are not logged in! Log in and focus on a task today to save your ${streakDays}-day streak.`
    : `Your ${streakDays}-day streak resets to 0 at midnight! Complete at least one task focus session today to save it.`;

  new Notification(title, {
    body,
    icon: '/favicon.svg',
    tag: 'streak-warning'
  });
}
