import { Client, Account, Databases, ID, Query, Permission, Role } from 'appwrite';

// ── Appwrite Configuration ────────────────────────────────────────────────────
export const APPWRITE_CONFIG = {
  ENDPOINT:      import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  PROJECT_ID:    import.meta.env.VITE_APPWRITE_PROJECT_ID || '',
  DATABASE_ID:   import.meta.env.VITE_APPWRITE_DATABASE_ID || 'focus_timer_db',
  COLLECTION_ID: import.meta.env.VITE_APPWRITE_COLLECTION_ID || 'user_stats',
};

export const client = new Client();
if (APPWRITE_CONFIG.PROJECT_ID) {
  client
    .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
    .setProject(APPWRITE_CONFIG.PROJECT_ID);
}

export const account = new Account(client);
export const databases = new Databases(client);

function ensureConfig() {
  if (!APPWRITE_CONFIG.PROJECT_ID || APPWRITE_CONFIG.PROJECT_ID === 'YOUR_PROJECT_ID' || APPWRITE_CONFIG.PROJECT_ID === '') {
    throw new Error('Appwrite Project ID is missing. Please add VITE_APPWRITE_PROJECT_ID to your .env file.');
  }
}

// ── Authentication API with Resend Email Verification ─────────────────────────

export function getVerifyUrl() {
  const envUrl = import.meta.env.VITE_APP_URL;
  if (envUrl) {
    return `${envUrl.replace(/\/$/, '')}/verify`;
  }
  return `${window.location.origin}/verify`;
}

/**
 * Register a new user and dispatch branded verification email via Resend.
 */
export async function registerUser(email, password, name) {
  ensureConfig();
  // 1. Create Appwrite Account
  const newUser = await account.create(ID.unique(), email, password, name);
  
  // 2. Dispatch verification email via Resend API
  const verifyUrl = getVerifyUrl();
  try {
    const res = await fetch('/api/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: newUser.$id,
        email,
        name,
        verifyUrl,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn('Resend verification email notice:', errData.error);
    }
  } catch (e) {
    console.warn('Resend dispatch network error:', e);
  }
  
  return newUser;
}

/**
 * Login user. Verifies email confirmation before granting access.
 */
export async function loginUser(email, password) {
  ensureConfig();
  // 1. Clear any stale session
  try { await account.deleteSession('current'); } catch {}
  
  // 2. Create authenticated session
  await account.createEmailPasswordSession(email, password);
  
  // 3. Fetch user profile
  const user = await account.get();
  
  // 4. Strict verification check
  if (!user.emailVerification) {
    await account.deleteSession('current');
    const err = new Error('EMAIL_NOT_VERIFIED');
    err.email = email;
    throw err;
  }
  
  return user;
}

/**
 * Verify user email via server-side token validation endpoint.
 */
export async function verifyUserEmail(userId, secret) {
  const res = await fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, secret }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Email verification link is invalid or expired.');
  }

  return data;
}

/**
 * Resend verification email via Resend.
 */
export async function resendVerificationEmail(email) {
  const verifyUrl = getVerifyUrl();
  const res = await fetch('/api/send-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      verifyUrl,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Surface rate limit info
    if (res.status === 429 && data.retryAfter) {
      const err = new Error(data.error);
      err.retryAfter = data.retryAfter;
      throw err;
    }
    throw new Error(data.error || 'Failed to send verification email.');
  }

  return data;
}

/**
 * Log out current session.
 */
export async function logoutUser() {
  try {
    return await account.deleteSession('current');
  } catch (e) {
    console.warn('Logout warning:', e);
  }
}

/**
 * Get currently authenticated and verified user account (if any).
 */
export async function getCurrentUser() {
  try {
    const user = await account.get();
    if (user && user.emailVerification) {
      return user;
    } else if (user && !user.emailVerification) {
      await account.deleteSession('current');
      return null;
    }
  } catch {
    return null;
  }
}

// ── Database Sync API ────────────────────────────────────────────────────────
export async function fetchUserStats(userId) {
  if (!APPWRITE_CONFIG.PROJECT_ID) return null;
  try {
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTION_ID,
      [Query.equal('userId', userId)]
    );
    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return {
        docId: doc.$id,
        streak: doc.streak,
        bestStreak: doc.bestStreak,
        totalXP: doc.totalXP,
        lastActiveDate: doc.lastActiveDate,
        days: doc.daysData ? JSON.parse(doc.daysData) : {},
        shownMs: doc.shownMs ? JSON.parse(doc.shownMs) : [],
        focusLog: doc.tasksData ? JSON.parse(doc.tasksData) : [],
        customRoadmap: doc.roadmapData ? JSON.parse(doc.roadmapData) : null,
        timezone: doc.timezone || '',
        streakFreezes: doc.streakFreezes !== undefined ? doc.streakFreezes : 1,
        displayName: doc.displayName || '',
        avatarId: doc.avatarId || 'avatar-1',
      };
    }
  } catch (e) {
    console.warn('fetchUserStats error:', e);
  }
  return null;
}

export async function saveUserStats(userId, statsData, docId = null) {
  if (!APPWRITE_CONFIG.PROJECT_ID) return null;
  const payload = {
    userId,
    streak: statsData.streak || 0,
    bestStreak: statsData.bestStreak || 0,
    totalXP: statsData.totalXP || 0,
    lastActiveDate: statsData.lastActiveDate || '',
    daysData: JSON.stringify(statsData.days || {}),
    shownMs: JSON.stringify(statsData.shownMs || []),
    tasksData: JSON.stringify(statsData.focusLog || []),
    roadmapData: JSON.stringify(statsData.customRoadmap || null),
    timezone: statsData.timezone || '',
    streakFreezes: statsData.streakFreezes !== undefined ? statsData.streakFreezes : 1,
    displayName: statsData.displayName || '',
    avatarId: statsData.avatarId || 'avatar-1',
  };

  try {
    if (docId) {
      return await databases.updateDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTION_ID,
        docId,
        payload
      );
    } else {
      return await databases.createDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTION_ID,
        ID.unique(),
        payload,
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      );
    }
  } catch (e) {
    console.warn('saveUserStats error:', e);
    return null;
  }
}
