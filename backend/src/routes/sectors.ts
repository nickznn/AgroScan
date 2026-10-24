import express from 'express';
import db from '../db';
import { requireAuth } from '../middleware/auth';
import { SectorRow } from '../types';

const router = express.Router();

function rowToSector(row: SectorRow) {
  return { id: row.id, name: row.name, crop: row.crop, hectares: row.hectares, healthScore: row.health_score, status: row.status };
}

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM sectors WHERE user_id = ? ORDER BY name').all(req.userId) as SectorRow[];
  res.json({ sectors: rows.map(rowToSector) });
});

export default router;
