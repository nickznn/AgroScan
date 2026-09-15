const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'data', 'agroscan.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    farm_name TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    scientific_name TEXT NOT NULL,
    crop TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    affected_area_min REAL NOT NULL,
    affected_area_max REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sectors (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    crop TEXT NOT NULL,
    hectares REAL NOT NULL,
    health_score INTEGER NOT NULL,
    status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS detections (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pest_id TEXT NOT NULL REFERENCES pests(id),
    confidence REAL NOT NULL,
    sector TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    photo_url TEXT,
    affected_area REAL NOT NULL,
    stage TEXT NOT NULL,
    offline INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS service_orders (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    product TEXT NOT NULL,
    sector TEXT NOT NULL,
    crop TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL
  );
`);

module.exports = db;
