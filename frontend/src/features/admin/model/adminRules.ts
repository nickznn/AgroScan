// Regras do painel de administrador como funções puras (sem React, sem rede): fáceis de testar.
import { Crop, Role, Severity } from '../../../shared/models';
import { AdminPest, PestInput } from '../../../shared/models/admin';

export const CROPS: Crop[] = ['Soja', 'Milho', 'Algodão', 'Café'];

/** Parte de um total em porcentagem inteira (0 quando o total é zero). */
export function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

/** Altura relativa (0 a 1) de cada barra de um gráfico: a maior vira 1. */
export function barRatios(values: number[]): number[] {
  const max = Math.max(0, ...values);
  return values.map((v) => (max === 0 ? 0 : v / max));
}

/** O administrador não pode agir sobre a própria conta (o servidor também recusa). */
export function canActOnUser(actorId: number, target: { id: number }): boolean {
  return target.id !== actorId;
}

export function roleLabel(role: Role): string {
  return role === 'admin' ? 'Administrador' : 'Usuário';
}

export function severityText(severity: Severity): string {
  return severity === 'critical' ? 'Alta' : severity === 'moderate' ? 'Média' : 'Baixa';
}

/** "nunca entrou", "hoje", "ontem", "há 3 dias"... */
export function lastAccessLabel(timestamp: number | null, now = Date.now()): string {
  if (timestamp === null) return 'nunca entrou';
  const days = Math.floor((now - timestamp) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
}

// ------------------------------------------------------------------ auditoria
export interface ActionInfo {
  label: string;
  icon: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
}

const ACTIONS: Record<string, ActionInfo> = {
  'user.promote': { label: 'promoveu a administrador', icon: 'admin-panel-settings', tone: 'info' },
  'user.demote': { label: 'rebaixou para usuário', icon: 'person-remove', tone: 'warning' },
  'user.suspend': { label: 'suspendeu a conta de', icon: 'block', tone: 'warning' },
  'user.reactivate': { label: 'reativou a conta de', icon: 'check-circle', tone: 'success' },
  'user.delete': { label: 'excluiu o usuário', icon: 'delete', tone: 'danger' },
  'order.status': { label: 'mudou o status da ordem', icon: 'assignment', tone: 'info' },
  'order.delete': { label: 'apagou a ordem', icon: 'delete', tone: 'danger' },
  'pest.create': { label: 'cadastrou a praga', icon: 'bug-report', tone: 'success' },
  'pest.update': { label: 'editou a praga', icon: 'edit', tone: 'info' },
  'pest.delete': { label: 'apagou a praga', icon: 'delete', tone: 'danger' },
};

export function describeAction(action: string): ActionInfo {
  return ACTIONS[action] ?? { label: action, icon: 'history', tone: 'info' };
}

// ------------------------------------------------------------------ formulário de praga
export interface PestDraft {
  name: string;
  scientificName: string;
  crop: Crop;
  severity: Severity;
  description: string;
  recommendedAction: string;
  min: string;
  max: string;
}

export function emptyPestDraft(): PestDraft {
  return { name: '', scientificName: '', crop: 'Soja', severity: 'moderate', description: '', recommendedAction: '', min: '1', max: '5' };
}

export function draftFromPest(pest: AdminPest): PestDraft {
  return {
    name: pest.name,
    scientificName: pest.scientificName,
    crop: pest.crop,
    severity: pest.severity,
    description: pest.description,
    recommendedAction: pest.recommendedAction,
    min: String(pest.affectedAreaRange[0]),
    max: String(pest.affectedAreaRange[1]),
  };
}

export type DraftResult = { ok: true; input: PestInput } | { ok: false; error: string };

function parseNumber(text: string): number {
  return text.trim() === '' ? NaN : Number(text.trim().replace(',', '.'));
}

/** Confere o formulário antes de enviar (o servidor valida de novo). */
export function validatePestDraft(draft: PestDraft): DraftResult {
  const name = draft.name.trim();
  const scientificName = draft.scientificName.trim();
  const description = draft.description.trim();
  const recommendedAction = draft.recommendedAction.trim();
  if (!name) return { ok: false, error: 'Informe o nome da praga.' };
  if (name.length > 60) return { ok: false, error: 'O nome pode ter no máximo 60 caracteres.' };
  if (!scientificName) return { ok: false, error: 'Informe o nome científico.' };
  if (!description) return { ok: false, error: 'Informe a descrição.' };
  if (!recommendedAction) return { ok: false, error: 'Informe a ação recomendada.' };
  const min = parseNumber(draft.min);
  const max = parseNumber(draft.max);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max > 100) {
    return { ok: false, error: 'A faixa de área afetada deve ter dois números entre 0 e 100.' };
  }
  if (min > max) return { ok: false, error: 'Na faixa de área afetada, o mínimo não pode ser maior que o máximo.' };
  return { ok: true, input: { name, scientificName, crop: draft.crop, severity: draft.severity, description, recommendedAction, affectedAreaRange: [min, max] } };
}
