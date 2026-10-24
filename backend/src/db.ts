import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// A pasta data/ não vai pro git (só o .db dentro dela é ignorado); num clone novo ela não existe
// e o SQLite se recusa a abrir o arquivo, então é criada aqui.
// DB_PATH permite apontar para outro arquivo (ex: testes) sem tocar no banco de verdade.
const dbFile = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'agroscan.db');
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const db = new Database(dbFile);
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

// Migração leve: adiciona colunas novas em bancos já existentes (SQLite não tem
// "ADD COLUMN IF NOT EXISTS", então checamos o schema atual antes de alterar).
const userColumns = (db.prepare('PRAGMA table_info(users)').all() as { name: string }[]).map((c) => c.name);
if (!userColumns.includes('avatar_url')) {
  db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT');
}
if (!userColumns.includes('farm_photo_url')) {
  db.exec('ALTER TABLE users ADD COLUMN farm_photo_url TEXT');
}

export default db;
