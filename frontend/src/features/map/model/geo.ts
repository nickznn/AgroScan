import { DetectionResult } from '../../../shared/models';

// Um foco que tem localização de verdade (veio do GPS do aparelho).
export interface GeoPoint {
  item: DetectionResult;
  latitude: number;
  longitude: number;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Rio Verde (GO): onde ficam os focos de exemplo. Só é usada quando não há nenhum foco com GPS.
export const DEFAULT_REGION: Region = { latitude: -17.7921, longitude: -50.9142, latitudeDelta: 0.04, longitudeDelta: 0.04 };

const MIN_DELTA = 0.006; // ~650 m: não aproxima demais quando há um foco só
const PADDING = 1.6;

export function toGeoPoints(items: DetectionResult[]): GeoPoint[] {
  const points: GeoPoint[] = [];
  for (const item of items) {
    if (item.latitude !== null && item.longitude !== null) {
      points.push({ item, latitude: item.latitude, longitude: item.longitude });
    }
  }
  return points;
}

// Enquadramento que mostra todos os focos, com uma folga nas bordas.
export function regionFor(points: GeoPoint[], fallback: Region = DEFAULT_REGION): Region {
  if (points.length === 0) return fallback;
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * PADDING, MIN_DELTA),
    longitudeDelta: Math.max((maxLng - minLng) * PADDING, MIN_DELTA),
  };
}

// Raio (em metros) da mancha de calor: quanto maior a área afetada, maior a mancha.
export function heatRadiusMeters(item: DetectionResult): number {
  return Math.round(60 + item.affectedArea * 8);
}

// Posição (0 a 1) do ponto dentro do enquadramento, com o norte para cima. Usada pelo mapa de apoio da web.
export function projectToUnit(point: Pick<GeoPoint, 'latitude' | 'longitude'>, region: Region): { x: number; y: number } {
  const x = (point.longitude - (region.longitude - region.longitudeDelta / 2)) / region.longitudeDelta;
  const y = (region.latitude + region.latitudeDelta / 2 - point.latitude) / region.latitudeDelta;
  return { x, y };
}
