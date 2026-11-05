import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';

import { seedPests } from './seed';
import { ensureDefaultAdmin } from './adminSetup';
import { rateLimit } from './middleware/rateLimit';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import detectionRoutes from './routes/detections';
import orderRoutes from './routes/orders';
import sectorRoutes from './routes/sectors';

seedPests();
ensureDefaultAdmin();

const app = express();
app.use(cors());
app.use(express.json());

// Modo apresentação (npm run demo): a API fica exposta por um túnel, então atrás de um proxy e com limite de tentativas.
if (process.env.AGROSCAN_PUBLIC === '1') {
  app.set('trust proxy', 1);
  app.use(['/auth/login', '/auth/register'], rateLimit(20, 60_000));
  app.use('/detections', rateLimit(30, 60_000, ['POST']));
}
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'agroscan-api' });
});

app.use('/auth', authRoutes);
app.use('/detections', detectionRoutes);
app.use('/orders', orderRoutes);
app.use('/sectors', sectorRoutes);
app.use('/admin', adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AgroScan API rodando em http://0.0.0.0:${PORT}`);
});
