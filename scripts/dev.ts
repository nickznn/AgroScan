// npm run dev       -> sobe o backend e o Expo juntos (escaneie o QR Code com o Expo Go)
// npm run api       -> sobe só o backend
// npm run doctor    -> diagnóstico do ambiente (para mandar no grupo quando algo não funciona)
// Opções: --ip=192.168.0.10  força o IP mostrado no QR Code (útil se o computador tem várias redes)
import { ChildProcess, execSync, spawn } from 'child_process';
import os from 'os';
import path from 'path';
import {
  ROOT, BACKEND, API_PORT, METRO_PORT, c, ok, warn, fail, info,
  nodeStatus, hasDeps, sqliteStatus, resolveExpoCli, resolveBackendTsx, lanCandidates, pickLanIp,
  portInUse, isAgroscanApi, gitCommit, portHelp, firewallCheck,
} from './lib';
import { ensureEnvironment, pathWarnings } from './ensure';

const args = process.argv.slice(2);
const mode = args.find((a) => !a.startsWith('--')) || 'lan';
const forcedIp = (args.find((a) => a.startsWith('--ip=')) || '').slice(5) || process.env.AGROSCAN_IP || '';

type BackendProcess = ChildProcess & { output: string[]; ready?: boolean };

let backendProc: BackendProcess | null = null;
let shuttingDown = false;

