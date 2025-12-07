import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/database';
import { CreateRedirectRequest } from '../models/types';

export const redirectsRouter = Router();

// Get all redirects
redirectsRouter.get('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const { domain_id } = req.query;

  let query = `
    SELECT r.*, d.domain_name
    FROM redirects r
    JOIN domains d ON r.domain_id = d.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (domain_id) {
    query += ' AND r.domain_id = ?';
    params.push(domain_id);
  }

  query += ' ORDER BY d.domain_name, r.priority DESC, r.source_path';

  const redirects = db.prepare(query).all(...params);
  res.json(redirects);
});

// Get single redirect
redirectsRouter.get('/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const redirect = db.prepare(`
    SELECT r.*, d.domain_name
    FROM redirects r
    JOIN domains d ON r.domain_id = d.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!redirect) {
    res.status(404).json({ error: 'Redirect not found' });
    return;
  }

  res.json(redirect);
});

// Create redirect
redirectsRouter.post('/', (req: Request<{}, {}, CreateRedirectRequest>, res: Response) => {
  const { domain_id, source_path, target_url, redirect_type, is_regex, priority } = req.body;

  if (!domain_id || !source_path || !target_url) {
    res.status(400).json({ error: 'domain_id, source_path, and target_url are required' });
    return;
  }

  const db = getDatabase();

  // Verify domain exists
  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(domain_id);
  if (!domain) {
    res.status(400).json({ error: 'Domain not found' });
    return;
  }

  // Normalize source path (ensure it starts with /)
  const normalizedPath = source_path.startsWith('/') ? source_path : `/${source_path}`;

  try {
    const result = db.prepare(`
      INSERT INTO redirects (domain_id, source_path, target_url, redirect_type, is_regex, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      domain_id,
      normalizedPath,
      target_url,
      redirect_type || '301',
      is_regex ? 1 : 0,
      priority || 0
    );

    const redirect = db.prepare('SELECT * FROM redirects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(redirect);
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint')) {
      res.status(400).json({ error: 'Redirect for this path already exists' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Bulk create redirects
redirectsRouter.post('/bulk', (req: Request, res: Response) => {
  const { redirects } = req.body;

  if (!Array.isArray(redirects) || redirects.length === 0) {
    res.status(400).json({ error: 'Redirects array is required' });
    return;
  }

  const db = getDatabase();
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO redirects (domain_id, source_path, target_url, redirect_type, is_regex, priority)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const results = { created: 0, errors: [] as string[] };

  const transaction = db.transaction(() => {
    for (const redirect of redirects) {
      try {
        const normalizedPath = redirect.source_path.startsWith('/')
          ? redirect.source_path
          : `/${redirect.source_path}`;

        insertStmt.run(
          redirect.domain_id,
          normalizedPath,
          redirect.target_url,
          redirect.redirect_type || '301',
          redirect.is_regex ? 1 : 0,
          redirect.priority || 0
        );
        results.created++;
      } catch (error: any) {
        results.errors.push(`${redirect.source_path}: ${error.message}`);
      }
    }
  });

  transaction();
  res.status(201).json(results);
});

// Update redirect
redirectsRouter.put('/:id', (req: Request, res: Response) => {
  const { source_path, target_url, redirect_type, is_regex, priority } = req.body;
  const db = getDatabase();

  const existing = db.prepare('SELECT * FROM redirects WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Redirect not found' });
    return;
  }

  try {
    const normalizedPath = source_path
      ? (source_path.startsWith('/') ? source_path : `/${source_path}`)
      : null;

    db.prepare(`
      UPDATE redirects
      SET source_path = COALESCE(?, source_path),
          target_url = COALESCE(?, target_url),
          redirect_type = COALESCE(?, redirect_type),
          is_regex = COALESCE(?, is_regex),
          priority = COALESCE(?, priority),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      normalizedPath,
      target_url || null,
      redirect_type || null,
      is_regex !== undefined ? (is_regex ? 1 : 0) : null,
      priority !== undefined ? priority : null,
      req.params.id
    );

    const redirect = db.prepare('SELECT * FROM redirects WHERE id = ?').get(req.params.id);
    res.json(redirect);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete redirect
redirectsRouter.delete('/:id', (req: Request, res: Response) => {
  const db = getDatabase();

  const existing = db.prepare('SELECT * FROM redirects WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Redirect not found' });
    return;
  }

  db.prepare('DELETE FROM redirects WHERE id = ?').run(req.params.id);
  res.json({ message: 'Redirect deleted successfully' });
});

// Test a redirect (simulate what would happen)
redirectsRouter.post('/test', (req: Request, res: Response) => {
  const { domain, path } = req.body;

  if (!domain || !path) {
    res.status(400).json({ error: 'domain and path are required' });
    return;
  }

  const db = getDatabase();

  // Find the domain
  const domainRecord = db.prepare('SELECT * FROM domains WHERE domain_name = ?').get(
    domain.toLowerCase().replace(/^www\./, '')
  );

  if (!domainRecord) {
    res.json({ match: false, message: 'Domain not found' });
    return;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // First try exact match
  let redirect = db.prepare(`
    SELECT * FROM redirects
    WHERE domain_id = ? AND source_path = ? AND is_regex = 0
    ORDER BY priority DESC
    LIMIT 1
  `).get((domainRecord as any).id, normalizedPath);

  if (redirect) {
    res.json({
      match: true,
      type: 'exact',
      redirect,
      result_url: (redirect as any).target_url,
    });
    return;
  }

  // Try regex matches
  const regexRedirects = db.prepare(`
    SELECT * FROM redirects
    WHERE domain_id = ? AND is_regex = 1
    ORDER BY priority DESC
  `).all((domainRecord as any).id);

  for (const r of regexRedirects) {
    try {
      const regex = new RegExp((r as any).source_path);
      if (regex.test(normalizedPath)) {
        const resultUrl = normalizedPath.replace(regex, (r as any).target_url);
        res.json({
          match: true,
          type: 'regex',
          redirect: r,
          result_url: resultUrl,
        });
        return;
      }
    } catch (e) {
      // Invalid regex, skip
    }
  }

  // Check for catch-all (full domain redirect)
  const catchAll = db.prepare(`
    SELECT * FROM redirects
    WHERE domain_id = ? AND source_path = '/*'
    LIMIT 1
  `).get((domainRecord as any).id);

  if (catchAll) {
    res.json({
      match: true,
      type: 'catch-all',
      redirect: catchAll,
      result_url: (catchAll as any).target_url,
    });
    return;
  }

  res.json({ match: false, message: 'No matching redirect found' });
});
