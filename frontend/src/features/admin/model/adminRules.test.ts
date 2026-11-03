import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { barRatios, canActOnUser, describeAction, draftFromPest, emptyPestDraft, lastAccessLabel, percent, validatePestDraft } from './adminRules';

describe('percent e barRatios (gráficos do painel)', () => {
  it('porcentagem inteira e zero quando o total é zero', () => {
    assert.equal(percent(1, 3), 33);
    assert.equal(percent(2, 3), 67);
    assert.equal(percent(5, 0), 0);
  });
  it('a maior barra vale 1 e as outras são proporcionais', () => {
    assert.deepEqual(barRatios([2, 4, 1]), [0.5, 1, 0.25]);
  });
  it('sem nenhum valor as barras ficam vazias, sem dividir por zero', () => {
    assert.deepEqual(barRatios([0, 0, 0]), [0, 0, 0]);
    assert.deepEqual(barRatios([]), []);
  });
});

describe('ações sobre usuários', () => {
  it('o admin não age sobre a própria conta', () => {
    assert.equal(canActOnUser(1, { id: 1 }), false);
    assert.equal(canActOnUser(1, { id: 2 }), true);
  });
  it('último acesso em linguagem simples', () => {
    const day = 24 * 60 * 60 * 1000;
    const now = 10 * day;
    assert.equal(lastAccessLabel(null, now), 'nunca entrou');
    assert.equal(lastAccessLabel(now - 1000, now), 'hoje');
    assert.equal(lastAccessLabel(now - day, now), 'ontem');
    assert.equal(lastAccessLabel(now - 4 * day, now), 'há 4 dias');
  });
});

describe('descrição das ações da auditoria', () => {
  it('traduz as ações conhecidas', () => {
    assert.equal(describeAction('user.suspend').label, 'suspendeu a conta de');
    assert.equal(describeAction('pest.delete').tone, 'danger');
  });
  it('uma ação desconhecida aparece como veio, sem quebrar', () => {
    const info = describeAction('algo.novo');
    assert.equal(info.label, 'algo.novo');
    assert.equal(info.tone, 'info');
  });
});

describe('formulário de praga', () => {
  const valid = {
    ...emptyPestDraft(),
    name: '  Lagarta Falsa Medideira ',
    scientificName: 'Chrysodeixis includens',
    description: 'Lagarta que consome folhas.',
    recommendedAction: 'Monitorar.',
    min: '2',
    max: '8,5',
  };

  it('aceita um formulário completo, limpa espaços e aceita vírgula decimal', () => {
    const result = validatePestDraft(valid);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.input.name, 'Lagarta Falsa Medideira');
      assert.deepEqual(result.input.affectedAreaRange, [2, 8.5]);
    }
  });
  it('recusa campos obrigatórios vazios', () => {
    for (const field of ['name', 'scientificName', 'description', 'recommendedAction'] as const) {
      const result = validatePestDraft({ ...valid, [field]: '   ' });
      assert.equal(result.ok, false, field);
    }
  });
  it('recusa faixa invertida, fora de 0 a 100 ou não numérica', () => {
    assert.equal(validatePestDraft({ ...valid, min: '9', max: '3' }).ok, false);
    assert.equal(validatePestDraft({ ...valid, max: '101' }).ok, false);
    assert.equal(validatePestDraft({ ...valid, min: '-1' }).ok, false);
    assert.equal(validatePestDraft({ ...valid, min: 'abc' }).ok, false);
    assert.equal(validatePestDraft({ ...valid, max: '' }).ok, false);
  });
  it('editar: o formulário volta com os dados da praga e passa na validação', () => {
    const draft = draftFromPest({
      id: 'x', name: 'Pulgão', scientificName: 'Aphis gossypii', crop: 'Milho', severity: 'moderate',
      description: 'd', recommendedAction: 'a', affectedAreaRange: [4, 12], usage: 3,
    });
    assert.equal(draft.min, '4');
    assert.equal(validatePestDraft(draft).ok, true);
  });
});
