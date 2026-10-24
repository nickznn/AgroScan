// npm run check:arch -> confere as regras do MVVM: quem pode importar quem dentro de src/.
//
//   View       (src/views, src/components)  só desenha: nunca importa services/ nem context/
//   ViewModel  (src/viewmodels)             guarda estado e lógica: nunca importa react-native, navegação nem views
//   Model      (src/models)                 dados e regras puras: não importa React, services, context, viewmodels nem views
import fs from 'fs';
import path from 'path';
import { c, fail, ok } from './lib';

const SRC = path.join(__dirname, '..', 'src');

interface Rule {
  layer: string;
  dirs: string[];
  forbidden: { test: RegExp; why: string }[];
}

const RULES: Rule[] = [
  {
    layer: 'View',
    dirs: ['views', 'components'],
    forbidden: [
      { test: /\/services(\/|$)/, why: 'a View não fala com a API nem com o aparelho: isso é do ViewModel' },
      { test: /\/context(\/|$)/, why: 'a View não lê o estado global direto: peça ao ViewModel' },
    ],
  },
  {
    layer: 'ViewModel',
    dirs: ['viewmodels'],
    forbidden: [
      { test: /^react-native($|\/)/, why: 'o ViewModel não conhece componentes de interface' },
      { test: /^@react-navigation\//, why: 'navegar é responsabilidade da View' },
      { test: /\/views(\/|$)|\/components(\/|$)|\/navigation(\/|$)/, why: 'o ViewModel não conhece a View' },
    ],
  },
  {
    layer: 'Model',
    dirs: ['models'],
    forbidden: [
      { test: /^react($|\/|-native)/, why: 'o Model é TypeScript puro, sem React' },
      { test: /\/(services|context|viewmodels|views|components|navigation)(\/|$)/, why: 'o Model não depende das outras camadas' },
    ],
  },
];

function filesIn(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return filesIn(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

function importsOf(file: string): string[] {
  const text = fs.readFileSync(file, 'utf8');
  const found: string[] = [];
  const re = /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g;
  for (const m of text.matchAll(re)) found.push(m[1] || m[2]);
  return found;
}

let violations = 0;
let checked = 0;
for (const rule of RULES) {
  for (const dir of rule.dirs) {
    for (const file of filesIn(path.join(SRC, dir))) {
      checked++;
      for (const spec of importsOf(file)) {
        for (const f of rule.forbidden) {
          if (f.test.test(spec)) {
            violations++;
            fail(`${path.relative(path.join(SRC, '..'), file)} (${rule.layer}) importa "${spec}": ${f.why}`);
          }
        }
      }
    }
  }
}

if (violations === 0) {
  ok(`Arquitetura MVVM respeitada (${checked} arquivos conferidos em views, components, viewmodels e models).`);
} else {
  console.log(c.red(`\n${violations} violação(ões) das regras do MVVM.`));
  process.exit(1);
}
