export type Severity = 'critical' | 'moderate' | 'low';

export type Crop = 'Soja' | 'Milho' | 'Algodão' | 'Café';

export interface PestDefinition {
  id: string;
  name: string;
  scientificName: string;
  crop: Crop;
  severity: Severity;
  description: string;
  recommendedAction: string;
  affectedAreaRange: [number, number];
}

export interface DetectionResult {
  id: string;
  pest: PestDefinition;
  confidence: number;
  sector: string;
  timestamp: number;
  photoUri: string | null;
  affectedArea: number;
  stage: string;
  offline: boolean;
}

export interface Sector {
  id: string;
  name: string;
  crop: Crop;
  hectares: number;
  healthScore: number;
  status: 'optimal' | 'review' | 'syncing';
}

export type OrderStatus = 'pending' | 'in_progress' | 'completed';

export interface ServiceOrder {
  id: string;
  code: string;
  product: string;
  sector: string;
  crop: Crop;
  date: string;
  status: OrderStatus;
}

export interface User {
  name: string;
  email: string;
  farmName: string;
}
