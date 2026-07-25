import { Client, Projects } from 'node-appwrite';
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

console.log(`Endpoint: ${endpoint}, Project: ${projectId}`);

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const projects = new Projects(client);

async function addWebPlatform() {
  try {
    console.log(`Checking Web Platforms for Project: ${projectId}...`);
    const res = await projects.createPlatform(
      projectId,
      'web',
      'CHRONO Web App',
      'localhost',
      ''
    );
    console.log('✅ Web platform created successfully:', res);
  } catch (err) {
    console.log('Platform status / message:', err.message);
  }
}

addWebPlatform();
