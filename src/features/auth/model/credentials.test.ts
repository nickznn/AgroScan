import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canSubmitCredentials } from './credentials';

describe('canSubmitCredentials', () => {
  it('aceita e-mail com mais de 3 letras e senha com 4 ou mais', () => {
    assert.equal(canSubmitCredentials('a@b.c', 'abcd'), true);
  });
  it('recusa e-mail curto, senha curta e campos só com espaços', () => {
    assert.equal(canSubmitCredentials('a@b', 'abcd'), false);
    assert.equal(canSubmitCredentials('a@b.c', 'abc'), false);
    assert.equal(canSubmitCredentials('  a@b  ', '    '), false);
  });
});
