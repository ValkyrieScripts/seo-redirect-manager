import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/database';

export const exportRouter = Router();

// Dashboard stats (simplified)
exportRouter.get('/stats', (req: Request, res: Response) => {
  const db = getDatabase();

  const stats = {
    total_domains: (db.prepare('SELECT COUNT(*) as count FROM domains').get() as { count: number }).count,
    active_domains: (db.prepare("SELECT COUNT(*) as count FROM domains WHERE status = 'active'").get() as { count: number }).count,
    pending_domains: (db.prepare("SELECT COUNT(*) as count FROM domains WHERE status = 'pending'").get() as { count: number }).count,
    total_backlinks: (db.prepare('SELECT COUNT(*) as count FROM backlinks').get() as { count: number }).count,
  };

  res.json(stats);
});

// Export domains as CSV
exportRouter.get('/csv', (req: Request, res: Response) => {
  const db = getDatabase();

  const domains = db.prepare(`
    SELECT d.domain_name, d.target_url, d.status,
      (SELECT COUNT(*) FROM backlinks WHERE domain_id = d.id) as backlink_count
    FROM domains d
    ORDER BY d.domain_name
  `).all() as any[];

  let csv = 'domain,target_url,status,backlink_count\n';
  for (const d of domains) {
    csv += `"${d.domain_name}","${d.target_url}","${d.status}",${d.backlink_count}\n`;
  }

  res.type('text/csv').send(csv);
});

// Export backlink URLs (URLs that have backlinks)
exportRouter.get('/backlink-urls', (req: Request, res: Response) => {
  const db = getDatabase();
  const { domain_id } = req.query;

  let query = `
    SELECT DISTINCT d.domain_name, b.url_path
    FROM backlinks b
    JOIN domains d ON b.domain_id = d.id
  `;
  const params: any[] = [];

  if (domain_id) {
    query += ' WHERE b.domain_id = ?';
    params.push(domain_id);
  }

  query += ' ORDER BY d.domain_name, b.url_path';

  const backlinks = db.prepare(query).all(...params) as { domain_name: string; url_path: string }[];
  const urls = backlinks.map((b) => `https://${b.domain_name}${b.url_path}`);

  res.type('text/plain').send(urls.join('\n'));
});
