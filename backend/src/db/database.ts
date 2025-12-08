import Database, { Database as DatabaseType } from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/seo-redirects.db');
const db: DatabaseType = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize database schema
export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Domains table
  db.exec(`
    CREATE TABLE IF NOT EXISTS domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_name TEXT UNIQUE NOT NULL,
      target_url TEXT NOT NULL,
      redirect_mode TEXT DEFAULT 'full' CHECK(redirect_mode IN ('full', 'path-specific')),
      unmatched_behavior TEXT DEFAULT '404' CHECK(unmatched_behavior IN ('404', 'homepage')),
      status TEXT DEFAULT 'inactive' CHECK(status IN ('active', 'inactive')),
      notes TEXT,
      priority INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Backlinks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS backlinks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id INTEGER NOT NULL,
      linking_url TEXT NOT NULL,
      url_path TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_backlinks_domain_id ON backlinks(domain_id);
    CREATE INDEX IF NOT EXISTS idx_backlinks_url_path ON backlinks(url_path);
    CREATE INDEX IF NOT EXISTS idx_domains_status ON domains(status);
  `);

  // Create default admin user if not exists
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || '1509';

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername);

  if (!existingUser) {
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(adminUsername, passwordHash);
    console.log(`Created default admin user: ${adminUsername}`);
  }
}

export default db;
