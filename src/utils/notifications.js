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

  const title = '🔥 Save Your Chrono Streak!';
  const body = isNotLoggedIn
    ? `You are not logged in! Log in and focus on a task today to save your ${streakDays}-day streak.`
    : `Your ${streakDays}-day streak resets to 0 at midnight! Complete at least one task focus session today to save it.`;

  new Notification(title, {
    body,
    icon: '/favicon.ico',
    tag: 'streak-warning'
  });
}
