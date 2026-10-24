// Testes das regras do Model: rodam em milissegundos, sem celular, sem servidor e sem tela.
// Uso: npm test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DetectionResult, ServiceOrder, Sector, Severity } from './index';
import { positionFor } from './mapLayout';
import {
  averageHealth,
  canSubmitCredentials,
  countBySeverity,
  countOrdersByStatus,
  filterDetections,
  filterOrders,
  firstNameOf,
  severityLabel,
} from './rules';

const sector = (healthScore: number): Sector => ({
  id: String(healthScore), name: 'Setor', crop: 'Soja', hectares: 10, healthScore, status: 'optimal',
});

const detection = (id: string, name: string, severity: Severity, sectorName = 'Setor 1'): DetectionResult => ({
  id,
  pest: {
    id, name, scientificName: name, crop: 'Soja', severity, description: '', recommendedAction: '', affectedAreaRange: [1, 2],
  },
  confidence: 90, sector: sectorName, timestamp: 0, photoUri: null, affectedArea: 1, stage: 'Inicial', offline: false,
});

const order = (id: string, status: ServiceOrder['status']): ServiceOrder => ({
  id, code: id, product: 'Produto', sector: 'Setor 1', crop: 'Soja', date: '01 Jan 2026', status,
});

describe('averageHealth', () => {
  it('faz a média arredondada dos setores', () => {
    assert.equal(averageHealth([sector(98), sector(72), sector(88), sector(91)]), 87);
  });
  it('devolve 0 sem setores', () => {
    assert.equal(averageHealth([]), 0);
  });
});

describe('filterDetections', () => {
  const history = [
    detection('1', 'Ferrugem Asiática', 'critical', 'Setor Alpha'),
    detection('2', 'Pulgão', 'moderate', 'Setor Beta'),
    detection('3', 'Helicoverpa', 'low', 'Setor Beta'),
  ];
  it('sem busca e sem filtro devolve tudo', () => {
    assert.equal(filterDetections(history, '', []).length, 3);
  });
  it('busca por nome da praga ignorando maiúsculas', () => {
    assert.deepEqual(filterDetections(history, 'pulg', []).map((d) => d.id), ['2']);
  });
  it('busca também pelo nome do setor', () => {
    assert.deepEqual(filterDetections(history, 'beta', []).map((d) => d.id), ['2', '3']);
  });
  it('filtra por severidade', () => {
    assert.deepEqual(filterDetections(history, '', ['critical', 'low']).map((d) => d.id), ['1', '3']);
  });
  it('combina busca e severidade', () => {
    assert.deepEqual(filterDetections(history, 'beta', ['low']).map((d) => d.id), ['3']);
  });
});

describe('ordens de serviço', () => {
  const orders = [order('a', 'pending'), order('b', 'in_progress'), order('c', 'in_progress'), order('d', 'completed')];
  it('conta por status', () => {
    assert.deepEqual(countOrdersByStatus(orders), { pending: 1, in_progress: 2, completed: 1 });
  });
  it('filtra por status e "all" mostra todas', () => {
    assert.equal(filterOrders(orders, 'in_progress').length, 2);
    assert.equal(filterOrders(orders, 'all').length, 4);
  });
});

describe('textos e validações', () => {
  it('severidade em português', () => {
    assert.equal(severityLabel('critical'), 'ALTA');
    assert.equal(severityLabel('moderate'), 'MÉDIA');
    assert.equal(severityLabel('low'), 'BAIXA');
  });
  it('primeiro nome', () => {
    assert.equal(firstNameOf('Maria da Silva'), 'Maria');
    assert.equal(firstNameOf('joao.souza'), 'joao');
    assert.equal(firstNameOf(''), 'Produtor');
    assert.equal(firstNameOf(undefined), 'Produtor');
  });
  it('credenciais: e-mail com mais de 3 letras e senha com 4 ou mais', () => {
    assert.equal(canSubmitCredentials('a@b.c', 'abcd'), true);
    assert.equal(canSubmitCredentials('a@b', 'abcd'), false);
    assert.equal(canSubmitCredentials('a@b.c', 'abc'), false);
    assert.equal(canSubmitCredentials('  a@b  ', '    '), false);
  });
});

describe('mapa', () => {
  it('conta focos por severidade', () => {
    const list = [detection('1', 'A', 'critical'), detection('2', 'B', 'critical'), detection('3', 'C', 'low')];
    assert.deepEqual(countBySeverity(list), { critical: 2, moderate: 0, low: 1 });
  });
  it('a posição de um foco é sempre a mesma e fica dentro da área do mapa', () => {
    const d = detection('seed-1-9', 'A', 'low');
    assert.deepEqual(positionFor(d), positionFor(d));
    const { x, y } = positionFor(d);
    assert.ok(x >= 0.12 && x <= 0.88 && y >= 0.12 && y <= 0.88);
  });
  it('ids parecidos caem em pontos diferentes', () => {
    const a = positionFor(detection('seed-1', 'A', 'low'));
    const b = positionFor(detection('seed-2', 'A', 'low'));
    assert.notDeepEqual(a, b);
  });
});
