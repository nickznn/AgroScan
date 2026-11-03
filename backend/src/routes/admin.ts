import express, { Request } from 'express';
import fs from 'fs';
import path from 'path';
import db from '../db';
import { logAudit } from '../audit';
import { requireAdmin } from '../middleware/auth';
import { OrderStatus, PestRow, Role, Severity, UserRow } from '../types';

// Tudo aqui exige papel "admin" (requireAdmin) e as ações que alteram dados ficam no registro de auditoria.
const router = express.Router();
router.use(requireAdmin);

const UPLOADS = path.join(__dirname, '..', '..', 'uploads');
const ROLES: Role[] = ['user', 'admin'];
const SEVERITIES: Severity[] = ['critical', 'moderate', 'low'];
const ORDER_STATUSES: OrderStatus[] = ['pending', 'in_progress', 'completed'];
const CROPS = ['Soja', 'Milho', 'Algodão', 'Café'];

function actor(req: Request): { id: number; email: string } {
  const row = db.prepare('SELECT email FROM users WHERE id = ?').get(req.userId) as { email: string };
  return { id: req.userId, email: row.email };
}

function count(sql: string, params: (string | number)[] = []): number {
  return (db.prepare(sql).get(...params) as { n: number }).n;
}

function removeUploads(urls: (string | null)[]): void {
  for (const url of urls) {
    if (!url) continue;
    fs.rmSync(path.join(UPLOADS, path.basename(url)), { force: true });
  }
}

// ------------------------------------------------------------------ painel
router.get('/overview', (_req, res) => {
  const DAY = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const start = today.getTime() - (6 - i) * DAY;
    return {
      date: new Date(start).toISOString().slice(0, 10),
      label: new Date(start).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      count: count('SELECT COUNT(*) AS n FROM detections WHERE timestamp >= ? AND timestamp < ?', [start, start + DAY]),
    };
  });

  const bySeverity = { critical: 0, moderate: 0, low: 0 } as Record<Severity, number>;
  const severityRows = db
    .prepare('SELECT p.severity AS severity, COUNT(*) AS n FROM detections d JOIN pests p ON p.id = d.pest_id GROUP BY p.severity')
    .all() as { severity: Severity; n: number }[];
  for (const row of severityRows) if (row.severity in bySeverity) bySeverity[row.severity] = row.n;

  const orders = { pending: 0, in_progress: 0, completed: 0 } as Record<OrderStatus, number>;
  const orderRows = db.prepare('SELECT status, COUNT(*) AS n FROM service_orders GROUP BY status').all() as { status: OrderStatus; n: number }[];
  for (const row of orderRows) if (row.status in orders) orders[row.status] = row.n;

  const topPests = db
    .prepare(
      `SELECT p.id, p.name, p.severity, COUNT(d.id) AS n
       FROM pests p LEFT JOIN detections d ON d.pest_id = p.id
       GROUP BY p.id ORDER BY n DESC, p.name LIMIT 5`
    )
    .all() as { id: string; name: string; severity: Severity; n: number }[];

  res.json({
    users: {
      total: count('SELECT COUNT(*) AS n FROM users'),
      active: count('SELECT COUNT(*) AS n FROM users WHERE active = 1'),
      suspended: count('SELECT COUNT(*) AS n FROM users WHERE active = 0'),
      admins: count("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'"),
    },
    detections: { total: count('SELECT COUNT(*) AS n FROM detections'), bySeverity, last7Days },
    orders,
    topPests: topPests.map((p) => ({ id: p.id, name: p.name, severity: p.severity, count: p.n })),
    generatedAt: Date.now(),
  });
});

// ------------------------------------------------------------------ usuários
interface AdminUserRow extends UserRow {
  detection_count: number;
  order_count: number;
}

function toAdminUser(row: AdminUserRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    farmName: row.farm_name,
    role: row.role,
    active: !!row.active,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
    detectionCount: row.detection_count,
    orderCount: row.order_count,
  };
}

const USER_SELECT = `
  SELECT u.*,
         (SELECT COUNT(*) FROM detections d WHERE d.user_id = u.id) AS detection_count,
         (SELECT COUNT(*) FROM service_orders o WHERE o.user_id = u.id) AS order_count
  FROM users u`;

