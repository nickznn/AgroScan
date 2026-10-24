import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'agroscan-dev-secret-change-me';

// Porteiro das rotas privadas: valida o token e coloca o id do usuário em req.userId.
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Token ausente' });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    req.userId = Number(payload.sub);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}
