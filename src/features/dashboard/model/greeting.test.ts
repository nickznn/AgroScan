import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { firstNameOf } from './greeting';

describe('firstNameOf', () => {
  it('pega o primeiro nome', () => {
    assert.equal(firstNameOf('Maria da Silva'), 'Maria');
    assert.equal(firstNameOf('joao.souza'), 'joao');
  });
  it('usa "Produtor" quando não há nome', () => {
    assert.equal(firstNameOf(''), 'Produtor');
    assert.equal(firstNameOf(undefined), 'Produtor');
  });
});
