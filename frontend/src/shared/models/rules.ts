// Regras de negócio compartilhadas entre funcionalidades (funções puras, sem React nem rede).
import { OrderStatus, Sector, ServiceOrder } from './index';

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
