import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { order } from '../../../shared/models/fixtures';
import { filterOrders } from './orderRules';

describe('filterOrders', () => {
  const orders = [order('a', 'pending'), order('b', 'in_progress'), order('c', 'in_progress'), order('d', 'completed')];
  it('filtra por status', () => {
    assert.equal(filterOrders(orders, 'in_progress').length, 2);
  });
  it('"all" mostra todas', () => {
    assert.equal(filterOrders(orders, 'all').length, 4);
  });
});
