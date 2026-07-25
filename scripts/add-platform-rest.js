import fs from 'fs';
import path from 'path';

// Read .env manually (never hardcode real values here)
const envPath = path.resolve(process.cwd(), '.env');
let apiKey = '';
let projectId = '';
let endpoint = 'https://fra.cloud.appwrite.io/v1';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    if (line.startsWith('APPWRITE_API_KEY=')) apiKey = line.replace('APPWRITE_API_KEY=', '').trim();
    if (line.startsWith('VITE_APPWRITE_PROJECT_ID=')) projectId = line.replace('VITE_APPWRITE_PROJECT_ID=', '').trim();
    if (line.startsWith('VITE_APPWRITE_ENDPOINT=')) endpoint = line.replace('VITE_APPWRITE_ENDPOINT=', '').trim();
  }
}

if (!projectId || !apiKey) {
  console.error('❌ Missing VITE_APPWRITE_PROJECT_ID or APPWRITE_API_KEY in .env');
  process.exit(1);
}

async function addWebPlatform() {
  try {
    console.log(`Endpoint: ${endpoint}, Project: ${projectId}`);
    
    // 1. List Platforms
    const listRes = await fetch(`${endpoint}/projects/${projectId}/platforms`, {
      method: 'GET',
      headers: {
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey,
      }
    });
    const listData = await listRes.json();
    console.log('Existing platforms:', listData);

    // 2. Add localhost platform if missing
    const hasLocalhost = listData.platforms?.some(p => p.hostname === 'localhost');
    if (!hasLocalhost) {
      console.log('Adding localhost web platform...');
      const createRes = await fetch(`${endpoint}/projects/${projectId}/platforms`, {
        method: 'POST',
        headers: {
          'X-Appwrite-Project': projectId,
          'X-Appwrite-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'web',
          name: 'CHRONO Web',
          hostname: 'localhost'
        })
      });
      const createData = await createRes.json();
      console.log('Create platform response:', createData);
    } else {
      console.log('✅ localhost web platform is already registered!');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

addWebPlatform();
