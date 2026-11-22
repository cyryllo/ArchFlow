import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createAuth } from './auth.js';
import { createDiagramRouter } from './diagrams.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Configuration from environment variables
const STORAGE_ENABLED = process.env.ENABLE_SERVER_STORAGE === 'true';
const STORAGE_PATH = process.env.STORAGE_PATH || '/data/diagrams';
const ENABLE_GIT_BACKUP = process.env.ENABLE_GIT_BACKUP === 'true';
// Logins (AUTH_MODE=local) protect server storage, so they need it
const AUTH_MODE = process.env.AUTH_MODE === 'local' && STORAGE_ENABLED ? 'local' : 'none';
if (process.env.AUTH_MODE === 'local' && !STORAGE_ENABLED) {
  console.log('AUTH_MODE=local needs ENABLE_SERVER_STORAGE=true - logins are off');
}

// Behind nginx (and maybe another proxy): trust X-Forwarded-* for the client IP and https
app.set('trust proxy', true);

// Middleware. With logins the app and the API share one address (nginx), so
// cross-origin requests aren't needed - and mustn't carry the session cookie.
if (AUTH_MODE === 'none') app.use(cors());
app.use(express.json({ limit: '10mb' }));

const auth = createAuth({
  mode: AUTH_MODE,
  dataDir: path.join(STORAGE_PATH, '.archflow'),
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD
});
app.use('/api', auth.attach);
app.use('/api/auth', auth.router);
app.use('/api/admin', auth.adminRouter);

// Health check / Storage status endpoint
app.get('/api/storage/status', (req, res) => {
  res.json({
    enabled: STORAGE_ENABLED,
    gitBackup: ENABLE_GIT_BACKUP,
    version: '1.0.0',
    auth: auth.status()
  });
});

// Only enable storage endpoints if storage is enabled
if (STORAGE_ENABLED) {
  fs.mkdir(STORAGE_PATH, { recursive: true }).catch((err) => {
    console.error('Failed to create the storage directory:', err);
  });
  // /api/diagrams (with roles and sharing) and /api/shared/<token>
  app.use('/api', createDiagramRouter({ storagePath: STORAGE_PATH, auth }));
} else {
  // Storage disabled - return appropriate responses
  app.get('/api/diagrams', (req, res) => {
    res.status(503).json({ error: 'Server storage is disabled' });
  });
  
  app.get('/api/diagrams/:id', (req, res) => {
    res.status(503).json({ error: 'Server storage is disabled' });
  });
  
  app.put('/api/diagrams/:id', (req, res) => {
    res.status(503).json({ error: 'Server storage is disabled' });
  });
  
  app.delete('/api/diagrams/:id', (req, res) => {
    res.status(503).json({ error: 'Server storage is disabled' });
  });
  
  app.post('/api/diagrams', (req, res) => {
    res.status(503).json({ error: 'Server storage is disabled' });
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`ArchFlow Backend Server running on port ${PORT}`);
  console.log(`Server storage: ${STORAGE_ENABLED ? 'ENABLED' : 'DISABLED'}`);
  if (STORAGE_ENABLED) {
    console.log(`Storage path: ${STORAGE_PATH}`);
    console.log(`Git backup: ${ENABLE_GIT_BACKUP ? 'ENABLED' : 'DISABLED'}`);
  }
});