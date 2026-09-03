import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6a5f884b00007bf633ff')
  .setKey('standard_5e143fc6eefff2cbcdb21d4abf773ae56a6c43b8195e215eb131fee8276e5a8f5e8a4b61538d72f6c79755a5842a62dad2817c5405b0e0cfa5f720194fce1a31927fa58eee5bd71571e7769f8dc489d61609524901d1e22f4c4f75e33bcd7b14842ca4aeabb48ac5eaeba5efacaf03ca5f8f4c14cb6aec97fb6bffd57481e864');

const databases = new Databases(client);

async function run() {
  const dbId = 'focus_timer_db';
  const colId = 'user_stats';
  
  const payload = {
    userId: '6a99680c0035d8514f2e',
    streak: 1,
    bestStreak: 1,
    totalXP: 100,
    lastActiveDate: '2026-09-03',
    daysData: JSON.stringify({}),
    shownMs: JSON.stringify([]),
    tasksData: JSON.stringify([{ id: 'test', duration: 25 }]),
    roadmapData: JSON.stringify(null),
    timezone: 'UTC',
    streakFreezes: 1,
    displayName: 'Test',
    avatarId: 'avatar-1'
  };

  try {
    const updated = await databases.updateDocument(dbId, colId, '6a61a7c5002e380e1953', payload);
    console.log('Update success');
  } catch (e) {
    console.error('Update failed:', e.message);
  }
}

run();
