#!/usr/bin/env node
/* Start the Vocal Gym web app: node server/index.js (or npm start). PORT and HOST override the defaults. */
import { existsSync } from 'node:fs';

// v0.10: settings and secrets can sit in a .env file (see .env.example); the environment itself wins
if (existsSync(new URL('../.env', import.meta.url)) && process.loadEnvFile) process.loadEnvFile(new URL('../.env', import.meta.url));
const { createApp } = await import('./app.js');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';

createApp().listen(PORT, HOST, () => {
  console.log('Vocal Gym is running at http://' + (HOST === '0.0.0.0' ? 'localhost' : HOST) + ':' + PORT);
});
