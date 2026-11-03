import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db';
import { Role } from '../types';

export const JWT_SECRET = process.env.JWT_SECRET || 'agroscan-dev-secret-change-me';

export const SUSPENDED_MESSAGE = 'Conta suspensa. Fale com o administrador.';

// Porteiro das rotas privadas: valida o token e coloca o id e o papel do usuário em req.userId e req.userRole.
// Confere o usuário no banco a cada requisição: assim, uma conta suspensa ou apagada perde o acesso na hora,
// sem esperar o token vencer, e uma mudança de papel vale imediatamente.
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Token ausente' });
    return;
  }
  let userId: number;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    userId = Number(payload.sub);
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
    return;
  }
  const row = db.prepare('SELECT id, role, active FROM users WHERE id = ?').get(userId) as
    | { id: number; role: Role; active: number }
    | undefined;
  if (!row) {
    res.status(401).json({ error: 'Usuário não encontrado' });
    return;
  }
  if (!row.active) {
    res.status(403).json({ error: SUSPENDED_MESSAGE });
    return;
  }
  req.userId = row.id;
  req.userRole = row.role;
  next();
}

// Rotas exclusivas do administrador: precisa estar logado E ter o papel "admin".
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.userRole !== 'admin') {
      res.status(403).json({ error: 'Acesso restrito a administradores' });
      return;
    }
    next();
  });
}
