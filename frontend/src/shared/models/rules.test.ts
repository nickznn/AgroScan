import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { order, sector } from './fixtures';
import { averageHealth, countOrdersByStatus } from './rules';

describe('averageHealth', () => {
  it('faz a média arredondada dos setores', () => {
    assert.equal(averageHealth([sector(98), sector(72), sector(88), sector(91)]), 87);
  });
  it('devolve 0 sem setores', () => {
    assert.equal(averageHealth([]), 0);
  });
});

describe('countOrdersByStatus', () => {
  it('conta as ordens por status', () => {
    const orders = [order('a', 'pending'), order('b', 'in_progress'), order('c', 'in_progress'), order('d', 'completed')];
    assert.deepEqual(countOrdersByStatus(orders), { pending: 1, in_progress: 2, completed: 1 });
  });
});
