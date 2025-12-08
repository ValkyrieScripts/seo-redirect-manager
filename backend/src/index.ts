import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { initDatabase } from './db/database';
import { authRouter } from './routes/auth';
import { domainsRouter } from './routes/domains';
// import { projectsRouter } from './routes/projects'; // Deprecated
// import { redirectsRouter } from './routes/redirects'; // Deprecated - using domain.target_url
import { backlinksRouter } from './routes/backlinks';
import { exportRouter } from './routes/export';
import { nginxRouter } from './routes/nginx';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initDatabase();

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/domains', authMiddleware, domainsRouter);
// app.use('/api/projects', authMiddleware, projectsRouter); // Deprecated
// app.use('/api/redirects', authMiddleware, redirectsRouter); // Deprecated
app.use('/api/backlinks', authMiddleware, backlinksRouter);
app.use('/api/export', authMiddleware, exportRouter);
app.use('/api/nginx', authMiddleware, nginxRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
