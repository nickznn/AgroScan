// Teste automático de ponta a ponta da API (HTTP de verdade contra o servidor ligado).
// Uso: com o backend rodando, `npm run smoke`   (BASE=http://outro-host:4000 para mudar o alvo)
// Cria 2 contas descartáveis (smoke...@agroscan.test) e APAGA tudo delas no final
// (as tabelas filhas somem junto por causa do ON DELETE CASCADE), inclusive as fotos enviadas.
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const BASE = process.env.BASE || 'http://localhost:4000';
const DB_FILE = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'agroscan.db');
const UPLOADS = path.join(__dirname, '..', 'uploads');

let pass = 0;
const failures: string[] = [];

function check(name: string, cond: unknown, extra = ''): void {
  if (cond) {
    pass++;
  } else {
    failures.push(`${name} ${extra}`);
    console.log(`  FALHOU: ${name} ${extra}`);
  }
}

// PNG 1x1 válido
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

interface ApiOptions {
  method?: string;
  token?: string;
  json?: unknown;
  form?: FormData;
}

// O corpo das respostas é verificado campo a campo nos testes, então fica sem tipo fixo.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResult = { status: number; body: any };

async function api(route: string, { method = 'GET', token, json, form }: ApiOptions = {}): Promise<ApiResult> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: string | FormData | undefined;
  if (json) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  } else if (form) {
    body = form;
  }
  const res = await fetch(BASE + route, { method, headers, body });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, body: data };
}

function pngForm(field = 'photo'): FormData {
  const f = new FormData();
  f.append(field, new Blob([PNG], { type: 'image/png' }), 'x.png');
  return f;
}

// Remove as contas de teste e os arquivos de foto delas.
function cleanup(): number {
  let db: Database.Database | undefined;
  try {
    db = new Database(DB_FILE, { fileMustExist: true });
    const users = db
      .prepare("SELECT id, avatar_url, farm_photo_url FROM users WHERE email LIKE 'smoke%@agroscan.test'")
      .all() as { id: number; avatar_url: string | null; farm_photo_url: string | null }[];
    if (!users.length) return 0;
    const ids = users.map((u) => u.id);
    const marks = ids.map(() => '?').join(',');
    const photos = db.prepare(`SELECT photo_url FROM detections WHERE user_id IN (${marks})`).all(...ids) as {
      photo_url: string | null;
    }[];
    const files = [...users.flatMap((u) => [u.avatar_url, u.farm_photo_url]), ...photos.map((d) => d.photo_url)].filter(
      (f): f is string => !!f
    );
    db.prepare(`DELETE FROM users WHERE id IN (${marks})`).run(...ids);
    db.prepare("DELETE FROM audit_log WHERE actor_email LIKE 'smoke%@agroscan.test'").run();
    for (const f of files) fs.rmSync(path.join(UPLOADS, path.basename(f)), { force: true });
    return users.length;
  } finally {
    if (db) db.close();
  }
}

// Promove um usuário de teste a administrador direto no banco (o app não tem rota pública para isso, de propósito).
function promoteToAdmin(email: string): void {
  const db = new Database(DB_FILE, { fileMustExist: true });
  try {
    db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(email);
  } finally {
    db.close();
  }
}

