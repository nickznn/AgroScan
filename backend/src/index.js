require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { seedPests } = require('./seed');
const authRoutes = require('./routes/auth');
const detectionRoutes = require('./routes/detections');
const orderRoutes = require('./routes/orders');
const sectorRoutes = require('./routes/sectors');

seedPests();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req, res) => res.json({ ok: true, service: 'agroscan-api' }));

app.use('/auth', authRoutes);
app.use('/detections', detectionRoutes);
app.use('/orders', orderRoutes);
app.use('/sectors', sectorRoutes);

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AgroScan API rodando em http://0.0.0.0:${PORT}`);
});
