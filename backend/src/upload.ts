import { Request } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

// Transforma "/uploads/x.jpg" em "http://IP:4000/uploads/x.jpg" usando o host que o próprio celular usou.
export function absoluteUrl(req: Request, relativePath: string | null): string | null {
  if (!relativePath) return null;
  return `${req.protocol}://${req.get('host')}${relativePath}`;
}