async function run(): Promise<void> {
  const stamp = Date.now();
  const email = `smoke${stamp}@agroscan.test`;
  const email2 = `smoke2_${stamp}@agroscan.test`;

  console.log('> health / 404');
  let r = await api('/health');
  check('health 200', r.status === 200 && r.body.ok === true);
  r = await api('/rota-inexistente');
  check('rota inexistente 404', r.status === 404);

  console.log('> auth');
  r = await api('/auth/register', { method: 'POST', json: { email, password: 'senha1234', farmName: 'Fazenda Smoke' } });
  check('register 201', r.status === 201, JSON.stringify(r.body));
  const token: string | undefined = r.body?.token;
  check('register devolve token', !!token);
  check('register devolve farmName digitado', r.body?.user?.farmName === 'Fazenda Smoke');
  check('register: avatar/capa nulos', r.body?.user?.avatarUrl === null && r.body?.user?.farmPhotoUrl === null);
  check('register: senha nao vaza', !JSON.stringify(r.body).includes('password'));

  r = await api('/auth/register', { method: 'POST', json: { email, password: 'outra1234' } });
  check('e-mail duplicado 409', r.status === 409);
  r = await api('/auth/register', { method: 'POST', json: { email: 'a@b.c' } });
  check('cadastro sem senha 400', r.status === 400);

  r = await api('/auth/login', { method: 'POST', json: { email, password: 'errada' } });
  check('login senha errada 401', r.status === 401);
  r = await api('/auth/login', { method: 'POST', json: { email: 'naoexiste@x.com', password: 'x' } });
  check('login usuario inexistente 401', r.status === 401);
  r = await api('/auth/login', { method: 'POST', json: { email: email.toUpperCase(), password: 'senha1234' } });
  check('login (e-mail case-insensitive) 200', r.status === 200);

  r = await api('/auth/me');
  check('/me sem token 401', r.status === 401);
  r = await api('/auth/me', { token: 'lixo' });
  check('/me token invalido 401', r.status === 401);
  r = await api('/auth/me', { token });
  check('/me 200', r.status === 200 && r.body.user.email === email);
  check('/me createdAt numerico', typeof r.body.user.createdAt === 'number');

  r = await api('/auth/me', { method: 'PATCH', token, json: { name: 'Novo Nome', farmName: 'Fazenda Editada' } });
  check('PATCH /me 200', r.status === 200 && r.body.user.name === 'Novo Nome' && r.body.user.farmName === 'Fazenda Editada');
  r = await api('/auth/me', { token });
  check('PATCH /me persistiu', r.body.user.farmName === 'Fazenda Editada');

  console.log('> sectors');
  r = await api('/sectors', { token });
  check('setores: 4 de exemplo', r.status === 200 && r.body.sectors.length === 4);
  const sectorNames: string[] = r.body.sectors.map((s: { name: string }) => s.name);

  console.log('> detections');
  r = await api('/detections', { token });
  check('deteccoes: 3 de exemplo', r.status === 200 && r.body.detections.length === 3);
  check('deteccao tem pest aninhado', !!r.body.detections[0].pest?.name && Array.isArray(r.body.detections[0].pest.affectedAreaRange));
  r = await api('/detections');
  check('deteccoes sem token 401', r.status === 401);

  r = await api('/detections', { method: 'POST', token, form: pngForm() });
  check('scan com foto 201', r.status === 201, JSON.stringify(r.body));
  const det = r.body?.detection;
  check('scan: confianca 60-99', det && det.confidence >= 60 && det.confidence <= 99.01);
  check('scan: setor existente', det && sectorNames.includes(det.sector));
  check('scan: photoUri absoluto', det && /^https?:\/\/.+\/uploads\/.+\.png$/.test(det.photoUri || ''));
  if (det?.photoUri) {
    const img = await fetch(det.photoUri);
    check('foto servida 200 image/png', img.status === 200 && (img.headers.get('content-type') || '').includes('image/png'));
  }
  r = await api('/detections', { method: 'POST', token, form: new FormData() });
  check('scan sem foto 201 (photoUri nulo)', r.status === 201 && r.body.detection.photoUri === null);
  r = await api('/detections', { token });
  check('historico agora 5', r.body.detections.length === 5);
  check('historico: mais recente primeiro', r.body.detections[0].timestamp >= r.body.detections[1].timestamp);

  console.log('> orders');
  r = await api('/orders', { token });
  check('ordens: 3 de exemplo', r.status === 200 && r.body.orders.length === 3);
  r = await api('/orders', { method: 'POST', token, json: { product: 'Fungicida Smoke', sector: 'Setor 4', crop: 'Soja' } });
  check('criar ordem 201 pending', r.status === 201 && r.body.order.status === 'pending');
  const oid: string | undefined = r.body?.order?.id;
  r = await api('/orders', { method: 'POST', token, json: { product: 'Outra', sector: 'Setor 2', crop: 'Milho' } });
  check('criar 2a ordem 201', r.status === 201);
  r = await api('/orders', { method: 'POST', token, json: { product: 'x' } });
  check('criar ordem incompleta 400', r.status === 400);
  const transitions: [string, number][] = [['in_progress', 200], ['completed', 200], ['pending', 200], ['xxx', 400]];
  for (const [st, code] of transitions) {
    r = await api(`/orders/${oid}`, { method: 'PATCH', token, json: { status: st } });
    check(`PATCH ordem -> ${st} (${code})`, r.status === code && (code !== 200 || r.body.order.status === st));
  }
  r = await api('/orders/inexistente', { method: 'PATCH', token, json: { status: 'pending' } });
  check('PATCH ordem inexistente 404', r.status === 404);
  r = await api('/orders', { token });
  check('ordens agora 5', r.body.orders.length === 5);
  const codes: string[] = r.body.orders.map((o: { code: string }) => o.code);
  check('codigos das ordens sao unicos', new Set(codes).size === codes.length, codes.join(','));

  console.log('> fotos de perfil');
  r = await api('/auth/me/avatar', { method: 'POST', token, form: pngForm() });
  check('upload avatar 200', r.status === 200 && /\/uploads\//.test(r.body?.user?.avatarUrl || ''), JSON.stringify(r.body));
  if (r.body?.user?.avatarUrl) {
    const img = await fetch(r.body.user.avatarUrl);
    check('avatar servido 200', img.status === 200);
  }
  r = await api('/auth/me/farm-photo', { method: 'POST', token, form: pngForm() });
  check('upload capa da fazenda 200', r.status === 200 && /\/uploads\//.test(r.body?.user?.farmPhotoUrl || ''));
  r = await api('/auth/me/avatar', { method: 'POST', token, form: new FormData() });
  check('avatar sem arquivo 400', r.status === 400);
  r = await api('/auth/me', { token });
  check('/me devolve avatar e capa apos upload', !!r.body.user.avatarUrl && !!r.body.user.farmPhotoUrl);
  r = await api('/auth/me/avatar', { method: 'POST', form: pngForm() });
  check('avatar sem token 401', r.status === 401);

  console.log('> isolamento entre usuarios');
  r = await api('/auth/register', { method: 'POST', json: { email: email2, password: 'senha1234', farmName: 'Outra' } });
  const token2: string = r.body.token;
  r = await api('/orders', { token: token2 });
  check('usuario 2 nao ve ordem do usuario 1', !r.body.orders.some((o: { id: string }) => o.id === oid) && r.body.orders.length === 3);
  r = await api(`/orders/${oid}`, { method: 'PATCH', token: token2, json: { status: 'completed' } });
  check('usuario 2 nao altera ordem do usuario 1 (404)', r.status === 404);
  r = await api('/detections', { token: token2 });
  check('usuario 2 so ve as 3 deteccoes dele', r.body.detections.length === 3);
  r = await api('/auth/me', { token: token2 });
  check('usuario 2 sem foto do usuario 1', r.body.user.avatarUrl === null);

  console.log('> admin: acesso');
  const adminEmail = `smokeadmin_${stamp}@agroscan.test`;
  r = await api('/auth/register', { method: 'POST', json: { email: adminEmail, password: 'senha1234', farmName: 'Admin Smoke' } });
  check('cadastro devolve role "user"', r.body?.user?.role === 'user');
  promoteToAdmin(adminEmail);
  r = await api('/auth/login', { method: 'POST', json: { email: adminEmail, password: 'senha1234' } });
  const adminToken: string = r.body.token;
  check('login do admin devolve role "admin"', r.body?.user?.role === 'admin');
  r = await api('/admin/overview');
  check('/admin sem token 401', r.status === 401);
  r = await api('/admin/overview', { token });
  check('usuario comum nao acessa /admin (403)', r.status === 403);
  r = await api('/admin/users', { token });
  check('usuario comum nao lista usuarios (403)', r.status === 403);
  r = await api('/admin/pests', { method: 'POST', token, json: {} });
  check('usuario comum nao cria praga (403)', r.status === 403);

  console.log('> admin: painel');
  r = await api('/admin/overview', { token: adminToken });
  check('overview 200', r.status === 200);
  check('overview: usuarios', r.body.users.total >= 4 && r.body.users.admins >= 1 && r.body.users.active + r.body.users.suspended === r.body.users.total);
  check('overview: deteccoes por severidade', typeof r.body.detections.total === 'number' && ['critical', 'moderate', 'low'].every((k) => typeof r.body.detections.bySeverity[k] === 'number'));
  check('overview: 7 dias', r.body.detections.last7Days.length === 7 && typeof r.body.detections.last7Days[6].count === 'number');
  check('overview: ordens e pragas mais frequentes', typeof r.body.orders.pending === 'number' && r.body.topPests.length > 0);

  console.log('> admin: usuarios');
  r = await api(`/admin/users?search=${encodeURIComponent(`smoke${stamp}`)}`, { token: adminToken });
  const me1 = r.body.users.find((u: { email: string }) => u.email === email);
  check('lista de usuarios encontra pela busca', r.status === 200 && !!me1);
  check('usuario traz contagens e nao vaza a senha', me1.detectionCount === 5 && me1.orderCount === 5 && !JSON.stringify(me1).includes('hash') && !JSON.stringify(me1).includes('password'));
  const id1: number = me1.id;
  const meAdmin = (await api('/auth/me', { token: adminToken })).body.user;

  r = await api(`/admin/users/${id1}`, { method: 'PATCH', token: adminToken, json: { active: false } });
  check('suspender usuario 200', r.status === 200 && r.body.user.active === false);
  r = await api('/auth/me', { token });
  check('usuario suspenso perde o acesso na hora (403)', r.status === 403 && /suspensa/i.test(r.body.error));
  r = await api('/auth/login', { method: 'POST', json: { email, password: 'senha1234' } });
  check('usuario suspenso nao consegue entrar (403)', r.status === 403);
  r = await api('/admin/users?status=suspended', { token: adminToken });
  check('filtro de suspensos', r.body.users.some((u: { id: number }) => u.id === id1));
  r = await api(`/admin/users/${id1}`, { method: 'PATCH', token: adminToken, json: { active: true } });
  check('reativar usuario 200', r.status === 200 && r.body.user.active === true);
  r = await api('/auth/me', { token });
  check('usuario reativado volta a acessar', r.status === 200);

  r = await api(`/admin/users/${id1}`, { method: 'PATCH', token: adminToken, json: { role: 'admin' } });
  check('promover a admin 200', r.status === 200 && r.body.user.role === 'admin');
  r = await api('/admin/overview', { token });
  check('promovido passa a acessar /admin (200)', r.status === 200);
  r = await api(`/admin/users/${id1}`, { method: 'PATCH', token: adminToken, json: { role: 'user' } });
  r = await api('/admin/overview', { token });
  check('rebaixado perde o acesso a /admin (403)', r.status === 403);

  r = await api(`/admin/users/${meAdmin.id}`, { method: 'PATCH', token: adminToken, json: { role: 'user' } });
  check('admin nao altera o proprio papel (400)', r.status === 400);
  r = await api(`/admin/users/${meAdmin.id}`, { method: 'PATCH', token: adminToken, json: { active: false } });
  check('admin nao se suspende (400)', r.status === 400);
  r = await api(`/admin/users/${meAdmin.id}`, { method: 'DELETE', token: adminToken });
  check('admin nao se exclui (400)', r.status === 400);
  r = await api(`/admin/users/${id1}`, { method: 'PATCH', token: adminToken, json: { role: 'banana' } });
  check('papel invalido (400)', r.status === 400);
  r = await api(`/admin/users/${id1}`, { method: 'PATCH', token: adminToken, json: {} });
  check('PATCH sem campos (400)', r.status === 400);
  r = await api('/admin/users/999999', { method: 'PATCH', token: adminToken, json: { active: false } });
  check('usuario inexistente (404)', r.status === 404);

  console.log('> admin: ordens');
  r = await api('/admin/orders', { token: adminToken });
  const adminOrder = r.body.orders.find((o: { id: string }) => o.id === oid);
  check('admin ve as ordens de todos (com e-mail do dono)', r.status === 200 && adminOrder?.userEmail === email);
  r = await api(`/admin/orders/${oid}`, { method: 'PATCH', token: adminToken, json: { status: 'completed' } });
  check('admin muda o status de qualquer ordem', r.status === 200 && r.body.order.status === 'completed');
  r = await api(`/admin/orders/${oid}`, { method: 'PATCH', token: adminToken, json: { status: 'xxx' } });
  check('status invalido (400)', r.status === 400);
  r = await api('/admin/orders?status=completed', { token: adminToken });
  check('filtro de ordens por status', r.body.orders.every((o: { status: string }) => o.status === 'completed') && r.body.orders.length > 0);
  r = await api(`/admin/orders/${oid}`, { method: 'DELETE', token: adminToken });
  check('admin apaga uma ordem', r.status === 200);
  r = await api('/orders', { token });
  check('a ordem apagada some para o dono', !r.body.orders.some((o: { id: string }) => o.id === oid));

  console.log('> admin: catalogo de pragas');
  const pestName = `Praga Smoke ${stamp}`;
  const pestBody = { name: pestName, scientificName: 'Smokeus testus', crop: 'Soja', severity: 'moderate', description: 'Praga criada pelo teste.', recommendedAction: 'Nenhuma.', affectedAreaRange: [1, 4] };
  r = await api('/admin/pests', { method: 'POST', token: adminToken, json: pestBody });
  check('criar praga 201', r.status === 201 && r.body.pest.usage === 0);
  const pestId: string = r.body.pest.id;
  r = await api('/admin/pests', { method: 'POST', token: adminToken, json: pestBody });
  check('praga repetida (409)', r.status === 409);
  r = await api('/admin/pests', { method: 'POST', token: adminToken, json: { ...pestBody, name: 'Outra', severity: 'enorme' } });
  check('severidade invalida (400)', r.status === 400);
  r = await api('/admin/pests', { method: 'POST', token: adminToken, json: { ...pestBody, name: 'Outra', affectedAreaRange: [9, 2] } });
  check('faixa de area invertida (400)', r.status === 400);
  r = await api('/admin/pests', { method: 'POST', token: adminToken, json: { ...pestBody, name: 'Outra', crop: 'Banana' } });
  check('cultura invalida (400)', r.status === 400);
  r = await api(`/admin/pests/${pestId}`, { method: 'PATCH', token: adminToken, json: { description: 'Descricao nova.', severity: 'high' } });
  check('severidade invalida no PATCH (400)', r.status === 400);
  r = await api(`/admin/pests/${pestId}`, { method: 'PATCH', token: adminToken, json: { description: 'Descricao nova.', severity: 'critical' } });
  check('editar praga 200', r.status === 200 && r.body.pest.description === 'Descricao nova.' && r.body.pest.severity === 'critical');
  r = await api('/admin/pests', { token: adminToken });
  check('catalogo lista a praga nova', r.body.pests.some((p: { id: string }) => p.id === pestId) && r.body.pests.length >= 7);
  r = await api(`/admin/pests/${det.pest.id}`, { method: 'DELETE', token: adminToken });
  check('nao apaga praga em uso (409)', r.status === 409);
  r = await api(`/admin/pests/${pestId}`, { method: 'DELETE', token: adminToken });
  check('apagar praga sem uso 200', r.status === 200);
  r = await api(`/admin/pests/${pestId}`, { method: 'DELETE', token: adminToken });
  check('apagar de novo (404)', r.status === 404);

  console.log('> admin: auditoria e exclusao de usuario');
  r = await api('/admin/audit', { token: adminToken });
  const actions: string[] = r.body.entries.map((e: { action: string }) => e.action);
  check('auditoria registra as acoes do admin', r.status === 200 && ['user.suspend', 'user.reactivate', 'user.promote', 'user.demote', 'order.status', 'order.delete', 'pest.create', 'pest.update', 'pest.delete'].every((a) => actions.includes(a)));
  check('auditoria mostra quem fez', r.body.entries[0].actorEmail === adminEmail);
  r = await api('/auth/register', { method: 'POST', json: { email: `smoke3_${stamp}@agroscan.test`, password: 'senha1234', farmName: 'Descartavel' } });
  const token3: string = r.body.token;
  const id3: number = r.body.user.id;
  r = await api(`/admin/users/${id3}`, { method: 'DELETE', token: adminToken });
  check('admin exclui um usuario 200', r.status === 200);
  r = await api('/auth/me', { token: token3 });
  check('token do usuario excluido deixa de valer (401)', r.status === 401);
  r = await api(`/admin/users/${id3}`, { method: 'DELETE', token: adminToken });
  check('excluir de novo (404)', r.status === 404);
  r = await api('/admin/audit', { token: adminToken });
  check('exclusao fica na auditoria', r.body.entries.some((e: { action: string }) => e.action === 'user.delete'));
}

(async () => {
  let crashed: unknown = null;
  try {
    await run();
  } catch (e) {
    crashed = e;
  }
  let removed = 0;
  try {
    removed = cleanup();
  } catch (e) {
    console.log('Aviso: não consegui limpar as contas de teste:', (e as Error).message);
  }
  if (crashed) {
    console.error('\nERRO NO TESTE (o servidor está rodando em ' + BASE + '?)', (crashed as Error).message);
    process.exit(2);
  }
  console.log(`\nRESULTADO: ${pass} verificações ok, ${failures.length} falhas  (${removed} contas de teste removidas)`);
  if (failures.length) {
    console.log(failures.join('\n'));
    process.exit(1);
  }
})();
