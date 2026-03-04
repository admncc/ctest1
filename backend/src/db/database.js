const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/platform.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);

// Performance settings
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    UNIQUE NOT NULL,
    password    TEXT    NOT NULL,
    name        TEXT    NOT NULL,
    role        TEXT    NOT NULL CHECK(role IN ('customer','craftsman')),
    location    TEXT,
    bio         TEXT,
    phone       TEXT,
    avatar      TEXT,
    is_admin    INTEGER DEFAULT 0,
    banned      INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL,
    icon  TEXT NOT NULL,
    slug  TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS craftsman_profiles (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specializations  TEXT    DEFAULT '[]',
    hourly_rate      REAL,
    service_radius   INTEGER DEFAULT 50,
    verified         INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT    NOT NULL,
    description     TEXT    NOT NULL,
    category_id     INTEGER REFERENCES categories(id),
    location        TEXT    NOT NULL,
    budget_min      REAL,
    budget_max      REAL,
    status          TEXT    DEFAULT 'open' CHECK(status IN ('open','in_progress','completed','cancelled')),
    customer_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    accepted_bid_id INTEGER,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bids (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id        INTEGER NOT NULL REFERENCES jobs(id)  ON DELETE CASCADE,
    craftsman_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount        REAL    NOT NULL,
    message       TEXT    NOT NULL,
    status        TEXT    DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, craftsman_id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id       INTEGER NOT NULL REFERENCES jobs(id)  ON DELETE CASCADE,
    reviewer_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating       INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment      TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, reviewer_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id      INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    content     TEXT    NOT NULL,
    read        INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ─── Seed categories ──────────────────────────────────────────────────────────

const categoryCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
if (categoryCount === 0) {
  const insert = db.prepare('INSERT INTO categories (name, icon, slug) VALUES (?, ?, ?)');
  const categories = [
    ['Elektrik',          '⚡', 'elektrik'],
    ['Sanitär & Heizung', '🔧', 'sanitaer'],
    ['Malerei & Tapete',  '🎨', 'malerei'],
    ['Bodenbeläge',       '🏠', 'bodenbelaege'],
    ['Garten & Terrasse', '🌿', 'garten'],
    ['Umzug & Transport', '🚛', 'umzug'],
    ['Schlosserei',       '🔑', 'schlosserei'],
    ['Dach & Fassade',    '🏗️', 'dach'],
    ['IT & Elektronik',   '💻', 'it'],
    ['Reinigung',         '🧹', 'reinigung'],
    ['Hausbau & Renovierung', '🏚️', 'renovierung'],
    ['Sonstiges',         '🛠️', 'sonstiges'],
  ];
  const insertMany = db.transaction((rows) => rows.forEach(r => insert.run(...r)));
  insertMany(categories);
}

// ─── Seed default admin ───────────────────────────────────────────────────────

const bcrypt = require('bcryptjs');
const adminExists = db.prepare("SELECT id FROM users WHERE email='deine@adminmail.de'").get();
if (!adminExists) {
  const hashed = bcrypt.hashSync('testadmin', 10);
  db.prepare(
    "INSERT INTO users (email, password, name, role, is_admin) VALUES ('deine@adminmail.de', ?, 'Admin', 'customer', 1)"
  ).run(hashed);
  console.log('✅ Standard-Admin erstellt: deine@adminmail.de / testadmin');
}

// Also support ADMIN_EMAIL env override
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
if (ADMIN_EMAIL) {
  db.prepare('UPDATE users SET is_admin=1 WHERE email=?').run(ADMIN_EMAIL.toLowerCase());
}

module.exports = db;
