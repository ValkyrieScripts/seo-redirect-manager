import { Router, Request, Response } from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import { getDatabase } from '../db/database';

export const backlinksRouter = Router();

// Configure multer for CSV/TXT uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['text/csv', 'text/plain', 'application/octet-stream'];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.csv') || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV or TXT files are allowed'));
    }
  },
});

// Get all backlinks for a domain
backlinksRouter.get('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const { domain_id } = req.query;

  if (!domain_id) {
    res.status(400).json({ error: 'domain_id is required' });
    return;
  }

  const backlinks = db.prepare(`
    SELECT id, domain_id, linking_site, url_path, created_at
    FROM backlinks
    WHERE domain_id = ?
    ORDER BY url_path, linking_site
  `).all(domain_id);

  res.json(backlinks);
});

// Get backlinks grouped by path (with count and linking sites)
backlinksRouter.get('/grouped/:domain_id', (req: Request, res: Response) => {
  const db = getDatabase();
  const domain_id = req.params.domain_id;

  // Verify domain exists
  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(domain_id);
  if (!domain) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }

  // Get paths with counts
  const paths = db.prepare(`
    SELECT url_path, COUNT(*) as count
    FROM backlinks
    WHERE domain_id = ?
    GROUP BY url_path
    ORDER BY count DESC, url_path
  `).all(domain_id) as { url_path: string; count: number }[];

  // Get linking sites for each path
  const result = paths.map(path => {
    const linkingSites = db.prepare(`
      SELECT linking_site
      FROM backlinks
      WHERE domain_id = ? AND url_path = ?
      ORDER BY linking_site
    `).all(domain_id, path.url_path) as { linking_site: string }[];

    return {
      url_path: path.url_path,
      count: path.count,
      linking_sites: linkingSites.map(s => s.linking_site),
    };
  });

  res.json(result);
});

// Import backlinks from CSV/TXT (format: linking_site,url_path)
backlinksRouter.post('/import', upload.single('file'), (req: Request, res: Response) => {
  const { domain_id } = req.body;

  if (!domain_id) {
    res.status(400).json({ error: 'domain_id is required' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: 'File is required' });
    return;
  }

  const db = getDatabase();

  // Verify domain exists
  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(domain_id);
  if (!domain) {
    res.status(400).json({ error: 'Domain not found' });
    return;
  }

  const content = req.file.buffer.toString('utf-8');

  Papa.parse(content, {
    header: false, // No header expected
    skipEmptyLines: true,
    complete: (results) => {
      const insertStmt = db.prepare(`
        INSERT INTO backlinks (domain_id, linking_site, url_path)
        VALUES (?, ?, ?)
      `);

      const stats = { imported: 0, skipped: 0 };

      const transaction = db.transaction(() => {
        for (const row of results.data as string[][]) {
          try {
            // Expected format: linking_site,url_path
            // Or just linking_site (defaults to /)
            let linkingSite = (row[0] || '').trim();
            let urlPath = (row[1] || '/').trim();

            // Skip empty rows
            if (!linkingSite) {
              stats.skipped++;
              continue;
            }

            // Normalize url_path (ensure it starts with /)
            if (urlPath && !urlPath.startsWith('/')) {
              urlPath = '/' + urlPath;
            }
            if (!urlPath) {
              urlPath = '/';
            }

            // Clean linking site (remove protocol if present)
            linkingSite = linkingSite.replace(/^https?:\/\//, '').replace(/\/$/, '');

            insertStmt.run(domain_id, linkingSite, urlPath);
            stats.imported++;
          } catch (error) {
            stats.skipped++;
          }
        }
      });

      transaction();

      res.json({
        message: 'Import completed',
        stats,
        total_rows: results.data.length,
      });
    },
    error: (error: Error) => {
      res.status(400).json({ error: `File parsing error: ${error.message}` });
    },
  });
});

// Delete all backlinks for a domain
backlinksRouter.delete('/domain/:domain_id', (req: Request, res: Response) => {
  const db = getDatabase();

  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.domain_id);
  if (!domain) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }

  const result = db.prepare('DELETE FROM backlinks WHERE domain_id = ?').run(req.params.domain_id);
  res.json({ message: 'Backlinks deleted', count: result.changes });
});

// Delete single backlink
backlinksRouter.delete('/:id', (req: Request, res: Response) => {
  const db = getDatabase();

  const existing = db.prepare('SELECT * FROM backlinks WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Backlink not found' });
    return;
  }

  db.prepare('DELETE FROM backlinks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Backlink deleted' });
});
