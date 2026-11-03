import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { detection } from '../../../shared/models/fixtures';
import { positionFor } from './mapLayout';
import { countBySeverity } from './mapRules';

describe('positionFor', () => {
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

describe('countBySeverity', () => {
  it('conta focos por severidade', () => {
    const list = [detection('1', 'A', 'critical'), detection('2', 'B', 'critical'), detection('3', 'C', 'low')];
    assert.deepEqual(countBySeverity(list), { critical: 2, moderate: 0, low: 1 });
  });
});
