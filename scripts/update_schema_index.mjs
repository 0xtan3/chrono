import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6a5f884b00007bf633ff')
  .setKey('standard_5e143fc6eefff2cbcdb21d4abf773ae56a6c43b8195e215eb131fee8276e5a8f5e8a4b61538d72f6c79755a5842a62dad2817c5405b0e0cfa5f720194fce1a31927fa58eee5bd71571e7769f8dc489d61609524901d1e22f4c4f75e33bcd7b14842ca4aeabb48ac5eaeba5efacaf03ca5f8f4c14cb6aec97fb6bffd57481e864');

const databases = new Databases(client);

async function run() {
  const dbId = 'focus_timer_db';
  const colId = 'user_stats';

  // 1. Create Index on totalXP
  try {
    console.log('Adding totalXP index...');
    await databases.createIndex(
      dbId,
      colId,
      'totalXP_idx',
      'key',
      ['totalXP'],
      ['DESC']
    );
    console.log('Index created.');
  } catch (e) {
    if (e.code === 409) console.log('Index already exists.');
    else console.error('Error creating index:', e.message);
  }

  // 2. Remove Collection read permissions (lock it down)
  try {
    console.log('Locking down collection permissions...');
    // Setting permissions to empty array removes collection-level permissions.
    // Documents will rely on document-level permissions (Role.user(userId))
    await databases.updateCollection(dbId, colId, 'user_stats', []);
    console.log('Collection permissions locked down.');
  } catch (e) {
    console.error('Error updating permissions:', e.message);
  }
}

run();
