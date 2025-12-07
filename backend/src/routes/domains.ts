import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/database';
import { Domain, CreateDomainRequest } from '../models/types';

export const domainsRouter = Router();

// Get all domains
domainsRouter.get('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const { project_id, status } = req.query;

  let query = `
    SELECT d.*,
      p.name as project_name,
      p.base_url as project_base_url,
      (SELECT COUNT(*) FROM redirects WHERE domain_id = d.id) as redirect_count,
      (SELECT COUNT(*) FROM backlinks WHERE domain_id = d.id) as backlink_count
    FROM domains d
    LEFT JOIN projects p ON d.project_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (project_id) {
    query += ' AND d.project_id = ?';
    params.push(project_id);
  }

  if (status) {
    query += ' AND d.status = ?';
    params.push(status);
  }

  query += ' ORDER BY d.domain_name';

  const domains = db.prepare(query).all(...params);
  res.json(domains);
});

// Get single domain
domainsRouter.get('/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const domain = db.prepare(`
    SELECT d.*,
      p.name as project_name,
      p.base_url as project_base_url,
      (SELECT COUNT(*) FROM redirects WHERE domain_id = d.id) as redirect_count,
      (SELECT COUNT(*) FROM backlinks WHERE domain_id = d.id) as backlink_count
    FROM domains d
    LEFT JOIN projects p ON d.project_id = p.id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!domain) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }

  res.json(domain);
});

// Create domain
domainsRouter.post('/', (req: Request<{}, {}, CreateDomainRequest>, res: Response) => {
  const { domain_name, project_id, redirect_type, status, notes } = req.body;

  if (!domain_name) {
    res.status(400).json({ error: 'Domain name is required' });
    return;
  }

  // Normalize domain name (remove protocol, www, trailing slash)
  const normalizedDomain = domain_name
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');

  const db = getDatabase();

  try {
    const result = db.prepare(`
      INSERT INTO domains (domain_name, project_id, redirect_type, status, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      normalizedDomain,
      project_id || null,
      redirect_type || 'partial',
      status || 'pending',
      notes || null
    );

    const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(domain);
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint')) {
      res.status(400).json({ error: 'Domain already exists' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Bulk create domains
domainsRouter.post('/bulk', (req: Request, res: Response) => {
  const { domains, project_id } = req.body;

  if (!Array.isArray(domains) || domains.length === 0) {
    res.status(400).json({ error: 'Domains array is required' });
    return;
  }

  const db = getDatabase();
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO domains (domain_name, project_id, redirect_type, status)
    VALUES (?, ?, 'partial', 'pending')
  `);

  const results = { created: 0, skipped: 0 };

  const transaction = db.transaction(() => {
    for (const domainName of domains) {
      const normalized = domainName
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');

      const result = insertStmt.run(normalized, project_id || null);
      if (result.changes > 0) {
        results.created++;
      } else {
        results.skipped++;
      }
    }
  });

  transaction();
  res.status(201).json(results);
});

// Update domain
domainsRouter.put('/:id', (req: Request, res: Response) => {
  const { domain_name, project_id, redirect_type, status, notes } = req.body;
  const db = getDatabase();

  const existing = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }

  try {
    db.prepare(`
      UPDATE domains
      SET domain_name = COALESCE(?, domain_name),
          project_id = ?,
          redirect_type = COALESCE(?, redirect_type),
          status = COALESCE(?, status),
          notes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      domain_name || null,
      project_id !== undefined ? project_id : (existing as Domain).project_id,
      redirect_type || null,
      status || null,
      notes !== undefined ? notes : (existing as Domain).notes,
      req.params.id
    );

    const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id);
    res.json(domain);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete domain
domainsRouter.delete('/:id', (req: Request, res: Response) => {
  const db = getDatabase();

  const existing = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }

  db.prepare('DELETE FROM domains WHERE id = ?').run(req.params.id);
  res.json({ message: 'Domain deleted successfully' });
});

// Get redirects for a domain
domainsRouter.get('/:id/redirects', (req: Request, res: Response) => {
  const db = getDatabase();

  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id);
  if (!domain) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }

  const redirects = db.prepare(`
    SELECT * FROM redirects
    WHERE domain_id = ?
    ORDER BY priority DESC, source_path
  `).all(req.params.id);

  res.json(redirects);
});

// Get backlinks for a domain
domainsRouter.get('/:id/backlinks', (req: Request, res: Response) => {
  const db = getDatabase();

  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id);
  if (!domain) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }

  const backlinks = db.prepare(`
    SELECT * FROM backlinks
    WHERE domain_id = ?
    ORDER BY domain_rating DESC, created_at DESC
  `).all(req.params.id);

  res.json(backlinks);
});
