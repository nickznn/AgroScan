// npm run site:deploy: publica o site (website/) e a versão web do app (em /app/) no GitHub Pages.
// Gera o app web com "expo export", monta tudo numa pasta temporária e envia como um novo commit da branch gh-pages.
import { execFileSync, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { FRONTEND, ROOT, c, fail, info, ok, resolveExpoCli } from './lib';

const BASE_URL = '/AgroScan/app'; // o app fica em https://<usuario>.github.io/AgroScan/app/
const PAGES_BRANCH = 'gh-pages';

function git(args: string[], cwd: string = ROOT): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function buildWebApp(): string {
  const expoCli = resolveExpoCli();
  if (!expoCli) {
    fail('Não encontrei o Expo. Rode:  npm run setup');
    process.exit(1);
  }
  const dist = path.join(FRONTEND, 'dist');
  fs.rmSync(dist, { recursive: true, force: true });
  info('Gerando a versão web do app (leva cerca de 1 minuto)...');
  const result = spawnSync(process.execPath, [expoCli, 'export', '-p', 'web'], {
    cwd: FRONTEND,
    env: { ...process.env, AGROSCAN_WEB_BASE_URL: BASE_URL, CI: '1' },
    stdio: 'inherit',
  });
  if (result.status !== 0 || !fs.existsSync(path.join(dist, 'index.html'))) {
    fail('Não foi possível gerar a versão web do app.');
    process.exit(1);
  }
  const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  if (!html.includes(`${BASE_URL}/_expo/`)) {
    fail(`O index.html gerado não usa o prefixo ${BASE_URL}. Confira o frontend/app.config.ts.`);
    process.exit(1);
  }
  ok('Versão web do app gerada');
  return dist;
}

function main(): void {
  const dist = buildWebApp();

  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'agroscan-site-'));
  const worktree = path.join(os.tmpdir(), `agroscan-pages-${Date.now()}`);
  try {
    fs.cpSync(path.join(ROOT, 'website'), staging, { recursive: true });
    fs.cpSync(dist, path.join(staging, 'app'), { recursive: true });
    fs.writeFileSync(path.join(staging, '.nojekyll'), ''); // o Pages ignoraria a pasta _expo (começa com "_")

    info(`Preparando a branch ${PAGES_BRANCH}...`);
    git(['fetch', 'origin', PAGES_BRANCH]);
    git(['worktree', 'add', '--detach', worktree, `origin/${PAGES_BRANCH}`]);
    for (const name of fs.readdirSync(worktree)) {
      if (name !== '.git') fs.rmSync(path.join(worktree, name), { recursive: true, force: true });
    }
    fs.cpSync(staging, worktree, { recursive: true });
    git(['add', '-A'], worktree);
    if (!git(['status', '--porcelain'], worktree)) {
      ok('Nada mudou desde a última publicação.');
      return;
    }
    const short = git(['rev-parse', '--short', 'HEAD']);
    git(['commit', '-m', `Deploy the website and the web app (source ${short})`], worktree);
    info('Enviando para o GitHub...');
    git(['push', 'origin', `HEAD:${PAGES_BRANCH}`], worktree);
    ok('Publicado. Em cerca de 1 minuto: https://nickznn.github.io/AgroScan/ (app em /app/)');
    console.log(c.dim('        O site e o app só mudam se você rodar este comando de novo.'));
  } finally {
    try {
      git(['worktree', 'remove', '--force', worktree]);
    } catch {
      // se o worktree nem chegou a existir, não há o que remover
    }
    fs.rmSync(staging, { recursive: true, force: true });
  }
}

main();
