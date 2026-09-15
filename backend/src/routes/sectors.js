const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function rowToSector(row) {
  return { id: row.id, name: row.name, crop: row.crop, hectares: row.hectares, healthScore: row.health_score, status: row.status };
}

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM sectors WHERE user_id = ? ORDER BY name').all(req.userId);
  res.json({ sectors: rows.map(rowToSector) });
});

module.exports = router;
