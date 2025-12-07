import { Router, Request, Response } from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import { getDatabase } from '../db/database';

export const backlinksRouter = Router();

// Configure multer for CSV uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Get all backlinks
backlinksRouter.get('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const { domain_id, min_dr } = req.query;

  let query = `
    SELECT b.*, d.domain_name
    FROM backlinks b
    JOIN domains d ON b.domain_id = d.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (domain_id) {
    query += ' AND b.domain_id = ?';
    params.push(domain_id);
  }

  if (min_dr) {
    query += ' AND b.domain_rating >= ?';
    params.push(min_dr);
  }

  query += ' ORDER BY b.domain_rating DESC, b.created_at DESC';

  const backlinks = db.prepare(query).all(...params);
  res.json(backlinks);
});

// Get single backlink
backlinksRouter.get('/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const backlink = db.prepare(`
    SELECT b.*, d.domain_name
    FROM backlinks b
    JOIN domains d ON b.domain_id = d.id
    WHERE b.id = ?
  `).get(req.params.id);

  if (!backlink) {
    res.status(404).json({ error: 'Backlink not found' });
    return;
  }

  res.json(backlink);
});

// Import backlinks from Ahrefs CSV
backlinksRouter.post('/import', upload.single('file'), (req: Request, res: Response) => {
  const { domain_id } = req.body;

  if (!domain_id) {
    res.status(400).json({ error: 'domain_id is required' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: 'CSV file is required' });
    return;
  }

  const db = getDatabase();

  // Verify domain exists
  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(domain_id);
  if (!domain) {
    res.status(400).json({ error: 'Domain not found' });
    return;
  }

  const csvContent = req.file.buffer.toString('utf-8');

  Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const insertStmt = db.prepare(`
        INSERT INTO backlinks (
          domain_id, source_url, source_path, referring_domain,
          anchor_text, domain_rating, url_rating, traffic, first_seen, last_seen
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const stats = { imported: 0, skipped: 0, errors: [] as string[] };

      const transaction = db.transaction(() => {
        for (const row of results.data as any[]) {
          try {
            // Map Ahrefs CSV columns to our schema
            // Common Ahrefs column names (may vary)
            const sourceUrl = row['Source URL'] || row['Referring Page URL'] || row['URL From'] || '';
            const referringDomain = row['Source Domain'] || row['Referring Domain'] || row['Domain'] || '';
            const anchorText = row['Anchor'] || row['Anchor Text'] || row['Link Anchor'] || '';
            const domainRating = parseInt(row['DR'] || row['Domain Rating'] || row['Ahrefs DR'] || '0');
            const urlRating = parseInt(row['UR'] || row['URL Rating'] || row['Ahrefs UR'] || '0');
            const traffic = parseInt(row['Traffic'] || row['Organic Traffic'] || '0');
            const firstSeen = row['First Seen'] || row['First seen'] || null;
            const lastSeen = row['Last Seen'] || row['Last seen'] || null;

            if (!sourceUrl) {
              stats.skipped++;
              continue;
            }

            // Extract path from source URL
            let sourcePath = '/';
            try {
              const url = new URL(sourceUrl);
              sourcePath = url.pathname + url.search;
            } catch (e) {
              sourcePath = sourceUrl.replace(/^https?:\/\/[^\/]+/, '') || '/';
            }

            insertStmt.run(
              domain_id,
              sourceUrl,
              sourcePath,
              referringDomain,
              anchorText || null,
              isNaN(domainRating) ? null : domainRating,
              isNaN(urlRating) ? null : urlRating,
              isNaN(traffic) ? null : traffic,
              firstSeen || null,
              lastSeen || null
            );
            stats.imported++;
          } catch (error: any) {
            stats.errors.push(error.message);
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
      res.status(400).json({ error: `CSV parsing error: ${error.message}` });
    },
  });
});

// Delete backlink
backlinksRouter.delete('/:id', (req: Request, res: Response) => {
  const db = getDatabase();

  const existing = db.prepare('SELECT * FROM backlinks WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Backlink not found' });
    return;
  }

  db.prepare('DELETE FROM backlinks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Backlink deleted successfully' });
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

// Get unique source paths for a domain (to help create redirects)
backlinksRouter.get('/domain/:domain_id/paths', (req: Request, res: Response) => {
  const db = getDatabase();

  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.domain_id);
  if (!domain) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }

  const paths = db.prepare(`
    SELECT source_path, COUNT(*) as backlink_count, MAX(domain_rating) as max_dr
    FROM backlinks
    WHERE domain_id = ?
    GROUP BY source_path
    ORDER BY backlink_count DESC, max_dr DESC
  `).all(req.params.domain_id);

  res.json(paths);
});

// Auto-generate redirects from backlinks
backlinksRouter.post('/domain/:domain_id/generate-redirects', (req: Request, res: Response) => {
  const { target_url, min_dr } = req.body;
  const domain_id = req.params.domain_id;

  if (!target_url) {
    res.status(400).json({ error: 'target_url is required' });
    return;
  }

  const db = getDatabase();

  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(domain_id);
  if (!domain) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }

  // Get unique paths from backlinks
  let query = `
    SELECT DISTINCT source_path
    FROM backlinks
    WHERE domain_id = ?
  `;
  const params: any[] = [domain_id];

  if (min_dr) {
    query += ' AND domain_rating >= ?';
    params.push(min_dr);
  }

  const paths = db.prepare(query).all(...params) as { source_path: string }[];

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO redirects (domain_id, source_path, target_url, redirect_type, priority)
    VALUES (?, ?, ?, '301', 0)
  `);

  let created = 0;

  const transaction = db.transaction(() => {
    for (const { source_path } of paths) {
      const result = insertStmt.run(domain_id, source_path, target_url);
      if (result.changes > 0) created++;
    }
  });

  transaction();

  res.json({
    message: 'Redirects generated',
    created,
    total_paths: paths.length,
  });
});
