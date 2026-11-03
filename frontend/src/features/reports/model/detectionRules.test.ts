import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { detection } from '../../../shared/models/fixtures';
import { filterDetections, severityLabel } from './detectionRules';

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

describe('severityLabel', () => {
  it('traduz a severidade', () => {
    assert.equal(severityLabel('critical'), 'ALTA');
    assert.equal(severityLabel('moderate'), 'MÉDIA');
    assert.equal(severityLabel('low'), 'BAIXA');
  });
});
