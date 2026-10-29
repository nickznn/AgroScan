// npm test -> roda todos os arquivos *.test.ts de src/ (as regras de negócio de cada funcionalidade).
// Lista os arquivos aqui porque o Node 20 não entende "*" no comando de testes.
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const SRC = path.join(__dirname, '..', 'src');

function testFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return testFiles(full);
    return entry.name.endsWith('.test.ts') ? [full] : [];
  });
}

const files = testFiles(SRC);
if (files.length === 0) {
  console.log('Nenhum teste encontrado em src/.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...files], { stdio: 'inherit' });
process.exit(result.status ?? 1);
