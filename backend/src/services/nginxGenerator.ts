import fs from 'fs';
import path from 'path';
import db from '../db/database';
import { Domain, Backlink } from '../models/types';
import Docker from 'dockerode';

const NGINX_CONF_DIR = path.join(__dirname, '../../nginx-conf');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Generate nginx config for a single domain
function generateDomainConfig(domain: Domain, backlinks: Backlink[]): string {
  const serverNames = `${domain.domain_name} www.${domain.domain_name}`;

  let locationBlocks = '';

  if (domain.redirect_mode === 'path-specific') {
    // Get unique paths from backlinks
    const paths = [...new Set(backlinks.map(b => b.url_path))];

    // Generate location block for each path
    for (const urlPath of paths) {
      locationBlocks += `
    # Redirect for ${urlPath}
    location = ${urlPath} {
        access_by_lua_file /etc/nginx/lua/redirects.lua;
        return 301 ${domain.target_url};
    }
`;
    }

    // Handle unmatched paths
    if (domain.unmatched_behavior === 'homepage') {
      locationBlocks += `
    # Redirect all other paths to target
    location / {
        access_by_lua_file /etc/nginx/lua/redirects.lua;
        return 301 ${domain.target_url};
    }
`;
    } else {
      locationBlocks += `
    # Return 404 for unmatched paths
    location / {
        access_by_lua_file /etc/nginx/lua/redirects.lua;
        return 404;
    }
`;
    }
  } else {
    // Full domain redirect - all paths go to target
    locationBlocks = `
    # Redirect all paths to target
    location / {
        access_by_lua_file /etc/nginx/lua/redirects.lua;
        return 301 ${domain.target_url};
    }
`;
  }

  return `# Auto-generated config for ${domain.domain_name}
# Generated at: ${new Date().toISOString()}
# Mode: ${domain.redirect_mode}
# Unmatched: ${domain.unmatched_behavior}

server {
    listen 80;
    server_name ${serverNames};
${locationBlocks}
}
`;
}

// Generate all nginx configs for active domains
export async function generateAllNginxConfigs(): Promise<void> {
  // Ensure config directory exists
  if (!fs.existsSync(NGINX_CONF_DIR)) {
    fs.mkdirSync(NGINX_CONF_DIR, { recursive: true });
  }

  // Get all active domains
  const domains = db.prepare(`
    SELECT * FROM domains WHERE status = 'active'
  `).all() as Domain[];

  // Track which config files should exist
  const expectedFiles = new Set<string>();

  // Generate config for each active domain
  for (const domain of domains) {
    const backlinks = db.prepare(`
      SELECT * FROM backlinks WHERE domain_id = ?
    `).all(domain.id) as Backlink[];

    const config = generateDomainConfig(domain, backlinks);
    const filename = `${domain.domain_name}.conf`;
    const filepath = path.join(NGINX_CONF_DIR, filename);

    fs.writeFileSync(filepath, config, 'utf-8');
    expectedFiles.add(filename);

    console.log(`Generated nginx config for ${domain.domain_name}`);
  }

  // Remove config files for inactive/deleted domains
  const existingFiles = fs.readdirSync(NGINX_CONF_DIR);
  for (const file of existingFiles) {
    if (file.endsWith('.conf') && !expectedFiles.has(file)) {
      fs.unlinkSync(path.join(NGINX_CONF_DIR, file));
      console.log(`Removed nginx config: ${file}`);
    }
  }
}

// Reload nginx container
export async function reloadNginx(): Promise<void> {
  try {
    const container = docker.getContainer('seo-redirector');
    await container.kill({ signal: 'HUP' });
    console.log('Nginx reloaded successfully');
  } catch (err: any) {
    // If container doesn't exist or docker isn't available, log but don't fail
    console.warn('Could not reload nginx:', err.message);
  }
}

// Export for manual triggering
export async function regenerateAndReload(): Promise<{ success: boolean; message: string }> {
  try {
    await generateAllNginxConfigs();
    await reloadNginx();
    return { success: true, message: 'Nginx configs regenerated and reloaded' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
