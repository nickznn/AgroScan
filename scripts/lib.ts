// Utilitários dos scripts de setup/dev. Usa só módulos nativos do Node (mais o tsx, que roda estes arquivos .ts).
import { execSync, spawn, spawnSync } from 'child_process';
import fs from 'fs';
import http from 'http';
import net from 'net';
import os from 'os';
import path from 'path';

export const ROOT = path.join(__dirname, '..');
export const BACKEND = path.join(ROOT, 'backend');
export const API_PORT = 4000;
export const METRO_PORT = 8081;

const useColor = process.stdout.isTTY && process.env.NO_COLOR === undefined;
const paint = (code: number) => (s: string) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : String(s));
export const c = { red: paint(31), green: paint(32), yellow: paint(33), cyan: paint(36), bold: paint(1), dim: paint(2) };

export const ok = (msg: string) => console.log(`${c.green('[OK]')}    ${msg}`);
export const warn = (msg: string) => console.log(`${c.yellow('[AVISO]')} ${msg}`);
export const fail = (msg: string) => console.log(`${c.red('[ERRO]')}  ${msg}`);
export const info = (msg: string) => console.log(`${c.cyan('[..]')}    ${msg}`);

// ---------------------------------------------------------------- Node
// Faixas aceitas pelo Expo SDK 58 / React Native 0.88 (campo "engines" do react-native, do metro e do expo):
// Node 22.13+, 24.3+ ou 26+. As versões ímpares (23, 25) e o Node 20 não são suportados.
// Fora da faixa o Expo quebra com erros como "configs.toReversed is not a function".
const NODE_MIN: Record<number, [number, number, number]> = { 22: [22, 13, 0], 24: [24, 3, 0] };

function parseVersion(v: string): number[] {
  return String(v).replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
}

function compareVersions(a: number[], b: number[]): number {
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0);
  }
  return 0;
}

export interface NodeStatus {
  ok: boolean;
  version: string;
  reason?: string;
}

// AGROSCAN_FAKE_NODE existe só para testar este verificador sem trocar de Node.
export function nodeStatus(version: string = process.env.AGROSCAN_FAKE_NODE || process.versions.node): NodeStatus {
  const v = parseVersion(version);
  const major = v[0];
  if (major >= 26) return { ok: true, version };
  const min = NODE_MIN[major];
  if (min && compareVersions(v, min) >= 0) return { ok: true, version };
  const reason = min ? `a linha ${major}.x só é aceita a partir da ${min.join('.')}` : `a linha ${major}.x não é suportada`;
  return { ok: false, version, reason };
}

export function explainBadNode(status: NodeStatus): void {
  fail(`Node ${status.version} não serve para este projeto (${status.reason}).`);
  console.log('');
  console.log('        O projeto precisa de Node 22.13 ou mais novo (na linha 22), 24.3 ou mais novo (na linha 24), ou Node 26+.');
  console.log(`        ${c.bold('Recomendado: instale o Node 22 LTS')} em https://nodejs.org (botão "LTS").`);
  console.log('');
  console.log('        Depois de instalar: FECHE o VS Code por completo, abra de novo e confira com:  node -v');
  console.log('        Em seguida, apague as pastas node_modules (raiz e backend) ou rode:  npm run setup -- --clean');
}

// ---------------------------------------------------------------- comandos
export function run(cmd: string, cwd: string): void {
  execSync(cmd, { cwd, stdio: 'inherit' });
}

export function hasDeps(dir: string): boolean {
  try {
    return fs.readdirSync(path.join(dir, 'node_modules')).some((name) => name !== '.bin');
  } catch {
    return false;
  }
}

// Apaga item por item e ignora o que estiver em uso: o próprio tsx (que roda este script) fica travado no Windows.
// O npm install seguinte recompõe qualquer coisa que tenha ficado pela metade.
export function removeNodeModules(dir: string): void {
  const nm = path.join(dir, 'node_modules');
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(nm);
  } catch {
    return;
  }
  for (const entry of entries) {
    try {
      fs.rmSync(path.join(nm, entry), { recursive: true, force: true });
    } catch {
      // arquivo em uso: o npm install corrige depois
    }
  }
}

