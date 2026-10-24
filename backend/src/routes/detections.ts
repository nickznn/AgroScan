import express, { Request } from 'express';
import crypto from 'crypto';
import db from '../db';
import { requireAuth } from '../middleware/auth';
import { upload, absoluteUrl } from '../upload';
import { DetectionRow, PestRow, SectorRow } from '../types';

const router = express.Router();

function rowToDetection(req: Request, row: DetectionRow) {
  return {
    id: row.id,
    confidence: row.confidence,
    sector: row.sector,
    timestamp: row.timestamp,
    photoUri: absoluteUrl(req, row.photo_url),
    affectedArea: row.affected_area,
    stage: row.stage,
    offline: !!row.offline,
    pest: {
      id: row.pest_id,
      name: row.name,
      scientificName: row.scientific_name,
      crop: row.crop,
      severity: row.severity,
      description: row.description,
      recommendedAction: row.recommended_action,
      affectedAreaRange: [row.affected_area_min, row.affected_area_max],
    },
  };
}

const SELECT_JOIN = `
  SELECT d.*, p.name, p.scientific_name, p.crop, p.severity, p.description, p.recommended_action,
         p.affected_area_min, p.affected_area_max
  FROM detections d
  JOIN pests p ON p.id = d.pest_id
`;

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(`${SELECT_JOIN} WHERE d.user_id = ? ORDER BY d.timestamp DESC`).all(req.userId) as DetectionRow[];
  res.json({ detections: rows.map((r) => rowToDetection(req, r)) });
});

// A "análise de IA" é simulada no servidor: sorteia uma praga do catálogo e gera métricas plausíveis.
router.post('/', requireAuth, upload.single('photo'), (req, res) => {
  const pests = db.prepare('SELECT * FROM pests').all() as PestRow[];
  const pest = pests[Math.floor(Math.random() * pests.length)];
  const sectors = db.prepare('SELECT * FROM sectors WHERE user_id = ?').all(req.userId) as SectorRow[];
  const sector = sectors.length ? sectors[Math.floor(Math.random() * sectors.length)] : null;

  const confidence = 60 + Math.random() * 39;
  const affectedArea = pest.affected_area_min + Math.random() * (pest.affected_area_max - pest.affected_area_min);
  const stage =
    pest.severity === 'critical' ? 'L3-L4 (Desenvolvimento)' : pest.severity === 'moderate' ? 'Estágio inicial' : 'Presença isolada';
  const offline = Math.random() > 0.5;
  const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const id = `scan-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const timestamp = Date.now();

  db.prepare(
    `INSERT INTO detections (id, user_id, pest_id, confidence, sector, timestamp, photo_url, affected_area, stage, offline)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.userId, pest.id, confidence, sector ? sector.name : 'Setor não identificado', timestamp, photoUrl, affectedArea, stage, offline ? 1 : 0);

  const row = db.prepare(`${SELECT_JOIN} WHERE d.id = ?`).get(id) as DetectionRow;
  res.status(201).json({ detection: rowToDetection(req, row) });
});

export default router;
