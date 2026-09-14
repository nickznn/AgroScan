import { PestDefinition } from '../types';

// Catálogo de pragas/doenças usado pela "IA" simulada do scanner.
export const PEST_CATALOG: PestDefinition[] = [
  {
    id: 'ferrugem-asiatica',
    name: 'Ferrugem Asiática',
    scientificName: 'Phakopsora pachyrhizi',
    crop: 'Soja',
    severity: 'critical',
    description:
      'Doença fúngica que causa pústulas nas folhas, levando à desfolha precoce e redução severa de produtividade se não tratada rapidamente.',
    recommendedAction:
      'Aplicação localizada de fungicida sistêmico recomendada imediatamente para o raio de 50m ao redor do ponto de detecção.',
    affectedAreaRange: [12, 25],
  },
  {
    id: 'lagarta-do-cartucho',
    name: 'Lagarta-do-cartucho',
    scientificName: 'Spodoptera frugiperda',
    crop: 'Milho',
    severity: 'critical',
    description:
      'Lagarta identificada com padrão de dano foliar severo e risco iminente de propagação rápida se não tratada.',
    recommendedAction:
      'Aplicação localizada de defensivo biológico ou químico específico recomendada imediatamente para o raio de 50m ao redor do ponto de detecção.',
    affectedAreaRange: [10, 20],
  },
  {
    id: 'pulgao',
    name: 'Pulgão',
    scientificName: 'Aphis gossypii',
    crop: 'Milho',
    severity: 'moderate',
    description:
      'Colônia de pulgões detectada na face inferior das folhas. Pode transmitir viroses se a população crescer sem controle.',
    recommendedAction: 'Monitorar evolução por 3-5 dias. Considerar controle biológico com joaninhas antes de aplicação química.',
    affectedAreaRange: [4, 12],
  },
  {
    id: 'percevejo-marrom',
    name: 'Percevejo-marrom',
    scientificName: 'Euschistus heros',
    crop: 'Soja',
    severity: 'moderate',
    description: 'Ninfas observadas em estágio inicial. Percevejo em fase de colonização, ainda abaixo do limiar de dano econômico.',
    recommendedAction: 'Repetir amostragem em 48h. Se a densidade aumentar, iniciar aplicação de inseticida específico.',
    affectedAreaRange: [3, 9],
  },
  {
    id: 'mancha-alvo',
    name: 'Mancha Alvo',
    scientificName: 'Corynespora cassiicola',
    crop: 'Algodão',
    severity: 'low',
    description: 'Presença isolada de lesões foliares circulares. Abaixo do limiar de dano econômico, sem risco imediato à lavoura.',
    recommendedAction: 'Nenhuma ação imediata necessária. Continuar monitoramento de rotina nas próximas verificações.',
    affectedAreaRange: [1, 5],
  },
  {
    id: 'helicoverpa',
    name: 'Helicoverpa',
    scientificName: 'Helicoverpa armigera',
    crop: 'Algodão',
    severity: 'low',
    description: 'Presença isolada de lagartas. Abaixo do limiar de dano econômico, monitoramento recomendado.',
    recommendedAction: 'Continuar monitoramento semanal. Instalar armadilhas de feromônio no setor para acompanhar a evolução.',
    affectedAreaRange: [1, 6],
  },
];

export function pickRandomPest(): PestDefinition {
  return PEST_CATALOG[Math.floor(Math.random() * PEST_CATALOG.length)];
}
