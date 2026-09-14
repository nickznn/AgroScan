import { DetectionResult } from '../types';
import { PEST_CATALOG } from './pests';

const findPest = (id: string) => PEST_CATALOG.find((p) => p.id === id)!;

// Histórico inicial para a demo já abrir com dados (igual ao protótipo do Stitch).
export const SEED_HISTORY: DetectionResult[] = [
  {
    id: 'seed-1',
    pest: findPest('lagarta-do-cartucho'),
    confidence: 98.4,
    sector: 'Setor Alpha-3',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    photoUri: null,
    affectedArea: 15.4,
    stage: 'L3-L4 (Desenvolvimento)',
    offline: false,
  },
  {
    id: 'seed-2',
    pest: findPest('percevejo-marrom'),
    confidence: 82,
    sector: 'Setor Delta-1',
    timestamp: Date.now() - 1000 * 60 * 60 * 26,
    photoUri: null,
    affectedArea: 6.1,
    stage: 'Ninfa (Inicial)',
    offline: false,
  },
  {
    id: 'seed-3',
    pest: findPest('helicoverpa'),
    confidence: 65,
    sector: 'Setor Beta-2',
    timestamp: Date.now() - 1000 * 60 * 60 * 50,
    photoUri: null,
    affectedArea: 2.3,
    stage: 'Presença isolada',
    offline: true,
  },
];
