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
    console.log('Adding displayName attribute...');
    await databases.createStringAttribute(dbId, colId, 'displayName', 255, false);
    console.log('displayName created.');
  } catch (e) {
    if (e.code === 409) console.log('displayName already exists.');
    else console.error('Error creating displayName:', e.message);
  }

  try {
    console.log('Adding avatarId attribute...');
    await databases.createStringAttribute(dbId, colId, 'avatarId', 255, false);
    console.log('avatarId created.');
  } catch (e) {
    if (e.code === 409) console.log('avatarId already exists.');
    else console.error('Error creating avatarId:', e.message);
  }

  // Update collection permissions to allow users to read (for the leaderboard)
  try {
    console.log('Updating collection permissions...');
    await databases.updateCollection(dbId, colId, 'user_stats', [
      Permission.read(Role.users()), // Any authenticated user can read
    ]);
    console.log('Collection permissions updated.');
  } catch (e) {
    console.error('Error updating permissions:', e.message);
  }
}

run();
