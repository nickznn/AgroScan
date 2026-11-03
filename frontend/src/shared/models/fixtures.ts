// Dados de exemplo usados só nos testes das regras.
import { DetectionResult, Sector, ServiceOrder, Severity } from './index';

export const sector = (healthScore: number): Sector => ({
  id: String(healthScore), name: 'Setor', crop: 'Soja', hectares: 10, healthScore, status: 'optimal',
});

export const detection = (id: string, name: string, severity: Severity, sectorName = 'Setor 1'): DetectionResult => ({
  id,
  pest: {
    id, name, scientificName: name, crop: 'Soja', severity, description: '', recommendedAction: '', affectedAreaRange: [1, 2],
  },
  confidence: 90, sector: sectorName, timestamp: 0, photoUri: null, affectedArea: 1, stage: 'Inicial', offline: false,
});

export const order = (id: string, status: ServiceOrder['status']): ServiceOrder => ({
  id, code: id, product: 'Produto', sector: 'Setor 1', crop: 'Soja', date: '01 Jan 2026', status,
});
