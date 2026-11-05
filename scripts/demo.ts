// npm run demo: prepara a apresentação (pitch).
// Sobe a API em modo público (banco separado, sem a conta de admin de demonstração, com limite de tentativas),
// abre um túnel HTTPS gratuito até ela e mostra o link do site já com o QR Code apontando para o app.
import { ChildProcess, spawn, spawnSync } from 'child_process';
import crypto from 'crypto';
import path from 'path';

import { API_PORT, BACKEND, c, explainBadNode, fail, info, isAgroscanApi, nodeStatus, ok, portInUse, resolveBackendTsx, warn } from './lib';

const SITE_URL = (process.env.AGROSCAN_SITE_URL || 'https://nickznn.github.io/AgroScan').replace(/\/+$/, '');

const children: ChildProcess[] = [];

function shutdown(code: number): never {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

function canRun(cmd: string, args: string[]): boolean {
  try {
    return spawnSync(cmd, args, { stdio: 'ignore', timeout: 5000 }).status === 0;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------ API em modo público
function startApi(): ChildProcess {
  if (!resolveBackendTsx()) {
    fail('Não encontrei o tsx do backend. Rode:  npm run setup -- --clean');
    process.exit(1);
  }
  const proc = spawn(process.execPath, ['--import', 'tsx', path.join('src', 'index.ts')], {
    cwd: BACKEND,
    env: {
      ...process.env,
      PORT: String(API_PORT),
      NODE_ENV: 'production', // sem a conta de admin de demonstração (senha conhecida)
      AGROSCAN_PUBLIC: '1', // atrás de proxy e com limite de tentativas
      JWT_SECRET: crypto.randomBytes(32).toString('hex'), // chave nova a cada apresentação
      DB_PATH: path.join(BACKEND, 'data', 'demo.db'), // banco separado do seu banco de desenvolvimento
      ADMIN_EMAIL: '',
      ADMIN_PASSWORD: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const forward = (stream: NodeJS.ReadableStream) => {
    stream.setEncoding('utf8');
    stream.on('data', (chunk: string) => {
      for (const line of chunk.split(/\r?\n/)) {
        if (line.trim() && !/injected env|Nenhum administrador existe/.test(line)) console.log(`${c.dim('[api]')} ${line}`);
      }
    });
  };
  forward(proc.stdout as NodeJS.ReadableStream);
  forward(proc.stderr as NodeJS.ReadableStream);
  children.push(proc);
  return proc;
}

async function waitForApi(proc: ChildProcess): Promise<boolean> {
  let exited = false;
  proc.once('exit', () => (exited = true));
  for (let i = 0; i < 70; i++) {
    if (await isAgroscanApi()) return true;
    if (exited) return false;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

// ------------------------------------------------------------------ túnel
interface Tunnel {
  name: string;
  command: string;
  args: string[];
  pattern: RegExp;
}

function pickTunnel(): Tunnel | null {
  if (canRun('cloudflared', ['--version'])) {
    return {
      name: 'Cloudflare (cloudflared)',
      command: 'cloudflared',
      args: ['tunnel', '--url', `http://localhost:${API_PORT}`, '--no-autoupdate'],
      pattern: /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i,
    };
  }
  // O ssh já vem no Windows 10/11 e no macOS/Linux: não precisa instalar nada.
  if (canRun('ssh', ['-V'])) {
    return {
      name: 'localhost.run (via ssh)',
      command: 'ssh',
      args: [
        '-o', 'StrictHostKeyChecking=accept-new',
        '-o', 'ServerAliveInterval=30',
        '-o', 'ExitOnForwardFailure=yes',
        '-R', `80:localhost:${API_PORT}`,
        'nokey@localhost.run',
      ],
      pattern: /https:\/\/[a-z0-9]+\.lhr\.life/i,
    };
  }
  return null;
}

function openTunnel(tunnel: Tunnel): Promise<{ proc: ChildProcess; url: string } | null> {
  return new Promise((resolve) => {
    const proc = spawn(tunnel.command, tunnel.args, { stdio: ['ignore', 'pipe', 'pipe'] });
    children.push(proc);
    let done = false;
    const finish = (value: { proc: ChildProcess; url: string } | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), 40000);
    const onData = (chunk: Buffer) => {
      const url = chunk.toString().match(tunnel.pattern)?.[0];
      if (url) finish({ proc, url });
    };
    proc.stdout?.on('data', onData);
    proc.stderr?.on('data', onData);
    proc.once('exit', () => finish(null));
    proc.once('error', () => finish(null));
  });
}

async function tunnelAnswers(url: string): Promise<boolean> {
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(4000) });
      const body = (await res.json()) as { service?: string };
      if (body.service === 'agroscan-api') return true;
    } catch {
      // o túnel pode levar alguns segundos para responder
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

function copyToClipboard(text: string): boolean {
  try {
    return spawnSync('clip', { input: text, shell: true, stdio: ['pipe', 'ignore', 'ignore'] }).status === 0;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------ principal
async function main(): Promise<void> {
  console.log(c.bold('\nAgroScan: modo apresentação\n'));
  const node = nodeStatus();
  if (!node.ok) {
    explainBadNode(node);
    process.exit(1);
  }
  if (await portInUse(API_PORT)) {
    fail(`A porta ${API_PORT} já está em uso (o npm run dev está aberto?). Feche e rode de novo.`);
    process.exit(1);
  }

  info('Iniciando a API em modo público...');
  const api = startApi();
  if (!(await waitForApi(api))) {
    fail('A API não subiu. Rode  npm run setup -- --clean  e tente de novo.');
    shutdown(1);
  }
  ok(`API no ar na porta ${API_PORT} (banco backend/data/demo.db, sem conta de admin)`);

  const tunnel = pickTunnel();
  if (!tunnel) {
    fail('Não encontrei como abrir o túnel. Instale o cloudflared (https://github.com/cloudflare/cloudflared) ou use um Windows/macOS/Linux com ssh.');
    shutdown(1);
  }
  info(`Abrindo o túnel HTTPS com ${tunnel.name}...`);
  const opened = await openTunnel(tunnel);
  if (!opened) {
    fail('O túnel não abriu em 40 segundos. Confira a internet e tente de novo.');
    shutdown(1);
  }
  if (!(await tunnelAnswers(opened.url))) {
    fail(`O túnel abriu (${opened.url}), mas a API não respondeu por ele.`);
    shutdown(1);
  }
  ok(`Túnel no ar: ${opened.url}`);

  const appLink = `${SITE_URL}/app/?api=${opened.url}`;
  const siteLink = `${SITE_URL}/?app=${encodeURIComponent(appLink)}`;
  const copied = copyToClipboard(siteLink);

  console.log('');
  console.log('  ===============================================================');
  console.log(`   ${c.bold('Abra este link para apresentar (o QR Code já vem pronto):')}`);
  console.log(`   ${c.cyan(siteLink)}`);
  console.log(copied ? c.dim('   (copiado para a área de transferência)') : '');
  console.log('');
  console.log(`   App direto (para testar):  ${appLink}`);
  console.log('  ---------------------------------------------------------------');
  console.log('   Mantenha esta janela aberta durante a apresentação: se ela fechar,');
  console.log('   o app para de funcionar. Os dados desta sessão ficam em demo.db.');
  console.log('   Para encerrar tudo: Ctrl+C');
  console.log('  ===============================================================\n');
  warn('O endereço do túnel muda a cada vez que você roda o comando.');

  opened.proc.once('exit', () => {
    fail('O túnel caiu. Rode  npm run demo  de novo e use o novo link.');
    shutdown(1);
  });
  api.once('exit', () => {
    fail('A API encerrou.');
    shutdown(1);
  });
}

main().catch((err) => {
  fail(String(err));
  shutdown(1);
});
