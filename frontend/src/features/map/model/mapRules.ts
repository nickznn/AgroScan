import { DetectionResult, Severity } from '../../../shared/models';

// Quantos focos há de cada severidade (a legenda do mapa).
export function countBySeverity(items: DetectionResult[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { critical: 0, moderate: 0, low: 0 };
  for (const item of items) counts[item.pest.severity]++;
  return counts;
}
