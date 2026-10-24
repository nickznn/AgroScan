import express, { Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import { seedForNewUser } from '../seed';
import { requireAuth, JWT_SECRET } from '../middleware/auth';
import { upload, absoluteUrl } from '../upload';
import { UserRow } from '../types';

const router = express.Router();

function toPublicUser(req: Request, row: UserRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    farmName: row.farm_name,
    createdAt: row.created_at,
    avatarUrl: absoluteUrl(req, row.avatar_url),
    farmPhotoUrl: absoluteUrl(req, row.farm_photo_url),
  };
}

function findUserById(id: number): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

function signToken(userId: number): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' });
}

router.post('/register', async (req, res) => {
  const { name, email, password, farmName } = req.body || {};
  if (!email || !password || !password.trim()) {
    res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    return;
  }
  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    res.status(409).json({ error: 'Já existe uma conta com esse e-mail' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const info = db
    .prepare('INSERT INTO users (name, email, password_hash, farm_name, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(name || normalizedEmail.split('@')[0], normalizedEmail, passwordHash, farmName || 'Minha Fazenda', Date.now());
  const userId = Number(info.lastInsertRowid);

  seedForNewUser(userId);

  const user = findUserById(userId) as UserRow;
  res.status(201).json({ token: signToken(user.id), user: toPublicUser(req, user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    return;
  }
  const normalizedEmail = String(email).trim().toLowerCase();

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as UserRow | undefined;
  // Mesma mensagem para "e-mail não existe" e "senha errada": não revela quais e-mails estão cadastrados.
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ error: 'E-mail ou senha incorretos' });
    return;
  }

  res.json({ token: signToken(user.id), user: toPublicUser(req, user) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = findUserById(req.userId);
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  res.json({ user: toPublicUser(req, user) });
});

router.patch('/me', requireAuth, (req, res) => {
  const { name, farmName } = req.body || {};
  const current = findUserById(req.userId);
  if (!current) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }

  db.prepare('UPDATE users SET name = ?, farm_name = ? WHERE id = ?').run(
    name?.trim() || current.name,
    farmName?.trim() || current.farm_name,
    req.userId
  );

  res.json({ user: toPublicUser(req, findUserById(req.userId) as UserRow) });
});

router.post('/me/avatar', requireAuth, upload.single('photo'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Nenhuma foto enviada' });
    return;
  }

  db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(`/uploads/${req.file.filename}`, req.userId);

  res.json({ user: toPublicUser(req, findUserById(req.userId) as UserRow) });
});

router.post('/me/farm-photo', requireAuth, upload.single('photo'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Nenhuma foto enviada' });
    return;
  }

  db.prepare('UPDATE users SET farm_photo_url = ? WHERE id = ?').run(`/uploads/${req.file.filename}`, req.userId);

  res.json({ user: toPublicUser(req, findUserById(req.userId) as UserRow) });
});

export default router;
