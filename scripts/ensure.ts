// Garante que o computador está pronto: Node compatível, dependências instaladas, SQLite funcionando.
// Usado por `npm run setup` e `npm run dev`.
import {
  ROOT, BACKEND, c, ok, warn, fail, info,
  nodeStatus, explainBadNode, run, hasDeps, removeNodeModules, sqliteStatus, resolveExpoCli, resolveBackendTsx,
} from './lib';

export function pathWarnings(): void {
  if (/onedrive/i.test(ROOT)) {
    warn('O projeto está dentro do OneDrive. A sincronização pode travar o npm install (erros EPERM).');
    console.log('        Se der erro, copie a pasta para um lugar fora do OneDrive, por exemplo C:\\projetos\\AgroScan.');
  }
  if (ROOT.length > 100) {
    warn(`O caminho da pasta é longo (${ROOT.length} caracteres). No Windows isso pode quebrar o npm install; prefira algo curto como C:\\projetos\\AgroScan.`);
  }
}

function install(dir: string, label: string): void {
  try {
    run('npm install --no-audit --no-fund', dir);
  } catch {
    fail(`A instalação de ${label} falhou (veja o erro acima).`);
    console.log('        Causas comuns: sem internet, Node fora da faixa suportada, ou antivírus/OneDrive bloqueando arquivos.');
    console.log('        Tente:  npm run setup -- --clean');
    process.exit(1);
  }
}

export async function ensureEnvironment({ clean = false }: { clean?: boolean } = {}): Promise<void> {
  const status = nodeStatus();
  if (!status.ok) {
    explainBadNode(status);
    process.exit(1);
  }
  ok(`Node ${status.version}`);
  pathWarnings();

  if (clean) {
    info('Removendo node_modules (raiz e backend) para instalar do zero...');
    removeNodeModules(ROOT);
    removeNodeModules(BACKEND);
  }

  if (!hasDeps(ROOT) || !resolveExpoCli()) {
    info('Instalando as dependências do app (na primeira vez leva alguns minutos)...');
    install(ROOT, 'o app');
  }
  ok('Dependências do app');

  if (!hasDeps(BACKEND) || !resolveBackendTsx()) {
    info('Instalando as dependências do backend...');
    install(BACKEND, 'o backend');
  }
  ok('Dependências do backend');

  let sqlite = sqliteStatus();
  if (!sqlite.ok) {
    warn('O banco de dados (SQLite) não carregou. Isso acontece quando ele foi instalado com outra versão do Node. Reparando...');
    try {
      run('npm rebuild better-sqlite3', BACKEND);
    } catch {
      // tenta a reinstalação completa logo abaixo
    }
    sqlite = sqliteStatus();
    if (!sqlite.ok) {
      removeNodeModules(BACKEND);
      install(BACKEND, 'o backend');
      sqlite = sqliteStatus();
    }
  }
  if (!sqlite.ok) {
    fail('Não consegui fazer o banco de dados (SQLite) funcionar neste computador.');
    console.log(c.dim(sqlite.detail || ''));
    console.log('        Confira a versão do Node (node -v) e rode:  npm run setup -- --clean');
    console.log('        Se continuar, mande um print do resultado de:  npm run doctor');
    process.exit(1);
  }
  ok('Banco de dados (SQLite)');
}
