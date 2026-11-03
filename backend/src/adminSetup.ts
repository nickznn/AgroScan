import bcrypt from 'bcryptjs';
import db from './db';

// Conta de administrador de DEMONSTRAÇÃO (só em desenvolvimento). Em produção, defina ADMIN_EMAIL e ADMIN_PASSWORD.
export const DEMO_ADMIN = { email: 'admin@agroscan.com', password: 'Admin@1234', name: 'Administrador' };

export interface EnsureAdminResult {
  action: 'created' | 'promoted' | 'updated';
  email: string;
}

/** Cria o usuário administrador, ou promove (e reativa) um usuário que já existe com esse e-mail. */
export function ensureAdmin(email: string, password: string, name = 'Administrador'): EnsureAdminResult {
  const normalized = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id, role FROM users WHERE email = ?').get(normalized) as { id: number; role: string } | undefined;
  const hash = bcrypt.hashSync(password, 10);
  if (existing) {
    db.prepare("UPDATE users SET role = 'admin', active = 1, password_hash = ? WHERE id = ?").run(hash, existing.id);
    return { action: existing.role === 'admin' ? 'updated' : 'promoted', email: normalized };
  }
  db.prepare("INSERT INTO users (name, email, password_hash, farm_name, created_at, role, active) VALUES (?, ?, ?, 'AgroScan Admin', ?, 'admin', 1)").run(
    name,
    normalized,
    hash,
    Date.now()
  );
  return { action: 'created', email: normalized };
}

export function adminCount(): number {
  return (db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1").get() as { n: number }).n;
}

/**
 * Chamado ao ligar o servidor. Se ainda não existe nenhum administrador:
 * - ADMIN_EMAIL + ADMIN_PASSWORD definidos: cria esse administrador (use isto em produção);
 * - senão, fora de produção, cria o administrador de demonstração (e avisa no terminal).
 */
export function ensureDefaultAdmin(): void {
  if (adminCount() > 0) return;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    ensureAdmin(email, password);
    console.log(`Administrador criado a partir de ADMIN_EMAIL: ${email.trim().toLowerCase()}`);
    return;
  }
  if (process.env.NODE_ENV === 'production') {
    console.warn('Nenhum administrador existe. Defina ADMIN_EMAIL e ADMIN_PASSWORD, ou rode: npm run admin:create');
    return;
  }
  ensureAdmin(DEMO_ADMIN.email, DEMO_ADMIN.password, DEMO_ADMIN.name);
  console.log(`Administrador de demonstração criado: ${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}  (só para desenvolvimento)`);
}