function shutdown(code = 0): void {
  if (shuttingDown) return;
  shuttingDown = true;
  if (backendProc && !backendProc.killed) backendProc.kill();
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// ------------------------------------------------------------------ backend
function startBackend(): BackendProcess {
  if (!resolveBackendTsx()) {
    fail('Não encontrei o tsx do backend. Rode:  npm run setup -- --clean');
    process.exit(1);
  }
  const output: string[] = [];
  // "node --import tsx" (e não o comando tsx) mantém um único processo: encerrar o backend no Windows mata o servidor de verdade.
  const proc = spawn(process.execPath, ['--import', 'tsx', path.join('src', 'index.ts')], {
    cwd: BACKEND,
    env: { ...process.env, PORT: String(API_PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  }) as BackendProcess;
  const forward = (stream: NodeJS.ReadableStream, isErr: boolean) => {
    stream.setEncoding('utf8');
    stream.on('data', (chunk: string) => {
      for (const line of chunk.split(/\r?\n/)) {
        if (!line.trim() || /injected env/.test(line)) continue;
        output.push(line);
        if (output.length > 40) output.shift();
        if (proc.ready || isErr) console.log(`${c.dim('[api]')} ${line}`);
      }
    });
  };
  forward(proc.stdout as NodeJS.ReadableStream, false);
  forward(proc.stderr as NodeJS.ReadableStream, true);
  proc.output = output;
  return proc;
}

async function waitForBackend(proc: BackendProcess): Promise<boolean> {
  const exited = new Promise<number | null>((resolve) => proc.once('exit', (code) => resolve(code)));
  for (let i = 0; i < 70; i++) {
    if (await isAgroscanApi()) {
      proc.ready = true;
      return true;
    }
    const code = await Promise.race([exited, new Promise<undefined>((r) => setTimeout(() => r(undefined), 300))]);
    if (code !== undefined) {
      fail(`O backend encerrou logo ao iniciar (código ${code}).`);
      console.log(c.dim(proc.output.join('\n')));
      console.log('        Confira a versão do Node (node -v) e rode:  npm run setup -- --clean');
      return false;
    }
  }
  fail('O backend não respondeu em 20 segundos.');
  console.log(c.dim(proc.output.join('\n')));
  return false;
}

// ------------------------------------------------------------------ doctor
async function doctor(): Promise<void> {
  console.log(c.bold('\nAgroScan — diagnóstico do ambiente\n'));
  const lines: string[] = [];
  const note = (label: string, value: string) => lines.push(`${label.padEnd(27)} ${value}`);
  let problems = 0;

  note('Sistema', `${os.type()} ${os.release()} (${os.arch()})`);
  const commit = gitCommit();
  note('Versão do projeto', commit ? `commit ${commit}` : 'sem git (pasta baixada em ZIP?)');
  note('Pasta', ROOT);

  const node = nodeStatus();
  note('Node', `${node.version} ${node.ok ? '(ok)' : '(NÃO SERVE: ' + node.reason + ')'}`);
  if (!node.ok) problems++;
  try {
    note('npm', execSync('npm -v', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim());
  } catch {
    note('npm', 'não encontrado');
    problems++;
  }

  const rootDeps = hasDeps(ROOT) && !!resolveExpoCli();
  const backDeps = hasDeps(BACKEND) && !!resolveBackendTsx();
  note('Dependências do app', rootDeps ? 'instaladas' : 'FALTAM  -> rode: npm run setup');
  note('Dependências do backend', backDeps ? 'instaladas' : 'FALTAM  -> rode: npm run setup');
  if (!rootDeps) problems++;
  if (!backDeps) problems++;

  if (backDeps) {
    const sq = sqliteStatus();
    note('Banco (SQLite)', sq.ok ? 'carrega' : `NÃO CARREGA${sq.mismatch ? ' (instalado por outro Node)' : ''} -> rode: npm run setup -- --clean`);
    if (!sq.ok) problems++;
  }

  const apiBusy = await portInUse(API_PORT);
  const apiMine = apiBusy && (await isAgroscanApi());
  note(`Porta ${API_PORT} (backend)`, apiMine ? 'o backend do AgroScan já está rodando' : apiBusy ? 'OCUPADA por outro programa' : 'livre');
  if (apiBusy && !apiMine) problems++;
  note(`Porta ${METRO_PORT} (Expo)`, (await portInUse(METRO_PORT)) ? 'em uso (talvez o Expo já esteja rodando)' : 'livre');

  const candidates = lanCandidates();
  const chosen = pickLanIp(forcedIp);
  note('IP escolhido p/ o celular', chosen || 'NENHUM (o computador não está numa rede?)');
  if (!chosen) problems++;
  for (const cand of candidates) note('  rede disponível', `${cand.address}  (${cand.name})`);

  for (const l of lines) console.log('  ' + l);
  console.log('');

  if (process.platform === 'win32') {
    console.log(c.dim('Conferindo o Firewall do Windows (pode levar até 1 minuto na primeira vez)...'));
    const fw = await firewallCheck(70000);
    if (!fw) warn('Não consegui ler o Firewall do Windows (sem problema; só não foi possível conferir).');
    else if (fw.level === 'ok') ok(fw.text);
    else {
      warn(fw.text);
      console.log('        Para corrigir, abra o PowerShell COMO ADMINISTRADOR e rode:');
      for (const cmd of fw.fix || []) console.log('          ' + cmd);
      console.log('        (ou, mais simples: ligue o hotspot do celular e, quando o Windows perguntar, marque redes privadas E públicas)');
      if (fw.level === 'warn') problems++;
    }
    console.log('');
  }
  pathWarnings();
  if (problems === 0) {
    ok('Nada de errado encontrado neste computador. Se o celular não conectar, o problema é a rede:');
    console.log('        celular e computador precisam estar na MESMA rede Wi-Fi (ou use o hotspot do celular).');
  } else {
    fail(`${problems} problema(s) encontrado(s) (marcados acima).`);
  }
  console.log('');
  console.log(c.dim('Para pedir ajuda: tire um print (ou copie) este diagnóstico e mande no grupo.'));
  console.log('');
}

// ------------------------------------------------------------------ main
async function main(): Promise<void> {
  if (mode === 'doctor') return doctor();
  if (!['lan', 'api'].includes(mode)) {
    fail(`Modo desconhecido: ${mode}. Use:  npm run dev  |  npm run api  |  npm run doctor`);
    process.exit(1);
  }

  console.log(c.bold('\nAgroScan — iniciando\n'));
  await ensureEnvironment();

  if (await portInUse(API_PORT)) {
    if (await isAgroscanApi()) {
      ok(`O backend já estava rodando na porta ${API_PORT}; vou reaproveitar.`);
    } else {
      fail(`A porta ${API_PORT} está ocupada por outro programa (provavelmente um terminal antigo).`);
      console.log(`        ${portHelp(API_PORT)}`);
      process.exit(1);
    }
  } else {
    info('Iniciando o backend...');
    const proc = startBackend();
    backendProc = proc;
    if (!(await waitForBackend(proc))) shutdown(1);
    ok(`Backend no ar na porta ${API_PORT}`);
    proc.once('exit', (code) => {
      if (!shuttingDown) {
        fail(`O backend parou sozinho (código ${code}). O login no app vai falhar até você reiniciar:  npm run dev`);
        console.log(c.dim(proc.output.slice(-8).join('\n')));
      }
    });
  }

  const ip = pickLanIp(forcedIp);
  const others = lanCandidates().filter((x) => x.address !== ip);

  if (mode === 'api') {
    console.log('');
    console.log(`  Backend rodando em http://${ip || 'localhost'}:${API_PORT}  (Ctrl+C para parar)`);
    if (!backendProc) return shutdown(0);
    backendProc.on('exit', (code) => shutdown(code || 0));
    return;
  }

  const expoCli = resolveExpoCli();
  if (!expoCli) {
    fail('O Expo não foi encontrado. Rode:  npm run setup -- --clean');
    return shutdown(1);
  }

  console.log('');
  console.log(c.bold('  ==============================================================='));
  console.log(`   Backend (API)  http://${ip || 'localhost'}:${API_PORT}   ${c.green('rodando')}`);
  console.log(`   App (Expo)     iniciando... aguarde o QR Code aparecer`);
  console.log('   ---------------------------------------------------------------');
  console.log('   1. No celular, abra o Expo Go e escaneie o QR Code.');
  console.log('   2. Na tela de login deve aparecer "Servidor conectado".');
  console.log('   3. Se aparecer "Sem resposta do servidor": o celular e este computador');
  console.log('      precisam estar na MESMA rede Wi-Fi. Rede da faculdade bloqueando?');
  console.log('      Ligue o hotspot do celular e conecte o computador nele (veja o README).');
  console.log('   4. Ainda não conectou? Abra OUTRO terminal e rode:  npm run doctor');
  if (!ip) console.log(c.yellow('   ! Não achei o IP deste computador na rede. Conecte-se ao Wi-Fi ou use --ip=SEU_IP'));
  if (others.length) {
    console.log(c.dim(`   Outras redes deste computador: ${others.map((o) => o.address).join(', ')}`));
    console.log(c.dim('   (se o QR mostrar o IP errado:  npm run dev -- --ip=IP_CERTO)'));
  }
  console.log('   Para parar tudo: Ctrl+C');
  console.log(c.bold('  ==============================================================='));
  console.log('');

  const env: NodeJS.ProcessEnv = { ...process.env };
  if (ip) env.REACT_NATIVE_PACKAGER_HOSTNAME = ip;
  const expo = spawn(process.execPath, [expoCli, 'start'], { cwd: ROOT, env, stdio: 'inherit' });
  expo.on('exit', (code) => shutdown(code || 0));
  expo.on('error', (err) => {
    fail(`Não consegui iniciar o Expo: ${err.message}`);
    shutdown(1);
  });
}

main().catch((err) => {
  fail(`Erro inesperado: ${err && err.message ? err.message : err}`);
  shutdown(1);
});
