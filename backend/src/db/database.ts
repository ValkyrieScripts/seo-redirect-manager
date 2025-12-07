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
    -- Projects table
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      base_url TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Domains table
    CREATE TABLE IF NOT EXISTS domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_name TEXT NOT NULL UNIQUE,
      project_id INTEGER,
      redirect_type TEXT DEFAULT 'partial' CHECK(redirect_type IN ('full', 'partial')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('active', 'inactive', 'pending')),
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
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

    -- Backlinks table
    CREATE TABLE IF NOT EXISTS backlinks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id INTEGER NOT NULL,
      source_url TEXT NOT NULL,
      source_path TEXT NOT NULL,
      referring_domain TEXT NOT NULL,
      anchor_text TEXT,
      domain_rating INTEGER,
      url_rating INTEGER,
      traffic INTEGER,
      first_seen TEXT,
      last_seen TEXT,
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
    CREATE INDEX IF NOT EXISTS idx_domains_project ON domains(project_id);
    CREATE INDEX IF NOT EXISTS idx_redirects_domain ON redirects(domain_id);
    CREATE INDEX IF NOT EXISTS idx_backlinks_domain ON backlinks(domain_id);
    CREATE INDEX IF NOT EXISTS idx_backlinks_source_path ON backlinks(source_path);
  `);

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
