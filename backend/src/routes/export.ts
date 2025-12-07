import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/database';

export const exportRouter = Router();

interface ExportQuery {
  domain_ids?: string;
  project_ids?: string;
  format?: 'indexnow' | 'csv' | 'json' | 'txt';
}

// Helper to get domain IDs from query params
function getDomainIds(query: ExportQuery): number[] {
  const db = getDatabase();
  let domainIds: number[] = [];

  if (query.domain_ids) {
    domainIds = query.domain_ids.split(',').map((id) => parseInt(id.trim()));
  } else if (query.project_ids) {
    const projectIds = query.project_ids.split(',').map((id) => parseInt(id.trim()));
    const domains = db.prepare(`
      SELECT id FROM domains WHERE project_id IN (${projectIds.map(() => '?').join(',')})
    `).all(...projectIds) as { id: number }[];
    domainIds = domains.map((d) => d.id);
  } else {
    // All active domains
    const domains = db.prepare(`SELECT id FROM domains WHERE status = 'active'`).all() as { id: number }[];
    domainIds = domains.map((d) => d.id);
  }

  return domainIds;
}

// Export URLs for IndexNow
exportRouter.get('/indexnow', (req: Request<{}, {}, {}, ExportQuery>, res: Response) => {
  const db = getDatabase();
  const domainIds = getDomainIds(req.query);

  if (domainIds.length === 0) {
    res.status(400).json({ error: 'No domains found' });
    return;
  }

  const redirects = db.prepare(`
    SELECT d.domain_name, r.source_path
    FROM redirects r
    JOIN domains d ON r.domain_id = d.id
    WHERE r.domain_id IN (${domainIds.map(() => '?').join(',')})
    ORDER BY d.domain_name, r.source_path
  `).all(...domainIds) as { domain_name: string; source_path: string }[];

  // Format for IndexNow
  const urls = redirects.map((r) => `https://${r.domain_name}${r.source_path}`);

  // IndexNow format
  const indexNowPayload = {
    host: redirects.length > 0 ? redirects[0].domain_name : '',
    key: '<YOUR_INDEXNOW_KEY>',
    keyLocation: `https://${redirects.length > 0 ? redirects[0].domain_name : 'example.com'}/<YOUR_KEY>.txt`,
    urlList: urls,
  };

  res.json(indexNowPayload);
});

// Export URLs as plain text (one per line)
exportRouter.get('/urls', (req: Request<{}, {}, {}, ExportQuery>, res: Response) => {
  const db = getDatabase();
  const domainIds = getDomainIds(req.query);

  if (domainIds.length === 0) {
    res.type('text/plain').send('');
    return;
  }

  const redirects = db.prepare(`
    SELECT d.domain_name, r.source_path
    FROM redirects r
    JOIN domains d ON r.domain_id = d.id
    WHERE r.domain_id IN (${domainIds.map(() => '?').join(',')})
    ORDER BY d.domain_name, r.source_path
  `).all(...domainIds) as { domain_name: string; source_path: string }[];

  const urls = redirects.map((r) => `https://${r.domain_name}${r.source_path}`);
  res.type('text/plain').send(urls.join('\n'));
});

// Export as CSV
exportRouter.get('/csv', (req: Request<{}, {}, {}, ExportQuery>, res: Response) => {
  const db = getDatabase();
  const domainIds = getDomainIds(req.query);

  if (domainIds.length === 0) {
    res.type('text/csv').send('source_url,target_url,status_code\n');
    return;
  }

  const redirects = db.prepare(`
    SELECT d.domain_name, r.source_path, r.target_url, r.redirect_type
    FROM redirects r
    JOIN domains d ON r.domain_id = d.id
    WHERE r.domain_id IN (${domainIds.map(() => '?').join(',')})
    ORDER BY d.domain_name, r.source_path
  `).all(...domainIds) as {
    domain_name: string;
    source_path: string;
    target_url: string;
    redirect_type: string;
  }[];

  let csv = 'source_url,target_url,status_code\n';
  for (const r of redirects) {
    const sourceUrl = `https://${r.domain_name}${r.source_path}`;
    csv += `"${sourceUrl}","${r.target_url}",${r.redirect_type}\n`;
  }

  res.type('text/csv').send(csv);
});

// Export as JSON
exportRouter.get('/json', (req: Request<{}, {}, {}, ExportQuery>, res: Response) => {
  const db = getDatabase();
  const domainIds = getDomainIds(req.query);

  if (domainIds.length === 0) {
    res.json({ redirects: [] });
    return;
  }

  const redirects = db.prepare(`
    SELECT
      d.domain_name,
      d.id as domain_id,
      r.id as redirect_id,
      r.source_path,
      r.target_url,
      r.redirect_type,
      r.is_regex,
      r.priority
    FROM redirects r
    JOIN domains d ON r.domain_id = d.id
    WHERE r.domain_id IN (${domainIds.map(() => '?').join(',')})
    ORDER BY d.domain_name, r.priority DESC, r.source_path
  `).all(...domainIds);

  res.json({ redirects });
});

// Export backlink URLs (the original URLs that have backlinks pointing to them)
exportRouter.get('/backlink-urls', (req: Request<{}, {}, {}, ExportQuery>, res: Response) => {
  const db = getDatabase();
  const domainIds = getDomainIds(req.query);

  if (domainIds.length === 0) {
    res.type('text/plain').send('');
    return;
  }

  const backlinks = db.prepare(`
    SELECT DISTINCT d.domain_name, b.source_path
    FROM backlinks b
    JOIN domains d ON b.domain_id = d.id
    WHERE b.domain_id IN (${domainIds.map(() => '?').join(',')})
    ORDER BY d.domain_name, b.source_path
  `).all(...domainIds) as { domain_name: string; source_path: string }[];

  const urls = backlinks.map((b) => `https://${b.domain_name}${b.source_path}`);
  res.type('text/plain').send(urls.join('\n'));
});

// Dashboard stats
exportRouter.get('/stats', (req: Request, res: Response) => {
  const db = getDatabase();

  const stats = {
    total_projects: (db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }).count,
    total_domains: (db.prepare('SELECT COUNT(*) as count FROM domains').get() as { count: number }).count,
    active_domains: (db.prepare("SELECT COUNT(*) as count FROM domains WHERE status = 'active'").get() as { count: number }).count,
    total_redirects: (db.prepare('SELECT COUNT(*) as count FROM redirects').get() as { count: number }).count,
    total_backlinks: (db.prepare('SELECT COUNT(*) as count FROM backlinks').get() as { count: number }).count,
    domains_by_status: db.prepare(`
      SELECT status, COUNT(*) as count
      FROM domains
      GROUP BY status
    `).all(),
    recent_domains: db.prepare(`
      SELECT id, domain_name, status, created_at
      FROM domains
      ORDER BY created_at DESC
      LIMIT 5
    `).all(),
  };

  res.json(stats);
});
