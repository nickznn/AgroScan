import express from 'express';
import db from '../db';
import { requireAuth } from '../middleware/auth';
import { OrderRow, OrderStatus } from '../types';

const router = express.Router();

const STATUSES: OrderStatus[] = ['pending', 'in_progress', 'completed'];

function rowToOrder(row: OrderRow) {
  return { id: row.id, code: row.code, product: row.product, sector: row.sector, crop: row.crop, date: row.date, status: row.status };
}

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM service_orders WHERE user_id = ? ORDER BY rowid DESC').all(req.userId) as OrderRow[];
  res.json({ orders: rows.map(rowToOrder) });
});

router.post('/', requireAuth, (req, res) => {
  const { product, sector, crop } = req.body || {};
  if (!product || !sector || !crop) {
    res.status(400).json({ error: 'product, sector e crop são obrigatórios' });
    return;
  }
  // O código é só para exibição, mas tem que ser único por usuário: usa o maior número existente + 1.
  // (Contar as linhas colidia com os códigos de exemplo 102/104/105 criados no cadastro.)
  const last = (
    db
      .prepare('SELECT MAX(CAST(substr(code, 9) AS INTEGER)) AS n FROM service_orders WHERE user_id = ?')
      .get(req.userId) as { n: number | null }
  ).n;
  const id = `os-${Date.now()}`;
  const code = `OS-${new Date().getFullYear()}-${(last ?? 100) + 1}`;
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  db.prepare(
    'INSERT INTO service_orders (id, user_id, code, product, sector, crop, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.userId, code, product, sector, crop, date, 'pending');

  const row = db.prepare('SELECT * FROM service_orders WHERE id = ?').get(id) as OrderRow;
  res.status(201).json({ order: rowToOrder(row) });
});

router.patch('/:id', requireAuth, (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) {
    res.status(400).json({ error: 'status inválido' });
    return;
  }
  const row = db.prepare('SELECT * FROM service_orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as
    | OrderRow
    | undefined;
  if (!row) {
    res.status(404).json({ error: 'Ordem não encontrada' });
    return;
  }

  db.prepare('UPDATE service_orders SET status = ? WHERE id = ?').run(status, req.params.id);
  const updated = db.prepare('SELECT * FROM service_orders WHERE id = ?').get(req.params.id) as OrderRow;
  res.json({ order: rowToOrder(updated) });
});

export default router;
