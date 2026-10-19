// Utilitários dos scripts de setup/dev. Usa SOMENTE módulos nativos do Node, para funcionar logo
// depois do `git clone`, antes de qualquer `npm install`.
const { execSync, spawn, spawnSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BACKEND = path.join(ROOT, 'backend');
const API_PORT = 4000;
const METRO_PORT = 8081;

const useColor = process.stdout.isTTY && process.env.NO_COLOR === undefined;
const paint = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const c = { red: paint(31), green: paint(32), yellow: paint(33), cyan: paint(36), bold: paint(1), dim: paint(2) };

const ok = (msg) => console.log(`${c.green('[OK]')}    ${msg}`);
const warn = (msg) => console.log(`${c.yellow('[AVISO]')} ${msg}`);
const fail = (msg) => console.log(`${c.red('[ERRO]')}  ${msg}`);
const info = (msg) => console.log(`${c.cyan('[..]')}    ${msg}`);

// ---------------------------------------------------------------- Node
// Faixas aceitas pelo Expo SDK 57 / React Native 0.86 (campo "engines" do react-native e do metro).
// Abaixo disso o Expo quebra com erros como "configs.toReversed is not a function".
const NODE_MIN = { 20: [20, 19, 4], 22: [22, 13, 0], 24: [24, 3, 0] };

function parseVersion(v) {
  return String(v).replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0);
  }
  return 0;
}

// AGROSCAN_FAKE_NODE existe só para testar este verificador sem trocar de Node.
function nodeStatus(version = process.env.AGROSCAN_FAKE_NODE || process.versions.node) {
  const v = parseVersion(version);
  const major = v[0];
  if (major >= 25) return { ok: true, version };
  const min = NODE_MIN[major];
  if (min && compareVersions(v, min) >= 0) return { ok: true, version };
  const reason = min
    ? `a linha ${major}.x só é aceita a partir da ${min.join('.')}`
    : `a linha ${major}.x não é suportada`;
  return { ok: false, version, reason };
}

function explainBadNode(status) {
  fail(`Node ${status.version} não serve para este projeto (${status.reason}).`);
  console.log('');
  console.log('        O projeto precisa de Node 20.19.4 ou mais novo, 22.13 ou mais novo, ou 24.3 ou mais novo.');
  console.log(`        ${c.bold('Recomendado: instale o Node 22 LTS')} em https://nodejs.org (botão "LTS").`);
  console.log('');
  console.log('        Depois de instalar: FECHE o VS Code por completo, abra de novo e confira com:  node -v');
  console.log('        Em seguida, apague as pastas node_modules (raiz e backend) ou rode:  npm run setup -- --clean');
}

// ---------------------------------------------------------------- comandos
function run(cmd, cwd) {
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function hasDeps(dir) {
  return fs.existsSync(path.join(dir, 'node_modules'));
}

function removeNodeModules(dir) {
  fs.rmSync(path.join(dir, 'node_modules'), { recursive: true, force: true });
}

// O SQLite é a única dependência com código nativo: se foi instalado por outro Node, falha ao abrir.
function sqliteStatus() {
  const code = "const D=require('better-sqlite3');const d=new D(':memory:');d.prepare('select 1 as x').get();console.log('ok')";
  const r = spawnSync(process.execPath, ['-e', code], { cwd: BACKEND, encoding: 'utf8' });
  if (r.status === 0 && /ok/.test(r.stdout)) return { ok: true };
  const text = `${r.stderr || ''}${r.stdout || ''}`;
  const mismatch = /NODE_MODULE_VERSION|was compiled against a different Node/i.test(text);
  const missing = /Cannot find module/i.test(text);
  return { ok: false, mismatch, missing, detail: text.split('\n').slice(0, 6).join('\n') };
}

function resolveExpoCli() {
  try {
    return require.resolve('expo/bin/cli', { paths: [ROOT] });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- rede
const VIRTUAL_NAME = /vethernet|virtualbox|vbox|vmware|loopback|hyper-v|wsl|docker|tailscale|zerotier|hamachi|bluetooth|tap-|tun\d|utun|vpn|npcap/i;

function lanCandidates() {
  const list = [];
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

function pickLanIp(forced) {
  if (forced) return forced;
  const best = lanCandidates()[0];
  return best && best.score > 0 ? best.address : null;
}

function tcpOpen(port, host = '127.0.0.1', timeoutMs = 700) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const done = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });
}

async function portInUse(port) {
  return (await tcpOpen(port, '127.0.0.1')) || (await tcpOpen(port, '::1'));
}

function getJson(url, timeoutMs = 1500) {
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

async function isAgroscanApi(port = API_PORT) {
  const body = await getJson(`http://127.0.0.1:${port}/health`);
  return !!body && body.service === 'agroscan-api';
}

function gitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
}

function portHelp(port) {
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

function readFirewall(timeoutMs = 90000) {
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
        resolve(JSON.parse(out.trim().split(/\r?\n/).pop()));
      } catch {
        resolve(null);
      }
    });
  });
}

function analyzeFirewall(data) {
  if (!data) return null;
  const asList = (x) => (x == null ? [] : [].concat(x));
  const rules = asList(data.rules).filter((r) => r.Enabled === 'True' && r.Direction === 'Inbound');
  const nets = asList(data.nets);
  const need = { Public: 'Public', Private: 'Private', DomainAuthenticated: 'Domain' };
  const covers = (r, cat) => /Any/.test(r.Profile) || new RegExp(need[cat] || cat).test(r.Profile);
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
    const names = uncovered.map((u) => ({ Public: 'pública', Private: 'privada', DomainAuthenticated: 'de domínio' }[u] || u));
    return {
      level: 'warn',
      text: `O Node está liberado no Firewall, mas NÃO para a rede em uso (que o Windows trata como ${names.join('/')}). O celular não vai conseguir conectar.`,
      fix: [fixAllow],
    };
  }
  return { level: 'ok', text: 'Firewall do Windows: o Node está liberado para as redes em uso.' };
}

async function firewallCheck(timeoutMs) {
  return analyzeFirewall(await readFirewall(timeoutMs));
}

module.exports = {
  ROOT, BACKEND, API_PORT, METRO_PORT, c, ok, warn, fail, info,
  nodeStatus, explainBadNode, run, hasDeps, removeNodeModules, sqliteStatus, resolveExpoCli,
  lanCandidates, pickLanIp, portInUse, isAgroscanApi, getJson, gitCommit, portHelp,
  firewallCheck, analyzeFirewall,
};
