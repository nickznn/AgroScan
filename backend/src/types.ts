// Formato das linhas como vêm do SQLite (snake_case). As rotas convertem para o formato da API (camelCase).

export type Severity = 'critical' | 'moderate' | 'low';
export type OrderStatus = 'pending' | 'in_progress' | 'completed';

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  farm_name: string;
  created_at: number;
  avatar_url: string | null;
  farm_photo_url: string | null;
}

export interface PestRow {
  id: string;
  name: string;
  scientific_name: string;
  crop: string;
  severity: Severity;
  description: string;
  recommended_action: string;
  affected_area_min: number;
  affected_area_max: number;
}

export interface SectorRow {
  id: string;
  user_id: number;
  name: string;
  crop: string;
  hectares: number;
  health_score: number;
  status: string;
}

// Detecção já unida (JOIN) com a praga do catálogo.
export interface DetectionRow extends PestRow {
  user_id: number;
  pest_id: string;
  confidence: number;
  sector: string;
  timestamp: number;
  photo_url: string | null;
  affected_area: number;
  stage: string;
  offline: number;
}

export interface OrderRow {
  id: string;
  user_id: number;
  code: string;
  product: string;
  sector: string;
  crop: string;
  date: string;
  status: OrderStatus;
}
