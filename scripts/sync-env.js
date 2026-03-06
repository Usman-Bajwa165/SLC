#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const rootEnv = path.join(__dirname, '..', '.env');
const apiEnv = path.join(__dirname, '..', 'apps', 'api', '.env');
const webEnv = path.join(__dirname, '..', 'apps', 'web', '.env.local');

if (!fs.existsSync(rootEnv)) {
  console.error('❌ .env file not found in root directory');
  process.exit(1);
}

const envContent = fs.readFileSync(rootEnv, 'utf8');

// Copy to API
fs.writeFileSync(apiEnv, envContent);
console.log('✅ Synced .env to apps/api/.env');

// Copy to Web
fs.writeFileSync(webEnv, envContent);
console.log('✅ Synced .env to apps/web/.env.local');
