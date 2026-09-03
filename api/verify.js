import { Client, Users } from 'node-appwrite';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, secret } = req.body || {};

    if (!userId || !secret) {
      return res.status(400).json({ error: 'Missing required parameters: userId or secret.' });
    }

    const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
    const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
    const API_KEY = process.env.APPWRITE_API_KEY;

    if (!PROJECT_ID || !API_KEY) {
      throw new Error('Missing server credentials: VITE_APPWRITE_PROJECT_ID or APPWRITE_API_KEY.');
    }

    const client = new Client()
      .setEndpoint(ENDPOINT)
      .setProject(PROJECT_ID)
      .setKey(API_KEY);

    const users = new Users(client);

    // Check if user is already verified
    try {
      const user = await users.get(userId);
      if (user && user.emailVerification) {
        return res.status(200).json({ success: true, message: 'Email is already verified.', alreadyVerified: true });
      }
    } catch (e) {
      // User not found or other error — continue with verification attempt
      console.warn('User lookup during verify:', e.message);
    }

    // Validate the token by creating a session from it
    // The createSession method validates the userId + secret pair created by createToken
    try {
      await users.createSession(userId, secret);
    } catch (e) {
      // If session creation fails, the token is invalid or expired
      // But first check if user is already verified (token may have been used)
      try {
        const user = await users.get(userId);
        if (user && user.emailVerification) {
          return res.status(200).json({ success: true, message: 'Email is already verified.', alreadyVerified: true });
        }
      } catch (_) { /* ignore */ }

      console.error('Token validation failed:', e.message);
      return res.status(400).json({
        error: 'Verification link is invalid or has expired. Please request a new verification email.',
        expired: true,
      });
    }

    // Token validated — mark user email as verified
    await users.updateEmailVerification(userId, true);

    // Clean up: delete the session we just created (it was only for validation)
    try {
      const sessions = await users.listSessions(userId);
      if (sessions.sessions && sessions.sessions.length > 0) {
        // Delete the most recent session (the one we just created for validation)
        const latestSession = sessions.sessions[sessions.sessions.length - 1];
        await users.deleteSession(userId, latestSession.$id);
      }
    } catch (e) {
      console.warn('Session cleanup warning (non-critical):', e.message);
    }

    return res.status(200).json({ success: true, message: 'Email verified successfully!' });
  } catch (err) {
    console.error('verify endpoint error:', err);
    return res.status(500).json({ error: err.message || 'Verification failed.' });
  }
}
