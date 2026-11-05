import { NextFunction, Request, Response } from 'express';

interface Window {
  count: number;
  resetAt: number;
}

/**
 * Limite simples de requisições por endereço, guardado em memória.
 * Só é ligado quando a API fica aberta para a internet (AGROSCAN_PUBLIC=1, veja index.ts):
 * segura tentativas de adivinhar senha e o envio em massa de fotos.
 * `methods` restringe o limite a certos métodos HTTP (os demais passam direto).
 */
export function rateLimit(max: number, windowMs: number, methods?: string[]) {
  const windows = new Map<string, Window>();
  return (req: Request, res: Response, next: NextFunction) => {
    if (methods && !methods.includes(req.method)) return next();
    const now = Date.now();
    if (windows.size > 2000) {
      for (const [key, w] of windows) if (w.resetAt <= now) windows.delete(key);
    }
    const key = req.ip ?? 'desconhecido';
    const current = windows.get(key);
    if (!current || current.resetAt <= now) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    current.count++;
    if (current.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
      res.status(429).json({ error: 'Muitas tentativas em pouco tempo. Aguarde um minuto e tente de novo.' });
      return;
    }
    next();
  };
}
