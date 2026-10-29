// npm run check:arch -> confere as regras do MVVM por funcionalidade: quem pode importar quem dentro de src/.
//
//   src/features/<funcionalidade>/view       View       só desenha: nunca importa services nem o estado global
//   src/features/<funcionalidade>/viewmodel  ViewModel  estado e lógica: nunca importa react-native, navegação nem views
//   src/features/<funcionalidade>/model      Model      dados e regras puras: não importa React nem as outras camadas
//   src/shared/components (View) e src/shared/models (Model) seguem as mesmas regras.
//   Uma funcionalidade nunca importa outra: o que é comum vai para src/shared.
import fs from 'fs';
import path from 'path';
import { c, fail, ok } from './lib';

const SRC = path.join(__dirname, '..', 'src');

type Layer = 'View' | 'ViewModel' | 'Model';

interface FileInfo {
  layer: Layer;
  feature: string | null; // null = shared
}

// Descobre a camada de um arquivo (caminho relativo a src, com "/").
function classify(relPath: string): FileInfo | null {
  let m = relPath.match(/^features\/([^/]+)\/(view|viewmodel|model)\//);
  if (m) return { layer: m[2] === 'view' ? 'View' : m[2] === 'viewmodel' ? 'ViewModel' : 'Model', feature: m[1] };
  if (relPath.startsWith('shared/components/')) return { layer: 'View', feature: null };
  if (relPath.startsWith('shared/models/')) return { layer: 'Model', feature: null };
  return null;
}

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

function check(layer: Layer, spec: string, target: string | null): string | null {
  const isPackage = !spec.startsWith('.');
  if (isPackage) {
    if (layer === 'ViewModel' && (/^react-native($|\/)/.test(spec) || /^@react-navigation\//.test(spec))) {
      return 'o ViewModel não conhece componentes de interface nem navegação';
    }
    if (layer === 'Model' && /^react($|\/|-native)/.test(spec)) return 'o Model é TypeScript puro, sem React';
    return null;
  }
  if (!target) return null;
  const inView = /(^|\/)view\//.test(target) || target.startsWith('shared/components');
  const inViewModel = /(^|\/)viewmodel\//.test(target);
  const infra = target.startsWith('shared/services') || target.startsWith('shared/state');
  const nav = target.startsWith('navigation');
  if (layer === 'View' && infra) return 'a View não fala com a API nem com o estado global: peça ao ViewModel';
  if (layer === 'ViewModel' && (inView || nav)) return 'o ViewModel não conhece a View nem a navegação';
  if (layer === 'Model' && (inView || inViewModel || infra || nav)) return 'o Model não depende das outras camadas';
  return null;
}

let violations = 0;
let checked = 0;
const features = new Set<string>();

for (const file of filesIn(SRC)) {
  const relPath = path.relative(SRC, file).split(path.sep).join('/');
  const info = classify(relPath);
  if (!info) continue;
  checked++;
  if (info.feature) features.add(info.feature);

  for (const spec of importsOf(file)) {
    const target = spec.startsWith('.') ? path.relative(SRC, path.resolve(path.dirname(file), spec)).split(path.sep).join('/') : null;
    let why = check(info.layer, spec, target);

    // Uma funcionalidade não importa outra (compartilhar = mover para shared).
    if (!why && target && info.feature) {
      const other = target.match(/^features\/([^/]+)\//);
      if (other && other[1] !== info.feature) why = `a funcionalidade "${info.feature}" não deve importar a funcionalidade "${other[1]}"; o que é comum vai para src/shared`;
    }

    if (why) {
      violations++;
      fail(`src/${relPath} (${info.layer}) importa "${spec}": ${why}`);
    }
  }
}

if (violations === 0) {
  ok(`Arquitetura MVVM por funcionalidade respeitada (${checked} arquivos em ${features.size} funcionalidades).`);
} else {
  console.log(c.red(`\n${violations} violação(ões) das regras do MVVM.`));
  process.exit(1);
}
