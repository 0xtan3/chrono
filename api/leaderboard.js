import { Client, Databases, Query } from 'node-appwrite';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
    const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
    const API_KEY = process.env.APPWRITE_API_KEY;
    const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'focus_timer_db';
    const COLLECTION_ID = process.env.VITE_APPWRITE_COLLECTION_ID || 'user_stats';

    if (!PROJECT_ID || !API_KEY) {
      return res.status(500).json({ error: 'Missing Appwrite server configuration' });
    }

    const client = new Client()
      .setEndpoint(ENDPOINT)
      .setProject(PROJECT_ID)
      .setKey(API_KEY);

    const databases = new Databases(client);

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.orderDesc('totalXP'),
        Query.limit(50),
        // We only select the fields we actually need to save bandwidth and improve performance.
        // Wait, node-appwrite supports Query.select()
        Query.select(['userId', 'displayName', 'avatarId', 'totalXP', 'streak'])
      ]
    );

    // Further sanitize to ensure no private data leaks even if Query.select is missed or fails
    const sanitizedLeaders = response.documents.map(doc => ({
      id: doc.$id, // The document ID
      userId: doc.userId,
      displayName: doc.displayName || 'Unknown Chrononaut',
      avatarId: doc.avatarId || 'avatar-1',
      totalXP: doc.totalXP || 0,
      streak: doc.streak || 0,
    }));

    return res.status(200).json({ leaders: sanitizedLeaders });

  } catch (error) {
    console.error('Leaderboard API error:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard data' });
  }
}
