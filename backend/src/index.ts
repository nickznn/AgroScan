import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';

import { seedPests } from './seed';
import authRoutes from './routes/auth';
import detectionRoutes from './routes/detections';
import orderRoutes from './routes/orders';
import sectorRoutes from './routes/sectors';

seedPests();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'agroscan-api' });
});

app.use('/auth', authRoutes);
app.use('/detections', detectionRoutes);
app.use('/orders', orderRoutes);
app.use('/sectors', sectorRoutes);

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
