import { Sector } from '../types';

export const FARM = {
  name: 'Fazenda Bela Vista',
  location: 'Mato Grosso, BR',
  hectares: 1200,
  crops: ['Soja', 'Milho'] as const,
};

export const SECTORS: Sector[] = [
  { id: 'sector-4', name: 'Setor 4', crop: 'Soja', hectares: 300, healthScore: 98, status: 'optimal' },
  { id: 'sector-2', name: 'Setor 2', crop: 'Milho', hectares: 450, healthScore: 72, status: 'review' },
  { id: 'sector-9', name: 'Setor 9', crop: 'Soja', hectares: 200, healthScore: 88, status: 'syncing' },
  { id: 'sector-7', name: 'Setor 7', crop: 'Milho', hectares: 250, healthScore: 91, status: 'optimal' },
];
