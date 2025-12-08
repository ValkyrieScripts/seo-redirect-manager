import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

let db: Database.Database;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/redirects.db';
    const dbDir = path.dirname(dbPath);

    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDatabase(): void {
  const db = getDatabase();

  // Create tables
  db.exec(`
    -- Projects table (deprecated - kept for migration)
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      base_url TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Domains table (simplified: one target URL per domain)
    CREATE TABLE IF NOT EXISTS domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_name TEXT NOT NULL UNIQUE,
      target_url TEXT NOT NULL DEFAULT '',
      status TEXT DEFAULT 'pending' CHECK(status IN ('active', 'inactive', 'pending')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Redirects table
    CREATE TABLE IF NOT EXISTS redirects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id INTEGER NOT NULL,
      source_path TEXT NOT NULL,
      target_url TEXT NOT NULL,
      redirect_type TEXT DEFAULT '301' CHECK(redirect_type IN ('301', '302')),
      is_regex INTEGER DEFAULT 0,
      priority INTEGER DEFAULT 0,
      hit_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
      UNIQUE(domain_id, source_path)
    );

    -- Backlinks table (simplified: linking_site + url_path)
    CREATE TABLE IF NOT EXISTS backlinks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id INTEGER NOT NULL,
      linking_site TEXT NOT NULL,
      url_path TEXT NOT NULL DEFAULT '/',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
    );

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_redirects_domain ON redirects(domain_id);
    CREATE INDEX IF NOT EXISTS idx_backlinks_domain ON backlinks(domain_id);
    CREATE INDEX IF NOT EXISTS idx_backlinks_url_path ON backlinks(url_path);
  `);

  // Migration: Add target_url column to domains if it doesn't exist
  try {
    db.exec(`ALTER TABLE domains ADD COLUMN target_url TEXT NOT NULL DEFAULT ''`);
    console.log('Migration: Added target_url column to domains');
  } catch (e) {
    // Column already exists, ignore
  }

  // Migration: Add linking_site column to backlinks if it doesn't exist (for old schema)
  try {
    db.exec(`ALTER TABLE backlinks ADD COLUMN linking_site TEXT NOT NULL DEFAULT ''`);
    // Migrate data: copy referring_domain to linking_site if it exists
    db.exec(`UPDATE backlinks SET linking_site = referring_domain WHERE linking_site = '' AND referring_domain IS NOT NULL`);
    console.log('Migration: Added linking_site column to backlinks');
  } catch (e) {
    // Column already exists, ignore
  }

  // Create default admin user if none exists
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

  if (adminExists.count === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = bcrypt.hashSync(password, 10);

    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, passwordHash);
    console.log(`Default admin user created: ${username}`);
  }

  console.log('Database initialized successfully');
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
}
