// Formato dos dados das telas de administrador (o que a API devolve em /admin/*).
import { Crop, OrderStatus, Role, Severity } from './index';

export interface AdminOverview {
  users: { total: number; active: number; suspended: number; admins: number };
  detections: {
    total: number;
    bySeverity: Record<Severity, number>;
    last7Days: { date: string; label: string; count: number }[];
  };
  orders: Record<OrderStatus, number>;
  topPests: { id: string; name: string; severity: Severity; count: number }[];
  generatedAt: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  farmName: string;
  role: Role;
  active: boolean;
  createdAt: number;
  lastLoginAt: number | null;
  detectionCount: number;
  orderCount: number;
}

export interface AdminOrder {
  id: string;
  code: string;
  product: string;
  sector: string;
  crop: Crop;
  date: string;
  status: OrderStatus;
  userId: number;
  userEmail: string;
}

export interface AdminPest {
  id: string;
  name: string;
  scientificName: string;
  crop: Crop;
  severity: Severity;
  description: string;
  recommendedAction: string;
  affectedAreaRange: [number, number];
  /** Quantas detecções usam esta praga (não dá para apagar se for maior que zero). */
  usage: number;
}

export type PestInput = Omit<AdminPest, 'id' | 'usage'>;

export interface AuditEntry {
  id: number;
  actorEmail: string;
  action: string;
  target: string;
  details: string;
  createdAt: number;
}

export type UserFilter = 'all' | 'admin' | 'suspended';
