import { Client, Databases, Permission, Role } from 'node-appwrite';
import fs from 'fs';
import path from 'path';

// Load variables from environment or args
const endpoint   = process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId  = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || process.argv[2];
const apiKey     = process.env.APPWRITE_API_KEY || process.argv[3];

const DATABASE_ID   = 'focus_timer_db';
const COLLECTION_ID = 'user_stats';

if (!projectId || !apiKey) {
  console.error('\n❌ Missing Appwrite credentials!\n');
  console.log('Usage: node scripts/setup-appwrite.js <PROJECT_ID> <API_KEY>');
  console.log('Or set VITE_APPWRITE_PROJECT_ID & APPWRITE_API_KEY in your .env file.\n');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function autoProvision() {
  console.log(`\n🚀 Starting Appwrite auto-provisioning for Project: ${projectId}...`);

  // 1. Create Database
  try {
    await databases.get(DATABASE_ID);
    console.log(`✓ Database "${DATABASE_ID}" already exists.`);
  } catch (e) {
    console.log(`⚙️ Creating Database "${DATABASE_ID}"...`);
    await databases.create(DATABASE_ID, 'Focus Timer Database');
    console.log(`✓ Database created!`);
  }

  // 2. Create Collection
  try {
    await databases.getCollection(DATABASE_ID, COLLECTION_ID);
    console.log(`✓ Collection "${COLLECTION_ID}" already exists.`);
  } catch (e) {
    console.log(`⚙️ Creating Collection "${COLLECTION_ID}"...`);
    await databases.createCollection(
      DATABASE_ID,
      COLLECTION_ID,
      'User Stats Collection',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ],
      false // documentSecurity disabled for open client access
    );
    console.log(`✓ Collection created with open client permissions!`);
  }

  // 3. Create Attributes
  const attributes = [
    { key: 'userId',         type: 'string',  size: 255,   required: true },
    { key: 'streak',         type: 'integer', default: 0,  required: true },
    { key: 'bestStreak',     type: 'integer', default: 0,  required: true },
    { key: 'totalXP',        type: 'integer', default: 0,  required: true },
    { key: 'lastActiveDate', type: 'string',  size: 32,    required: false },
    { key: 'daysData',       type: 'string',  size: 65535, required: false },
    { key: 'shownMs',        type: 'string',  size: 4096,  required: false },
    { key: 'tasksData',      type: 'string',  size: 65535, required: false },
    { key: 'roadmapData',    type: 'string',  size: 65535, required: false },
  ];

  console.log(`⚙️ Provisioning attributes...`);
  for (const attr of attributes) {
    try {
      if (attr.type === 'string') {
        await databases.createStringAttribute(
          DATABASE_ID,
          COLLECTION_ID,
          attr.key,
          attr.size,
          attr.required
        );
      } else if (attr.type === 'integer') {
        await databases.createIntegerAttribute(
          DATABASE_ID,
          COLLECTION_ID,
          attr.key,
          attr.required,
          0, // min
          100000000, // max
          attr.default
        );
      }
      console.log(`  + Attribute "${attr.key}" created.`);
    } catch (err) {
      if (err.code === 409 || err.message?.includes('already exists')) {
        console.log(`  ✓ Attribute "${attr.key}" already exists.`);
      } else {
        console.warn(`  ⚠️ Attribute "${attr.key}" warning:`, err.message);
      }
    }
  }

  // 4. Update/Create .env file
  const envPath = path.join(process.cwd(), '.env');
  const envContent = `VITE_APPWRITE_ENDPOINT=${endpoint}
VITE_APPWRITE_PROJECT_ID=${projectId}
VITE_APPWRITE_DATABASE_ID=${DATABASE_ID}
VITE_APPWRITE_COLLECTION_ID=${COLLECTION_ID}
APPWRITE_API_KEY=${apiKey}
`;

  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`\n🎉 Success! Database & Collection fully provisioned.`);
  console.log(`📝 Updated .env file automatically!\n`);
}

autoProvision().catch(err => {
  console.error('\n❌ Auto-provisioning failed:', err.message);
  process.exit(1);
});
