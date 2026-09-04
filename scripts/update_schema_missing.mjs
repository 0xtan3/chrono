import { Client, Databases, Permission, Role } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6a5f884b00007bf633ff')
  .setKey('standard_5e143fc6eefff2cbcdb21d4abf773ae56a6c43b8195e215eb131fee8276e5a8f5e8a4b61538d72f6c79755a5842a62dad2817c5405b0e0cfa5f720194fce1a31927fa58eee5bd71571e7769f8dc489d61609524901d1e22f4c4f75e33bcd7b14842ca4aeabb48ac5eaeba5efacaf03ca5f8f4c14cb6aec97fb6bffd57481e864');

const databases = new Databases(client);

async function run() {
  const dbId = 'focus_timer_db';
  const colId = 'user_stats';

  const stringAttrs = ['timezone', 'avatarId', 'roadmapData', 'daysData', 'tasksData', 'shownMs', 'displayName', 'lastActiveDate', 'userId'];
  const intAttrs = ['streakFreezes', 'dailyGoalMinutes', 'streak', 'bestStreak', 'totalXP'];

  for (const attr of stringAttrs) {
    try {
      console.log(`Adding ${attr} attribute...`);
      // Use 1000000 for JSON strings to avoid limit issues, 255 for normal strings
      const size = ['roadmapData', 'daysData', 'tasksData', 'shownMs'].includes(attr) ? 1000000 : 255;
      await databases.createStringAttribute(dbId, colId, attr, size, false);
      console.log(`${attr} created.`);
    } catch (e) {
      if (e.code === 409) console.log(`${attr} already exists.`);
      else console.error(`Error creating ${attr}:`, e.message);
    }
  }

  for (const attr of intAttrs) {
    try {
      console.log(`Adding ${attr} attribute...`);
      await databases.createIntegerAttribute(dbId, colId, attr, false);
      console.log(`${attr} created.`);
    } catch (e) {
      if (e.code === 409) console.log(`${attr} already exists.`);
      else console.error(`Error creating ${attr}:`, e.message);
    }
  }
}

run();
