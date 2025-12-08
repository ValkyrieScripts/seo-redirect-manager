import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/database';

export const nginxRouter = Router();

// Generate Nginx redirect configuration (simplified - all paths to target_url)
nginxRouter.get('/config', (req: Request, res: Response) => {
  const db = getDatabase();

  const domains = db.prepare(`
    SELECT * FROM domains
    WHERE status = 'active' AND target_url != ''
    ORDER BY domain_name
  `).all() as any[];

  let config = `# Auto-generated Nginx redirect configuration
# Generated at: ${new Date().toISOString()}
# Do not edit manually - changes will be overwritten

`;

  for (const domain of domains) {
    config += `# Domain: ${domain.domain_name} -> ${domain.target_url}
server {
    listen 80;
    server_name ${domain.domain_name} www.${domain.domain_name};

    location / {
        return 301 ${domain.target_url};
    }
}

`;
  }

  res.type('text/plain').send(config);
});

// Generate Lua redirect rules for OpenResty (simplified)
nginxRouter.get('/lua', (req: Request, res: Response) => {
  const db = getDatabase();

  const domains = db.prepare(`
    SELECT domain_name, target_url FROM domains
    WHERE status = 'active' AND target_url != ''
    ORDER BY domain_name
  `).all() as any[];

  let lua = `-- Auto-generated Lua redirect rules for OpenResty
-- Generated at: ${new Date().toISOString()}
-- All paths redirect to the domain's target_url

local redirects = {
`;

  for (const domain of domains) {
    lua += `  ["${domain.domain_name}"] = [[${domain.target_url}]],\n`;
  }

  lua += `}

local function find_redirect()
  local host = ngx.var.host:gsub("^www%.", ""):lower()
  local target = redirects[host]

  if target then
    return target, 301
  end

  return nil
end

local target, code = find_redirect()
if target then
  ngx.redirect(target, code)
else
  ngx.exit(404)
end
`;

  res.type('text/plain').send(lua);
});

// Generate JSON redirect map
nginxRouter.get('/map.json', (req: Request, res: Response) => {
  const db = getDatabase();

  const domains = db.prepare(`
    SELECT domain_name, target_url FROM domains
    WHERE status = 'active' AND target_url != ''
    ORDER BY domain_name
  `).all() as any[];

  const map: Record<string, string> = {};
  for (const d of domains) {
    map[d.domain_name] = d.target_url;
  }

  res.json(map);
});

// Preview domain redirect config
nginxRouter.get('/preview/:domain_id', (req: Request, res: Response) => {
  const db = getDatabase();

  const domain = db.prepare(`
    SELECT * FROM domains WHERE id = ?
  `).get(req.params.domain_id) as any;

  if (!domain) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }

  res.json({
    domain_name: domain.domain_name,
    target_url: domain.target_url,
    status: domain.status,
    will_redirect: domain.status === 'active' && domain.target_url,
  });
});
