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

    // Update user's email verification status in Appwrite
    await users.updateEmailVerification(userId, true);

    return res.status(200).json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    console.error('verify endpoint error:', err);
    return res.status(500).json({ error: err.message || 'Verification failed.' });
  }
}
