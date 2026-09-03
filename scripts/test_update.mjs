import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6a5f884b00007bf633ff')
  .setKey('standard_5e143fc6eefff2cbcdb21d4abf773ae56a6c43b8195e215eb131fee8276e5a8f5e8a4b61538d72f6c79755a5842a62dad2817c5405b0e0cfa5f720194fce1a31927fa58eee5bd71571e7769f8dc489d61609524901d1e22f4c4f75e33bcd7b14842ca4aeabb48ac5eaeba5efacaf03ca5f8f4c14cb6aec97fb6bffd57481e864');

const databases = new Databases(client);

async function run() {
  const dbId = 'focus_timer_db';
  const colId = 'user_stats';

  try {
    const docs = await databases.listDocuments(dbId, colId, [Query.limit(1)]);
    if (docs.documents.length > 0) {
      const doc = docs.documents[0];
      console.log('Found doc:', doc.$id);
      
      const payload = {
        streak: doc.streak + 1,
        displayName: 'Test Update',
        avatarId: 'avatar-2'
      };
      
      console.log('Attempting to update...');
      const updated = await databases.updateDocument(dbId, colId, doc.$id, payload);
      console.log('Update success:', updated.$id);
    } else {
      console.log('No docs found');
    }
  } catch (e) {
    console.error('Update failed:', e.message);
  }
}

run();
