import { Client, Databases, Permission, Role } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6a5f884b00007bf633ff')
  .setKey('standard_5e143fc6eefff2cbcdb21d4abf773ae56a6c43b8195e215eb131fee8276e5a8f5e8a4b61538d72f6c79755a5842a62dad2817c5405b0e0cfa5f720194fce1a31927fa58eee5bd71571e7769f8dc489d61609524901d1e22f4c4f75e33bcd7b14842ca4aeabb48ac5eaeba5efacaf03ca5f8f4c14cb6aec97fb6bffd57481e864');

const databases = new Databases(client);

async function run() {
  const dbId = 'focus_timer_db';
  const colId = 'user_stats';

  try {
    console.log('Adding timezone attribute...');
    await databases.createStringAttribute(dbId, colId, 'timezone', 255, false);
    console.log('timezone created.');
  } catch (e) {
    if (e.code === 409) console.log('timezone already exists.');
    else console.error('Error creating timezone:', e.message);
  }

  try {
    console.log('Adding streakFreezes attribute...');
    await databases.createIntegerAttribute(dbId, colId, 'streakFreezes', false, 0, 1000, 1);
    console.log('streakFreezes created.');
  } catch (e) {
    if (e.code === 409) console.log('streakFreezes already exists.');
    else console.error('Error creating streakFreezes:', e.message);
  }

  try {
    console.log('Adding dailyGoalMinutes attribute...');
    await databases.createIntegerAttribute(dbId, colId, 'dailyGoalMinutes', false, 15, 720, 120);
    console.log('dailyGoalMinutes created.');
  } catch (e) {
    if (e.code === 409) console.log('dailyGoalMinutes already exists.');
    else console.error('Error creating dailyGoalMinutes:', e.message);
  }
}

run();
