import { Client, Users, Databases, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6a5f884b00007bf633ff')
  .setKey('standard_5e143fc6eefff2cbcdb21d4abf773ae56a6c43b8195e215eb131fee8276e5a8f5e8a4b61538d72f6c79755a5842a62dad2817c5405b0e0cfa5f720194fce1a31927fa58eee5bd71571e7769f8dc489d61609524901d1e22f4c4f75e33bcd7b14842ca4aeabb48ac5eaeba5efacaf03ca5f8f4c14cb6aec97fb6bffd57481e864');

const users = new Users(client);
const databases = new Databases(client);

async function run() {
  const dbId = 'focus_timer_db';
  const colId = 'user_stats';
  
  try {
    const statsDocs = await databases.listDocuments(dbId, colId, [Query.limit(100)]);
    console.log(`Checking ${statsDocs.documents.length} stats documents...`);
    
    for (const doc of statsDocs.documents) {
      try {
        await users.get(doc.userId);
      } catch (err) {
        if (err.code === 404) {
          console.log(`User ${doc.userId} not found. Deleting orphaned stats doc ${doc.$id}...`);
          await databases.deleteDocument(dbId, colId, doc.$id);
        } else {
          console.error(`Error fetching user ${doc.userId}:`, err.message);
        }
      }
    }
    console.log('Cleanup complete.');
  } catch (e) {
    console.error('Failed:', e.message);
  }
}

run();
