import { Router, Response } from 'express';
import db from '../db/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { Domain, Backlink, DomainWithBacklinks } from '../models/types';
import { generateAllNginxConfigs, reloadNginx } from '../services/nginxGenerator';

const router = Router();

// Get all domains
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const domains = db.prepare(`
    SELECT d.*, COUNT(b.id) as backlink_count
    FROM domains d
    LEFT JOIN backlinks b ON d.id = b.domain_id
    GROUP BY d.id
    ORDER BY d.priority DESC, d.created_at DESC
  `).all() as (Domain & { backlink_count: number })[];

  res.json(domains);
});

// Get single domain with backlinks
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id) as Domain | undefined;

  if (!domain) {
    return res.status(404).json({ error: 'Domain not found' });
  }

  const backlinks = db.prepare('SELECT * FROM backlinks WHERE domain_id = ? ORDER BY url_path, created_at DESC').all(req.params.id) as Backlink[];

  const result: DomainWithBacklinks = {
    ...domain,
    backlinks,
    backlink_count: backlinks.length
  };

  res.json(result);
});

// Create domain
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const { domain_name, target_url, redirect_mode, unmatched_behavior, notes, priority } = req.body;

  if (!domain_name || !target_url) {
    return res.status(400).json({ error: 'Domain name and target URL required' });
  }

  // Clean domain name (remove protocol if present)
  const cleanDomain = domain_name.replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase();

  // Validate target URL
  try {
    new URL(target_url);
  } catch {
    return res.status(400).json({ error: 'Invalid target URL' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO domains (domain_name, target_url, redirect_mode, unmatched_behavior, notes, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      cleanDomain,
      target_url,
      redirect_mode || 'full',
      unmatched_behavior || '404',
      notes || null,
      priority || 0
    );

    const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(result.lastInsertRowid) as Domain;

    res.status(201).json(domain);
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Domain already exists' });
    }
    throw err;
  }
});

// Update domain
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { domain_name, target_url, redirect_mode, unmatched_behavior, notes, priority } = req.body;

  const existing = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id) as Domain | undefined;

  if (!existing) {
    return res.status(404).json({ error: 'Domain not found' });
  }

  // Clean domain name if provided
  const cleanDomain = domain_name
    ? domain_name.replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase()
    : existing.domain_name;

  // Validate target URL if provided
  if (target_url) {
    try {
      new URL(target_url);
    } catch {
      return res.status(400).json({ error: 'Invalid target URL' });
    }
  }

  db.prepare(`
    UPDATE domains SET
      domain_name = ?,
      target_url = ?,
      redirect_mode = ?,
      unmatched_behavior = ?,
      notes = ?,
      priority = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    cleanDomain,
    target_url || existing.target_url,
    redirect_mode || existing.redirect_mode,
    unmatched_behavior || existing.unmatched_behavior,
    notes !== undefined ? notes : existing.notes,
    priority !== undefined ? priority : existing.priority,
    req.params.id
  );

  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id) as Domain;

  // Regenerate nginx config if domain was active
  if (existing.status === 'active') {
    await generateAllNginxConfigs();
    await reloadNginx();
  }

  res.json(domain);
});

// Delete domain
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const existing = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id) as Domain | undefined;

  if (!existing) {
    return res.status(404).json({ error: 'Domain not found' });
  }

  const wasActive = existing.status === 'active';

  // Delete backlinks first (cascade should handle this, but being explicit)
  db.prepare('DELETE FROM backlinks WHERE domain_id = ?').run(req.params.id);
  db.prepare('DELETE FROM domains WHERE id = ?').run(req.params.id);

  // Regenerate nginx configs if domain was active
  if (wasActive) {
    await generateAllNginxConfigs();
    await reloadNginx();
  }

  res.json({ message: 'Domain deleted successfully' });
});

// Activate domain
router.post('/:id/activate', authenticateToken, async (req: AuthRequest, res: Response) => {
  const existing = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id) as Domain | undefined;

  if (!existing) {
    return res.status(404).json({ error: 'Domain not found' });
  }

  db.prepare('UPDATE domains SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('active', req.params.id);

  // Generate nginx config
  await generateAllNginxConfigs();
  await reloadNginx();

  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id) as Domain;
  res.json(domain);
});

// Deactivate domain
router.post('/:id/deactivate', authenticateToken, async (req: AuthRequest, res: Response) => {
  const existing = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id) as Domain | undefined;

  if (!existing) {
    return res.status(404).json({ error: 'Domain not found' });
  }

  db.prepare('UPDATE domains SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('inactive', req.params.id);

  // Regenerate nginx configs
  await generateAllNginxConfigs();
  await reloadNginx();

  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id) as Domain;
  res.json(domain);
});

export default router;