router.get('/users', (req, res) => {
  const where: string[] = [];
  const params: (string | number)[] = [];
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  if (search) {
    where.push("(u.name LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')");
    const like = `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    params.push(like, like);
  }
  if (req.query.role === 'admin' || req.query.role === 'user') {
    where.push('u.role = ?');
    params.push(req.query.role);
  }
  if (req.query.status === 'suspended') where.push('u.active = 0');
  if (req.query.status === 'active') where.push('u.active = 1');
  const rows = db.prepare(`${USER_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY u.created_at DESC, u.id DESC`).all(...params) as AdminUserRow[];
  res.json({ users: rows.map(toAdminUser) });
});

router.patch('/users/:id', (req, res) => {
  const targetId = Number(req.params.id);
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId) as UserRow | undefined;
  if (!target) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  // Protege o próprio administrador de tirar o seu acesso por engano (e garante que sempre sobre um admin ativo).
  if (targetId === req.userId) {
    res.status(400).json({ error: 'Você não pode alterar o papel nem suspender a sua própria conta' });
    return;
  }
  const { role, active } = req.body || {};
  if (role === undefined && active === undefined) {
    res.status(400).json({ error: 'Informe role ou active' });
    return;
  }
  if (role !== undefined && !ROLES.includes(role)) {
    res.status(400).json({ error: 'Papel inválido' });
    return;
  }
  if (active !== undefined && typeof active !== 'boolean') {
    res.status(400).json({ error: 'active deve ser verdadeiro ou falso' });
    return;
  }

  const me = actor(req);
  if (role !== undefined && role !== target.role) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, targetId);
    logAudit(me, role === 'admin' ? 'user.promote' : 'user.demote', target.email, `papel: ${target.role} → ${role}`);
  }
  if (active !== undefined && active !== !!target.active) {
    db.prepare('UPDATE users SET active = ? WHERE id = ?').run(active ? 1 : 0, targetId);
    logAudit(me, active ? 'user.reactivate' : 'user.suspend', target.email);
  }
  const updated = db.prepare(`${USER_SELECT} WHERE u.id = ?`).get(targetId) as AdminUserRow;
  res.json({ user: toAdminUser(updated) });
});

router.delete('/users/:id', (req, res) => {
  const targetId = Number(req.params.id);
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId) as UserRow | undefined;
  if (!target) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  if (targetId === req.userId) {
    res.status(400).json({ error: 'Você não pode excluir a sua própria conta' });
    return;
  }
  const photos = db.prepare('SELECT photo_url FROM detections WHERE user_id = ?').all(targetId) as { photo_url: string | null }[];
  const detections = count('SELECT COUNT(*) AS n FROM detections WHERE user_id = ?', [targetId]);
  const orders = count('SELECT COUNT(*) AS n FROM service_orders WHERE user_id = ?', [targetId]);
  db.prepare('DELETE FROM users WHERE id = ?').run(targetId); // setores, detecções e ordens saem junto (ON DELETE CASCADE)
  removeUploads([target.avatar_url, target.farm_photo_url, ...photos.map((p) => p.photo_url)]);
  logAudit(actor(req), 'user.delete', target.email, `${detections} detecção(ões) e ${orders} ordem(ns) apagadas junto`);
  res.json({ ok: true });
});

// ------------------------------------------------------------------ ordens de todos os usuários
interface AdminOrderRow {
  id: string;
  code: string;
  product: string;
  sector: string;
  crop: string;
  date: string;
  status: OrderStatus;
  user_id: number;
  user_email: string;
}

const ORDER_SELECT = `
  SELECT o.id, o.code, o.product, o.sector, o.crop, o.date, o.status, o.user_id, u.email AS user_email
  FROM service_orders o JOIN users u ON u.id = o.user_id`;

const toAdminOrder = (r: AdminOrderRow) => ({
  id: r.id, code: r.code, product: r.product, sector: r.sector, crop: r.crop, date: r.date, status: r.status, userId: r.user_id, userEmail: r.user_email,
});

router.get('/orders', (req, res) => {
  const status = typeof req.query.status === 'string' && ORDER_STATUSES.includes(req.query.status as OrderStatus) ? req.query.status : null;
  const rows = (status
    ? db.prepare(`${ORDER_SELECT} WHERE o.status = ? ORDER BY o.rowid DESC LIMIT 200`).all(status)
    : db.prepare(`${ORDER_SELECT} ORDER BY o.rowid DESC LIMIT 200`).all()) as AdminOrderRow[];
  res.json({ orders: rows.map(toAdminOrder) });
});

router.patch('/orders/:id', (req, res) => {
  const { status } = req.body || {};
  if (!ORDER_STATUSES.includes(status)) {
    res.status(400).json({ error: 'status inválido' });
    return;
  }
  const current = db.prepare(`${ORDER_SELECT} WHERE o.id = ?`).get(req.params.id) as AdminOrderRow | undefined;
  if (!current) {
    res.status(404).json({ error: 'Ordem não encontrada' });
    return;
  }
  db.prepare('UPDATE service_orders SET status = ? WHERE id = ?').run(status, req.params.id);
  logAudit(actor(req), 'order.status', `${current.code} (${current.user_email})`, `${current.status} → ${status}`);
  res.json({ order: toAdminOrder(db.prepare(`${ORDER_SELECT} WHERE o.id = ?`).get(req.params.id) as AdminOrderRow) });
});

router.delete('/orders/:id', (req, res) => {
  const current = db.prepare(`${ORDER_SELECT} WHERE o.id = ?`).get(req.params.id) as AdminOrderRow | undefined;
  if (!current) {
    res.status(404).json({ error: 'Ordem não encontrada' });
    return;
  }
  db.prepare('DELETE FROM service_orders WHERE id = ?').run(req.params.id);
  logAudit(actor(req), 'order.delete', `${current.code} (${current.user_email})`, current.product);
  res.json({ ok: true });
});

// ------------------------------------------------------------------ catálogo de pragas
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const toPest = (r: PestRow & { usage: number }) => ({
  id: r.id,
  name: r.name,
  scientificName: r.scientific_name,
  crop: r.crop,
  severity: r.severity,
  description: r.description,
  recommendedAction: r.recommended_action,
  affectedAreaRange: [r.affected_area_min, r.affected_area_max],
  usage: r.usage,
});

const PEST_SELECT = 'SELECT p.*, (SELECT COUNT(*) FROM detections d WHERE d.pest_id = p.id) AS usage FROM pests p';

interface PestInput {
  name: string;
  scientificName: string;
  crop: string;
  severity: Severity;
  description: string;
  recommendedAction: string;
  min: number;
  max: number;
}

// Valida os campos recebidos; devolve o texto do erro ou o objeto limpo.
function parsePest(body: Record<string, unknown>, partial: boolean): string | Partial<PestInput> {
  const out: Partial<PestInput> = {};
  const text = (key: 'name' | 'scientificName' | 'description' | 'recommendedAction', label: string, max: number): string | null => {
    const value = body[key];
    if (value === undefined && partial) return null;
    if (typeof value !== 'string' || !value.trim()) return `${label} é obrigatório`;
    if (value.trim().length > max) return `${label} pode ter no máximo ${max} caracteres`;
    out[key] = value.trim();
    return null;
  };
  const errors = [
    text('name', 'O nome', 60),
    text('scientificName', 'O nome científico', 80),
    text('description', 'A descrição', 600),
    text('recommendedAction', 'A ação recomendada', 600),
  ].filter(Boolean);
  if (errors.length) return errors[0] as string;

  if (body.crop !== undefined || !partial) {
    if (typeof body.crop !== 'string' || !CROPS.includes(body.crop)) return `Cultura inválida (use ${CROPS.join(', ')})`;
    out.crop = body.crop;
  }
  if (body.severity !== undefined || !partial) {
    if (!SEVERITIES.includes(body.severity as Severity)) return 'Severidade inválida';
    out.severity = body.severity as Severity;
  }
  const range = body.affectedAreaRange;
  if (range !== undefined || !partial) {
    if (!Array.isArray(range) || range.length !== 2 || !range.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100)) {
      return 'A faixa de área afetada deve ter dois números entre 0 e 100';
    }
    if (range[0] > range[1]) return 'Na faixa de área afetada, o mínimo não pode ser maior que o máximo';
    out.min = range[0];
    out.max = range[1];
  }
  return out;
}

router.get('/pests', (_req, res) => {
  const rows = db.prepare(`${PEST_SELECT} ORDER BY p.name COLLATE NOCASE`).all() as (PestRow & { usage: number })[];
  res.json({ pests: rows.map(toPest) });
});

router.post('/pests', (req, res) => {
  const parsed = parsePest(req.body || {}, false);
  if (typeof parsed === 'string') {
    res.status(400).json({ error: parsed });
    return;
  }
  const p = parsed as PestInput;
  const id = slugify(p.name);
  if (!id) {
    res.status(400).json({ error: 'O nome precisa ter letras ou números' });
    return;
  }
  if (db.prepare('SELECT id FROM pests WHERE id = ?').get(id)) {
    res.status(409).json({ error: 'Já existe uma praga com esse nome' });
    return;
  }
  db.prepare(
    `INSERT INTO pests (id, name, scientific_name, crop, severity, description, recommended_action, affected_area_min, affected_area_max)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, p.name, p.scientificName, p.crop, p.severity, p.description, p.recommendedAction, p.min, p.max);
  logAudit(actor(req), 'pest.create', p.name);
  res.status(201).json({ pest: toPest(db.prepare(`${PEST_SELECT} WHERE p.id = ?`).get(id) as PestRow & { usage: number }) });
});

router.patch('/pests/:id', (req, res) => {
  const current = db.prepare('SELECT * FROM pests WHERE id = ?').get(req.params.id) as PestRow | undefined;
  if (!current) {
    res.status(404).json({ error: 'Praga não encontrada' });
    return;
  }
  const parsed = parsePest(req.body || {}, true);
  if (typeof parsed === 'string') {
    res.status(400).json({ error: parsed });
    return;
  }
  const p = parsed;
  db.prepare(
    `UPDATE pests SET name = ?, scientific_name = ?, crop = ?, severity = ?, description = ?, recommended_action = ?,
       affected_area_min = ?, affected_area_max = ? WHERE id = ?`
  ).run(
    p.name ?? current.name,
    p.scientificName ?? current.scientific_name,
    p.crop ?? current.crop,
    p.severity ?? current.severity,
    p.description ?? current.description,
    p.recommendedAction ?? current.recommended_action,
    p.min ?? current.affected_area_min,
    p.max ?? current.affected_area_max,
    current.id
  );
  logAudit(actor(req), 'pest.update', current.name);
  res.json({ pest: toPest(db.prepare(`${PEST_SELECT} WHERE p.id = ?`).get(current.id) as PestRow & { usage: number }) });
});

router.delete('/pests/:id', (req, res) => {
  const current = db.prepare('SELECT * FROM pests WHERE id = ?').get(req.params.id) as PestRow | undefined;
  if (!current) {
    res.status(404).json({ error: 'Praga não encontrada' });
    return;
  }
  const usage = count('SELECT COUNT(*) AS n FROM detections WHERE pest_id = ?', [current.id]);
  if (usage > 0) {
    res.status(409).json({ error: `Não dá para apagar: ${usage} detecção(ões) usam esta praga` });
    return;
  }
  db.prepare('DELETE FROM pests WHERE id = ?').run(current.id);
  logAudit(actor(req), 'pest.delete', current.name);
  res.json({ ok: true });
});

// ------------------------------------------------------------------ auditoria
router.get('/audit', (req, res) => {
  const requested = Number(req.query.limit);
  const limit = Number.isFinite(requested) ? Math.min(Math.max(Math.trunc(requested), 1), 200) : 100;
  const rows = db
    .prepare('SELECT id, actor_email, action, target, details, created_at FROM audit_log ORDER BY id DESC LIMIT ?')
    .all(limit) as { id: number; actor_email: string; action: string; target: string; details: string; created_at: number }[];
  res.json({
    entries: rows.map((r) => ({ id: r.id, actorEmail: r.actor_email, action: r.action, target: r.target, details: r.details, createdAt: r.created_at })),
  });
});

export default router;
