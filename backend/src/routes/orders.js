const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function rowToOrder(row) {
  return { id: row.id, code: row.code, product: row.product, sector: row.sector, crop: row.crop, date: row.date, status: row.status };
}

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM service_orders WHERE user_id = ? ORDER BY rowid DESC').all(req.userId);
  res.json({ orders: rows.map(rowToOrder) });
});

router.post('/', requireAuth, (req, res) => {
  const { product, sector, crop } = req.body || {};
  if (!product || !sector || !crop) {
    return res.status(400).json({ error: 'product, sector e crop são obrigatórios' });
  }
  const count = db.prepare('SELECT COUNT(*) as c FROM service_orders WHERE user_id = ?').get(req.userId).c;
  const id = `os-${Date.now()}`;
  const code = `OS-${new Date().getFullYear()}-${100 + count + 1}`;
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  db.prepare(
    'INSERT INTO service_orders (id, user_id, code, product, sector, crop, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.userId, code, product, sector, crop, date, 'pending');

  const row = db.prepare('SELECT * FROM service_orders WHERE id = ?').get(id);
  res.status(201).json({ order: rowToOrder(row) });
});

router.patch('/:id', requireAuth, (req, res) => {
  const { status } = req.body || {};
  if (!['pending', 'in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'status inválido' });
  }
  const row = db.prepare('SELECT * FROM service_orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!row) return res.status(404).json({ error: 'Ordem não encontrada' });

  db.prepare('UPDATE service_orders SET status = ? WHERE id = ?').run(status, req.params.id);
  const updated = db.prepare('SELECT * FROM service_orders WHERE id = ?').get(req.params.id);
  res.json({ order: rowToOrder(updated) });
});

module.exports = router;
