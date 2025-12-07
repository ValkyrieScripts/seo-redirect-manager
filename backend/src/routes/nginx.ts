import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/database';
import fs from 'fs';
import path from 'path';

export const nginxRouter = Router();

// Generate Nginx redirect map configuration
nginxRouter.get('/config', (req: Request, res: Response) => {
  const db = getDatabase();

  const domains = db.prepare(`
    SELECT d.*, p.base_url as project_base_url
    FROM domains d
    LEFT JOIN projects p ON d.project_id = p.id
    WHERE d.status = 'active'
    ORDER BY d.domain_name
  `).all() as any[];

  let config = `# Auto-generated Nginx redirect configuration
# Generated at: ${new Date().toISOString()}
# Do not edit manually - changes will be overwritten

`;

  for (const domain of domains) {
    const redirects = db.prepare(`
      SELECT * FROM redirects
      WHERE domain_id = ?
      ORDER BY priority DESC, is_regex ASC, source_path
    `).all(domain.id) as any[];

    if (redirects.length === 0 && domain.redirect_type !== 'full') {
      continue;
    }

    config += `# Domain: ${domain.domain_name}\n`;
    config += `server {\n`;
    config += `    listen 80;\n`;
    config += `    listen 443 ssl;\n`;
    config += `    server_name ${domain.domain_name} www.${domain.domain_name};\n\n`;

    // Full domain redirect
    if (domain.redirect_type === 'full' && domain.project_base_url) {
      config += `    # Full domain redirect\n`;
      config += `    return 301 ${domain.project_base_url}$request_uri;\n`;
    } else {
      // Individual path redirects
      for (const redirect of redirects) {
        if (redirect.is_regex) {
          config += `    # Regex redirect (priority: ${redirect.priority})\n`;
          config += `    location ~ ${redirect.source_path} {\n`;
          config += `        return ${redirect.redirect_type} ${redirect.target_url};\n`;
          config += `    }\n\n`;
        } else if (redirect.source_path === '/*') {
          config += `    # Catch-all redirect\n`;
          config += `    location / {\n`;
          config += `        return ${redirect.redirect_type} ${redirect.target_url};\n`;
          config += `    }\n\n`;
        } else {
          config += `    # Exact path redirect\n`;
          config += `    location = ${redirect.source_path} {\n`;
          config += `        return ${redirect.redirect_type} ${redirect.target_url};\n`;
          config += `    }\n\n`;
        }
      }

      // Default: return 404
      config += `    # Default: not found\n`;
      config += `    location / {\n`;
      config += `        return 404;\n`;
      config += `    }\n`;
    }

    config += `}\n\n`;
  }

  res.type('text/plain').send(config);
});

