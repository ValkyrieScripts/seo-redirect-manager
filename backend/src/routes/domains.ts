import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/database';

export const domainsRouter = Router();

// Get all domains with backlink counts
domainsRouter.get('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const { status } = req.query;

  let query = `
    SELECT d.*,
      (SELECT COUNT(*) FROM backlinks WHERE domain_id = d.id) as backlink_count
    FROM domains d
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    query += ' AND d.status = ?';
    params.push(status);
  }

  query += ' ORDER BY d.domain_name';

  const domains = db.prepare(query).all(...params);
  res.json(domains);
});

// Get single domain with backlink count
domainsRouter.get('/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const domain = db.prepare(`
    SELECT d.*,
      (SELECT COUNT(*) FROM backlinks WHERE domain_id = d.id) as backlink_count
    FROM domains d
    WHERE d.id = ?
  `).get(req.params.id);

  if (!domain) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }

  res.json(domain);
});

// Create domain
domainsRouter.post('/', (req: Request, res: Response) => {
  const { domain_name, target_url, status } = req.body;

  if (!domain_name) {
    res.status(400).json({ error: 'Domain name is required' });
    return;
  }

  if (!target_url) {
    res.status(400).json({ error: 'Target URL is required' });
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
      INSERT INTO domains (domain_name, target_url, status)
      VALUES (?, ?, ?)
    `).run(
      normalizedDomain,
      target_url,
      status || 'pending'
    );

    const domain = db.prepare(`
      SELECT d.*,
        (SELECT COUNT(*) FROM backlinks WHERE domain_id = d.id) as backlink_count
      FROM domains d
      WHERE d.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(domain);
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint')) {
      res.status(400).json({ error: 'Domain already exists' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Update domain
domainsRouter.put('/:id', (req: Request, res: Response) => {
  const { domain_name, target_url, status } = req.body;
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
          target_url = COALESCE(?, target_url),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      domain_name || null,
      target_url || null,
      status || null,
      req.params.id
    );

    const domain = db.prepare(`
      SELECT d.*,
        (SELECT COUNT(*) FROM backlinks WHERE domain_id = d.id) as backlink_count
      FROM domains d
      WHERE d.id = ?
    `).get(req.params.id);
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
