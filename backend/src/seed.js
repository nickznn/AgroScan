const db = require('./db');

const PESTS = [
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

function seedPests() {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO pests (id, name, scientific_name, crop, severity, description, recommended_action, affected_area_min, affected_area_max)
    VALUES (@id, @name, @scientificName, @crop, @severity, @description, @recommendedAction, @min, @max)
  `);
  const tx = db.transaction((pests) => {
    for (const p of pests) {
      insert.run({ ...p, min: p.affectedAreaRange[0], max: p.affectedAreaRange[1] });
    }
  });
  tx(PESTS);
}

// Popula dados de exemplo para um usuário recém-criado, pra demo não abrir vazia.
function seedForNewUser(userId) {
  const insertSector = db.prepare(`
    INSERT INTO sectors (id, user_id, name, crop, hectares, health_score, status) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const sectors = [
    ['sector-4', 'Setor 4', 'Soja', 300, 98, 'optimal'],
    ['sector-2', 'Setor 2', 'Milho', 450, 72, 'review'],
    ['sector-9', 'Setor 9', 'Soja', 200, 88, 'syncing'],
    ['sector-7', 'Setor 7', 'Milho', 250, 91, 'optimal'],
  ];
  for (const [id, name, crop, hectares, health, status] of sectors) {
    insertSector.run(`${id}-${userId}`, userId, name, crop, hectares, health, status);
  }

  const insertOrder = db.prepare(`
    INSERT INTO service_orders (id, user_id, code, product, sector, crop, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const orders = [
    [`os-104-${userId}`, 'OS-2026-104', 'Fungicida X-700', 'Setor 7', 'Milho', '24 Set 2026', 'in_progress'],
    [`os-105-${userId}`, 'OS-2026-105', 'Herbicida Alpha', 'Setor 3', 'Soja', '25 Set 2026', 'pending'],
    [`os-102-${userId}`, 'OS-2026-102', 'Inseticida Beta', 'Setor 1', 'Algodão', '23 Set 2026', 'completed'],
  ];
  for (const [id, code, product, sector, crop, date, status] of orders) {
    insertOrder.run(id, userId, code, product, sector, crop, date, status);
  }

  const insertDetection = db.prepare(`
    INSERT INTO detections (id, user_id, pest_id, confidence, sector, timestamp, photo_url, affected_area, stage, offline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = Date.now();
  const detections = [
    [`seed-1-${userId}`, 'lagarta-do-cartucho', 98.4, 'Setor Alpha-3', now - 1000 * 60 * 60 * 2, 15.4, 'L3-L4 (Desenvolvimento)', 0],
    [`seed-2-${userId}`, 'percevejo-marrom', 82, 'Setor Delta-1', now - 1000 * 60 * 60 * 26, 6.1, 'Ninfa (Inicial)', 0],
    [`seed-3-${userId}`, 'helicoverpa', 65, 'Setor Beta-2', now - 1000 * 60 * 60 * 50, 2.3, 'Presença isolada', 1],
  ];
  for (const [id, pestId, confidence, sector, timestamp, area, stage, offline] of detections) {
    insertDetection.run(id, userId, pestId, confidence, sector, timestamp, null, area, stage, offline);
  }
}

module.exports = { seedPests, seedForNewUser };
