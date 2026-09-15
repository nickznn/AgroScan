const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { seedForNewUser } = require('../seed');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function toPublicUser(row) {
  return { id: row.id, name: row.name, email: row.email, farmName: row.farm_name };
}

router.post('/register', async (req, res) => {
  const { name, email, password, farmName } = req.body || {};
  if (!email || !password || !password.trim()) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'Já existe uma conta com esse e-mail' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const info = db
    .prepare('INSERT INTO users (name, email, password_hash, farm_name, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(name || normalizedEmail.split('@')[0], normalizedEmail, passwordHash, farmName || 'Minha Fazenda', Date.now());

  seedForNewUser(info.lastInsertRowid);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, user: toPublicUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  if (!user) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos' });
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos' });
  }

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: toPublicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json({ user: toPublicUser(user) });
});

module.exports = router;
