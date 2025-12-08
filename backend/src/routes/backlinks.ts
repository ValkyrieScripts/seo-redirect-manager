import { Router, Response } from 'express';
import db from '../db/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { Domain, Backlink } from '../models/types';
import { generateAllNginxConfigs, reloadNginx } from '../services/nginxGenerator';

const router = Router();

// Get all backlinks for a domain
router.get('/:domain_id', authenticateToken, (req: AuthRequest, res: Response) => {
  const domain = db.prepare('SELECT id FROM domains WHERE id = ?').get(req.params.domain_id);

  if (!domain) {
    return res.status(404).json({ error: 'Domain not found' });
  }

  const backlinks = db.prepare(`
    SELECT * FROM backlinks
    WHERE domain_id = ?
    ORDER BY url_path, linking_url
  `).all(req.params.domain_id) as Backlink[];

  res.json(backlinks);
});

// Get backlinks grouped by path
router.get('/grouped/:domain_id', authenticateToken, (req: AuthRequest, res: Response) => {
  const domain = db.prepare('SELECT id FROM domains WHERE id = ?').get(req.params.domain_id);

  if (!domain) {
    return res.status(404).json({ error: 'Domain not found' });
  }

  const backlinks = db.prepare(`
    SELECT * FROM backlinks
    WHERE domain_id = ?
    ORDER BY url_path, linking_url
  `).all(req.params.domain_id) as Backlink[];

  // Group by path
  const grouped: { [path: string]: Backlink[] } = {};
  for (const backlink of backlinks) {
    if (!grouped[backlink.url_path]) {
      grouped[backlink.url_path] = [];
    }
    grouped[backlink.url_path].push(backlink);
  }

  // Convert to array format
  const result = Object.entries(grouped).map(([path, links]) => ({
    path,
    count: links.length,
    backlinks: links
  }));

  res.json(result);
});

// Import backlinks from CSV text
router.post('/import', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { domain_id, csv_data } = req.body;

  if (!domain_id || !csv_data) {
    return res.status(400).json({ error: 'Domain ID and CSV data required' });
  }

  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(domain_id) as Domain | undefined;

  if (!domain) {
    return res.status(404).json({ error: 'Domain not found' });
  }

  // Parse CSV data
  const lines = csv_data.trim().split('\n');
  const imported: Backlink[] = [];
  const errors: string[] = [];

  const insertStmt = db.prepare(`
    INSERT INTO backlinks (domain_id, linking_url, url_path)
    VALUES (?, ?, ?)
  `);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma, handling potential quoted values
    const parts = line.split(',').map(p => p.trim());

    if (parts.length < 2) {
      errors.push(`Line ${i + 1}: Invalid format (expected: linking_url,path)`);
      continue;
    }

    const linkingUrl = parts[0];
    let urlPath = parts[1];

    // Validate linking URL
    if (!linkingUrl.startsWith('http://') && !linkingUrl.startsWith('https://')) {
      errors.push(`Line ${i + 1}: Invalid URL format (must start with http:// or https://)`);
      continue;
    }

    // Normalize path (ensure it starts with /)
    if (!urlPath.startsWith('/')) {
      urlPath = '/' + urlPath;
    }

    try {
      const result = insertStmt.run(domain_id, linkingUrl, urlPath);
      imported.push({
        id: result.lastInsertRowid as number,
        domain_id,
        linking_url: linkingUrl,
        url_path: urlPath,
        created_at: new Date().toISOString()
      });
    } catch (err: any) {
      errors.push(`Line ${i + 1}: ${err.message}`);
    }
  }

  // Regenerate nginx config if domain is active and using path-specific mode
  if (domain.status === 'active' && domain.redirect_mode === 'path-specific') {
    await generateAllNginxConfigs();
    await reloadNginx();
  }

  res.json({
    imported: imported.length,
    errors: errors.length > 0 ? errors : undefined,
    backlinks: imported
  });
});

// Delete single backlink
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const backlink = db.prepare('SELECT * FROM backlinks WHERE id = ?').get(req.params.id) as Backlink | undefined;

  if (!backlink) {
    return res.status(404).json({ error: 'Backlink not found' });
  }

  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(backlink.domain_id) as Domain;

  db.prepare('DELETE FROM backlinks WHERE id = ?').run(req.params.id);

  // Regenerate nginx config if needed
  if (domain.status === 'active' && domain.redirect_mode === 'path-specific') {
    await generateAllNginxConfigs();
    await reloadNginx();
  }

  res.json({ message: 'Backlink deleted successfully' });
});

// Delete all backlinks for a domain
router.delete('/domain/:domain_id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.domain_id) as Domain | undefined;

  if (!domain) {
    return res.status(404).json({ error: 'Domain not found' });
  }

  const result = db.prepare('DELETE FROM backlinks WHERE domain_id = ?').run(req.params.domain_id);

  // Regenerate nginx config if needed
  if (domain.status === 'active' && domain.redirect_mode === 'path-specific') {
    await generateAllNginxConfigs();
    await reloadNginx();
  }

  res.json({
    message: 'All backlinks deleted successfully',
    deleted: result.changes
  });
});

export default router;
