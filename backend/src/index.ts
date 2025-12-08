import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import { initializeDatabase } from './db/database';
import authRoutes from './routes/auth';
import domainRoutes from './routes/domains';
import backlinkRoutes from './routes/backlinks';
import nginxRoutes from './routes/nginx';

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure nginx conf directory exists
const nginxConfDir = path.join(__dirname, '../nginx-conf');
if (!fs.existsSync(nginxConfDir)) {
  fs.mkdirSync(nginxConfDir, { recursive: true });
}

// Initialize database
initializeDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/backlinks', backlinkRoutes);
app.use('/api/nginx', nginxRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`SEO Redirect Manager API running on port ${PORT}`);
});