export interface SqliteStatus {
  ok: boolean;
  mismatch?: boolean;
  missing?: boolean;
  detail?: string;
}

// O SQLite é a única dependência com código nativo: se foi instalado por outro Node, falha ao abrir.
export function sqliteStatus(): SqliteStatus {
  const code = "const D=require('better-sqlite3');const d=new D(':memory:');d.prepare('select 1 as x').get();console.log('ok')";
  const r = spawnSync(process.execPath, ['-e', code], { cwd: BACKEND, encoding: 'utf8' });
  if (r.status === 0 && /ok/.test(r.stdout)) return { ok: true };
  const text = `${r.stderr || ''}${r.stdout || ''}`;
  const mismatch = /NODE_MODULE_VERSION|was compiled against a different Node/i.test(text);
  const missing = /Cannot find module/i.test(text);
  return { ok: false, mismatch, missing, detail: text.split('\n').slice(0, 6).join('\n') };
}

export function resolveExpoCli(): string | null {
  try {
    return require.resolve('expo/bin/cli', { paths: [ROOT] });
  } catch {
    return null;
  }
}

// O backend roda em TypeScript através do tsx, instalado em backend/node_modules.
export function resolveBackendTsx(): string | null {
  try {
    return require.resolve('tsx/package.json', { paths: [BACKEND] });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- rede
const VIRTUAL_NAME = /vethernet|virtualbox|vbox|vmware|loopback|hyper-v|wsl|docker|tailscale|zerotier|hamachi|bluetooth|tap-|tun\d|utun|vpn|npcap/i;

export interface LanCandidate {
  name: string;
  address: string;
  score: number;
}

export function lanCandidates(): LanCandidate[] {
  const list: LanCandidate[] = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family !== 'IPv4' || a.internal) continue;
      if (a.address.startsWith('169.254.')) continue;
      const octets = a.address.split('.').map(Number);
      const isPrivate =
        a.address.startsWith('192.168.') ||
        a.address.startsWith('10.') ||
        (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31);
      let score = 0;
      if (isPrivate) score += 10;
      if (a.address.startsWith('192.168.')) score += 2;
      if (VIRTUAL_NAME.test(name)) score -= 20;
      list.push({ name, address: a.address, score });
    }
  }
  return list.sort((x, y) => y.score - x.score);
}

export function pickLanIp(forced?: string): string | null {
  if (forced) return forced;
  const best = lanCandidates()[0];
  return best && best.score > 0 ? best.address : null;
}

function tcpOpen(port: number, host = '127.0.0.1', timeoutMs = 700): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const done = (value: boolean) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });
}

export async function portInUse(port: number): Promise<boolean> {
  return (await tcpOpen(port, '127.0.0.1')) || (await tcpOpen(port, '::1'));
}

export function getJson(url: string, timeoutMs = 1500): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(null);
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.on('error', () => resolve(null));
  });
}

export async function isAgroscanApi(port: number = API_PORT): Promise<boolean> {
  const body = await getJson(`http://127.0.0.1:${port}/health`);
  return !!body && body.service === 'agroscan-api';
}

export function gitCommit(): string | null {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
}

export function portHelp(port: number): string {
  if (process.platform === 'win32') {
    return `Para ver quem usa a porta:  netstat -ano | findstr :${port}   e encerre com:  taskkill /PID <número> /F`;
  }
  return `Para ver quem usa a porta:  lsof -i :${port}   e encerre com:  kill <número>`;
}

// ---------------------------------------------------------------- firewall (Windows)
// No Windows, o aviso "Permitir acesso" do Firewall marca só "redes privadas" por padrão. Se o Wi-Fi (ou o
// hotspot do celular) for tratado como rede "pública", o celular é bloqueado. Aqui lemos as regras do Node.
const FIREWALL_PS = `
$node = '__NODE__'
$rules = @()
$filters = Get-NetFirewallApplicationFilter -ErrorAction SilentlyContinue | Where-Object { $_.Program -ieq $node }
foreach ($f in $filters) {
  $r = $f | Get-NetFirewallRule -ErrorAction SilentlyContinue
  if ($r) { $rules += [pscustomobject]@{ Enabled=[string]$r.Enabled; Direction=[string]$r.Direction; Action=[string]$r.Action; Profile=[string]$r.Profile } }
}
$nets = @(Get-NetConnectionProfile -ErrorAction SilentlyContinue | ForEach-Object { [pscustomobject]@{ Interface=$_.InterfaceAlias; Category=[string]$_.NetworkCategory } })
@{ rules = @($rules); nets = @($nets) } | ConvertTo-Json -Compress -Depth 4
`;

