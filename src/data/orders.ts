import { ServiceOrder } from '../types';

export const INITIAL_ORDERS: ServiceOrder[] = [
  { id: 'os-104', code: 'OS-2026-104', product: 'Fungicida X-700', sector: 'Setor 7', crop: 'Milho', date: '24 Set 2026', status: 'in_progress' },
  { id: 'os-105', code: 'OS-2026-105', product: 'Herbicida Alpha', sector: 'Setor 3', crop: 'Soja', date: '25 Set 2026', status: 'pending' },
  { id: 'os-102', code: 'OS-2026-102', product: 'Inseticida Beta', sector: 'Setor 1', crop: 'Algodão', date: '23 Set 2026', status: 'completed' },
];
