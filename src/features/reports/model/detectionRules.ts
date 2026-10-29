import { DetectionResult, Severity } from '../../../shared/models';

// Busca por nome da praga ou do setor + filtro por severidade (nenhum filtro ativo = todas).
export function filterDetections(history: DetectionResult[], query: string, severities: Severity[]): DetectionResult[] {
  const q = query.toLowerCase();
  return history.filter((item) => {
    const matchesQuery = !q || item.pest.name.toLowerCase().includes(q) || item.sector.toLowerCase().includes(q);
    const matchesSeverity = severities.length === 0 || severities.includes(item.pest.severity);
    return matchesQuery && matchesSeverity;
  });
}

export function severityLabel(severity: Severity): string {
  return severity === 'critical' ? 'ALTA' : severity === 'moderate' ? 'MÉDIA' : 'BAIXA';
}