interface FirewallRule {
  Enabled: string;
  Direction: string;
  Action: string;
  Profile: string;
}

interface FirewallData {
  rules?: FirewallRule | FirewallRule[] | null;
  nets?: { Interface: string; Category: string } | { Interface: string; Category: string }[] | null;
}

export interface FirewallVerdict {
  level: 'ok' | 'info' | 'warn';
  text: string;
  fix?: string[];
}

function readFirewall(timeoutMs = 90000): Promise<FirewallData | null> {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') return resolve(null);
    const script = FIREWALL_PS.replace('__NODE__', process.execPath.replace(/'/g, "''"));
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    const child = spawn('powershell', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    let out = '';
    const timer = setTimeout(() => {
      child.kill();
      resolve(null);
    }, timeoutMs);
    child.stdout.on('data', (d) => (out += d));
    child.on('error', () => {
      clearTimeout(timer);
      resolve(null);
    });
    child.on('close', () => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(out.trim().split(/\r?\n/).pop() as string));
      } catch {
        resolve(null);
      }
    });
  });
}

export function analyzeFirewall(data: FirewallData | null): FirewallVerdict | null {
  if (!data) return null;
  const asList = <T>(x: T | T[] | null | undefined): T[] => (x == null ? [] : ([] as T[]).concat(x));
  const rules = asList(data.rules).filter((r) => r.Enabled === 'True' && r.Direction === 'Inbound');
  const nets = asList(data.nets);
  const need: Record<string, string> = { Public: 'Public', Private: 'Private', DomainAuthenticated: 'Domain' };
  const covers = (r: FirewallRule, cat: string) => /Any/.test(r.Profile) || new RegExp(need[cat] || cat).test(r.Profile);
  const nodePath = process.execPath;
  const fixAllow = `New-NetFirewallRule -DisplayName "AgroScan Node" -Direction Inbound -Program "${nodePath}" -Action Allow -Profile Any`;
  const fixBlock = 'Get-NetFirewallRule -Direction Inbound -Action Block -DisplayName "Node.js JavaScript Runtime" | Remove-NetFirewallRule';

  const blocks = rules.filter((r) => r.Action === 'Block');
  const allows = rules.filter((r) => r.Action === 'Allow');
  const active = nets.map((n) => n.Category).filter(Boolean);

  if (blocks.length) {
    return {
      level: 'warn',
      text: 'O Firewall do Windows está BLOQUEANDO o Node (provavelmente você clicou em "Cancelar" no aviso de permissão).',
      fix: [fixBlock, fixAllow],
    };
  }
  if (!allows.length) {
    return {
      level: 'info',
      text: 'Não há regra do Firewall para o Node ainda. Na primeira vez o Windows vai perguntar: marque as DUAS caixas (redes privadas E públicas) e clique em "Permitir acesso".',
      fix: [fixAllow],
    };
  }
  const uncovered = [...new Set(active)].filter((cat) => !allows.some((r) => covers(r, cat)));
  if (uncovered.length) {
    const labels: Record<string, string> = { Public: 'pública', Private: 'privada', DomainAuthenticated: 'de domínio' };
    const names = uncovered.map((u) => labels[u] || u);
    return {
      level: 'warn',
      text: `O Node está liberado no Firewall, mas NÃO para a rede em uso (que o Windows trata como ${names.join('/')}). O celular não vai conseguir conectar.`,
      fix: [fixAllow],
    };
  }
  return { level: 'ok', text: 'Firewall do Windows: o Node está liberado para as redes em uso.' };
}

export async function firewallCheck(timeoutMs?: number): Promise<FirewallVerdict | null> {
  return analyzeFirewall(await readFirewall(timeoutMs));
}