// Generate Lua redirect rules for OpenResty
nginxRouter.get('/lua', (req: Request, res: Response) => {
  const db = getDatabase();

  const redirects = db.prepare(`
    SELECT d.domain_name, r.*
    FROM redirects r
    JOIN domains d ON r.domain_id = d.id
    JOIN domains d2 ON d2.id = r.domain_id AND d2.status = 'active'
    ORDER BY d.domain_name, r.priority DESC, r.is_regex ASC
  `).all() as any[];

  // Group by domain
  const byDomain: Record<string, any[]> = {};
  for (const r of redirects) {
    if (!byDomain[r.domain_name]) {
      byDomain[r.domain_name] = [];
    }
    byDomain[r.domain_name].push(r);
  }

  let lua = `-- Auto-generated Lua redirect rules for OpenResty
-- Generated at: ${new Date().toISOString()}
-- Place this in your nginx config: content_by_lua_file /path/to/redirects.lua;

local redirects = {
`;

  for (const [domain, rules] of Object.entries(byDomain)) {
    lua += `  ["${domain}"] = {\n`;
    for (const r of rules) {
      const isRegex = r.is_regex ? 'true' : 'false';
      lua += `    { path = [[${r.source_path}]], target = [[${r.target_url}]], code = ${r.redirect_type}, is_regex = ${isRegex}, priority = ${r.priority} },\n`;
    }
    lua += `  },\n`;
  }

  lua += `}

local function find_redirect()
  local host = ngx.var.host:gsub("^www%.", "")
  local uri = ngx.var.uri

  local domain_redirects = redirects[host]
  if not domain_redirects then
    return nil
  end

  -- Sort by priority (already sorted in query, but ensure)
  table.sort(domain_redirects, function(a, b)
    return a.priority > b.priority
  end)

  for _, rule in ipairs(domain_redirects) do
    if rule.is_regex then
      local match = ngx.re.match(uri, rule.path)
      if match then
        local target = ngx.re.sub(uri, rule.path, rule.target)
        return target, rule.code
      end
    else
      if rule.path == "/*" or uri == rule.path then
        return rule.target, rule.code
      end
    end
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

// Generate JSON redirect map (for dynamic loading)
nginxRouter.get('/map.json', (req: Request, res: Response) => {
  const db = getDatabase();

  const redirects = db.prepare(`
    SELECT d.domain_name, r.source_path, r.target_url, r.redirect_type, r.is_regex, r.priority
    FROM redirects r
    JOIN domains d ON r.domain_id = d.id
    WHERE d.status = 'active'
    ORDER BY d.domain_name, r.priority DESC
  `).all() as any[];

  // Group by domain
  const map: Record<string, any[]> = {};
  for (const r of redirects) {
    const domain = r.domain_name;
    if (!map[domain]) {
      map[domain] = [];
    }
    map[domain].push({
      path: r.source_path,
      target: r.target_url,
      code: parseInt(r.redirect_type),
      regex: !!r.is_regex,
    });
  }

  res.json(map);
});

// Preview what a domain's redirects would look like
nginxRouter.get('/preview/:domain_id', (req: Request, res: Response) => {
  const db = getDatabase();

  const domain = db.prepare(`
    SELECT d.*, p.base_url as project_base_url
    FROM domains d
    LEFT JOIN projects p ON d.project_id = p.id
    WHERE d.id = ?
  `).get(req.params.domain_id) as any;

  if (!domain) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }

  const redirects = db.prepare(`
    SELECT * FROM redirects
    WHERE domain_id = ?
    ORDER BY priority DESC, source_path
  `).all(req.params.domain_id);

  res.json({
    domain,
    redirects,
    redirect_count: redirects.length,
  });
});

// Save config to file (for deployment)
nginxRouter.post('/save', (req: Request, res: Response) => {
  const { output_path } = req.body;

  if (!output_path) {
    res.status(400).json({ error: 'output_path is required' });
    return;
  }

  const db = getDatabase();

  // Generate the config (same as /config endpoint)
  const domains = db.prepare(`
    SELECT d.*, p.base_url as project_base_url
    FROM domains d
    LEFT JOIN projects p ON d.project_id = p.id
    WHERE d.status = 'active'
    ORDER BY d.domain_name
  `).all() as any[];

  let config = `# Auto-generated Nginx redirect configuration
# Generated at: ${new Date().toISOString()}

`;

  for (const domain of domains) {
    const redirects = db.prepare(`
      SELECT * FROM redirects
      WHERE domain_id = ?
      ORDER BY priority DESC, is_regex ASC, source_path
    `).all(domain.id) as any[];

    if (redirects.length === 0 && domain.redirect_type !== 'full') continue;

    config += `server {\n`;
    config += `    listen 80;\n`;
    config += `    server_name ${domain.domain_name} www.${domain.domain_name};\n\n`;

    if (domain.redirect_type === 'full' && domain.project_base_url) {
      config += `    return 301 ${domain.project_base_url}$request_uri;\n`;
    } else {
      for (const redirect of redirects) {
        if (redirect.source_path === '/*') {
          config += `    location / { return ${redirect.redirect_type} ${redirect.target_url}; }\n`;
        } else {
          config += `    location = ${redirect.source_path} { return ${redirect.redirect_type} ${redirect.target_url}; }\n`;
        }
      }
    }

    config += `}\n\n`;
  }

  try {
    const dir = path.dirname(output_path);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(output_path, config);
    res.json({ message: 'Config saved', path: output_path });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to save config: ${error.message}` });
  }
});
