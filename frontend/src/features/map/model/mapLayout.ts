import { DetectionResult } from '../../../shared/models';

// Posição estável (não muda a cada render) derivada do id da detecção.
// Ids parecidos (ex: "seed-1" vs "seed-2") precisam cair em pontos bem diferentes do mapa,
// então o hash passa por um finalizador de avalanche (mistura bits) antes de gerar a posição.
export function hashToUnit(id: string, salt: number): number {
  let hash = salt;
  for (let i = 0; i < id.length; i++) {
    hash = Math.imul(hash ^ id.charCodeAt(i), 0x01000193) | 0;
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b) | 0;
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35) | 0;
  hash ^= hash >>> 16;
  return (hash >>> 0) / 0xffffffff;
}

// Posição relativa (0 a 1) do foco no mapa, com margem de 12% nas bordas.
export function positionFor(item: DetectionResult): { x: number; y: number } {
  const x = 0.12 + hashToUnit(item.id, 17) * 0.76;
  const y = 0.12 + hashToUnit(item.id, 91) * 0.76;
  return { x, y };
}
