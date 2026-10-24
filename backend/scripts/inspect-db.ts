// Mostra o conteúdo do banco em tabelas legíveis (somente leitura, pode rodar com o servidor ligado).
// Uso: npm run db
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '..', 'data', 'agroscan.db'), { readonly: true, fileMustExist: true });

function section(title: string): void {
  console.log(`\n=== ${title} ===`);
}

section('Tabelas e quantidade de linhas');
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .all() as { name: string }[];
console.table(
  tables.map((t) => ({ tabela: t.name, linhas: (db.prepare(`SELECT COUNT(*) AS c FROM ${t.name}`).get() as { c: number }).c }))
);

section('users  (a senha nunca é guardada: só o hash bcrypt)');
console.table(
  db
    .prepare(
      `SELECT id, name, email, farm_name,
              substr(password_hash, 1, 29) || '...' AS password_hash,
              datetime(created_at / 1000, 'unixepoch', 'localtime') AS criado_em
       FROM users ORDER BY id`
    )
    .all()
);

section('pests  (catálogo compartilhado por todos os usuários)');
console.table(db.prepare('SELECT id, name, crop, severity FROM pests ORDER BY id').all());

section('detections  (últimas 5 — cada uma tem user_id e aponta para uma praga)');
console.table(
  db
    .prepare(
      `SELECT d.id, d.user_id, p.name AS praga, round(d.confidence, 1) AS confianca, d.sector AS setor, d.photo_url
       FROM detections d JOIN pests p ON p.id = d.pest_id
       ORDER BY d.timestamp DESC LIMIT 5`
    )
    .all()
);

section('service_orders  (últimas 5)');
console.table(
  db.prepare('SELECT id, user_id, code, product, sector, status FROM service_orders ORDER BY rowid DESC LIMIT 5').all()
);

section('sectors  (últimos 4)');
console.table(
  db.prepare('SELECT id, user_id, name, crop, hectares, health_score, status FROM sectors ORDER BY rowid DESC LIMIT 4').all()
);
