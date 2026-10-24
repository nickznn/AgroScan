// Regras de negócio do app como funções puras (sem React, sem rede): fáceis de testar e usadas pelos ViewModels.
import { DetectionResult, OrderStatus, Sector, ServiceOrder, Severity } from './index';

// Saúde geral da lavoura = média do health score dos setores (0 quando ainda não há setores).
export function averageHealth(sectors: Sector[]): number {
  if (sectors.length === 0) return 0;
  return Math.round(sectors.reduce((sum, s) => sum + s.healthScore, 0) / sectors.length);
}

export function countOrdersByStatus(orders: ServiceOrder[]): Record<OrderStatus, number> {
  const counts: Record<OrderStatus, number> = { pending: 0, in_progress: 0, completed: 0 };
  for (const order of orders) counts[order.status]++;
  return counts;
}

export function countBySeverity(items: DetectionResult[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { critical: 0, moderate: 0, low: 0 };
  for (const item of items) counts[item.pest.severity]++;
  return counts;
}

// Busca por nome da praga ou do setor + filtro por severidade (nenhum filtro ativo = todas).
export function filterDetections(history: DetectionResult[], query: string, severities: Severity[]): DetectionResult[] {
  const q = query.toLowerCase();
  return history.filter((item) => {
    const matchesQuery = !q || item.pest.name.toLowerCase().includes(q) || item.sector.toLowerCase().includes(q);
    const matchesSeverity = severities.length === 0 || severities.includes(item.pest.severity);
    return matchesQuery && matchesSeverity;
  });
}

export function filterOrders(orders: ServiceOrder[], status: OrderStatus | 'all'): ServiceOrder[] {
  return status === 'all' ? orders : orders.filter((o) => o.status === status);
}

export function severityLabel(severity: Severity): string {
  return severity === 'critical' ? 'ALTA' : severity === 'moderate' ? 'MÉDIA' : 'BAIXA';
}

// "Maria da Silva" -> "Maria"; "joao.souza" -> "joao"; sem nome -> "Produtor".
export function firstNameOf(name?: string | null): string {
  return name?.split(/[.\s]/)[0] || 'Produtor';
}

export function canSubmitCredentials(email: string, password: string): boolean {
  return email.trim().length > 3 && password.trim().length >= 4;
}
