import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { detection } from '../../../shared/models/fixtures';
import { formatCoords } from '../../../shared/utils/format';
import { DEFAULT_REGION, heatRadiusMeters, projectToUnit, regionFor, toGeoPoints } from './geo';

const at = (id: string, latitude: number | null, longitude: number | null) => ({ ...detection(id, 'A', 'low'), latitude, longitude });

describe('toGeoPoints', () => {
  it('ignora os focos sem localização', () => {
    const points = toGeoPoints([at('a', -17.8, -50.9), at('b', null, null)]);
    assert.equal(points.length, 1);
    assert.equal(points[0].item.id, 'a');
  });
});

describe('regionFor', () => {
  it('sem focos, usa a região padrão', () => {
    assert.deepEqual(regionFor([]), DEFAULT_REGION);
  });
  it('com um foco só, centraliza nele e não aproxima demais', () => {
    const region = regionFor(toGeoPoints([at('a', -17.8, -50.9)]));
    assert.equal(region.latitude, -17.8);
    assert.equal(region.longitude, -50.9);
    assert.ok(region.latitudeDelta >= 0.006);
  });
  it('com vários focos, enquadra todos', () => {
    const points = toGeoPoints([at('a', -17.80, -50.90), at('b', -17.70, -50.80)]);
    const region = regionFor(points);
    for (const p of points) {
      assert.ok(Math.abs(p.latitude - region.latitude) <= region.latitudeDelta / 2);
      assert.ok(Math.abs(p.longitude - region.longitude) <= region.longitudeDelta / 2);
    }
  });
});

describe('heatRadiusMeters', () => {
  it('cresce com a área afetada', () => {
    const small = { ...at('a', 0, 0), affectedArea: 2 };
    const big = { ...at('b', 0, 0), affectedArea: 15 };
    assert.ok(heatRadiusMeters(big) > heatRadiusMeters(small));
  });
});

describe('projectToUnit', () => {
  const region = { latitude: -10, longitude: -50, latitudeDelta: 2, longitudeDelta: 4 };
  it('o centro da região cai no meio', () => {
    assert.deepEqual(projectToUnit({ latitude: -10, longitude: -50 }, region), { x: 0.5, y: 0.5 });
  });
  it('o norte fica em cima e o leste à direita', () => {
    const northEast = projectToUnit({ latitude: -9.5, longitude: -49 }, region);
    assert.ok(northEast.y < 0.5 && northEast.x > 0.5);
  });
});

describe('formatCoords', () => {
  it('escreve hemisfério e usa vírgula decimal', () => {
    assert.equal(formatCoords(-17.7921, -50.9213), '17,7921° S, 50,9213° O');
    assert.equal(formatCoords(10, 20), '10,0000° N, 20,0000° L');
  });
});
