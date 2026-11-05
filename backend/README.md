# AgroScan: backend (API)

API do AgroScan: **Node + Express 5 + SQLite (`better-sqlite3`)**, escrita em **TypeScript** e executada com o `tsx` (sem etapa de build). Guarda usuários, detecções, setores, ordens de serviço e as fotos enviadas pelo app da pasta [`../frontend`](../frontend).

## Como rodar

Pela **raiz do repositório**, sobe a API e o app juntos:

```bash
npm run dev
```

Só a API (porta 4000):

```bash
npm run api
```

Ou, dentro desta pasta:

```bash
cd backend
npm install
npm start
```

O banco é um arquivo local (`data/agroscan.db`, fora do git) e as fotos ficam em `uploads/`. Variáveis opcionais: `PORT` (padrão 4000), `DB_PATH` (outro arquivo de banco), `JWT_SECRET` (chave do token; em produção, defina uma chave longa e secreta), `AGROSCAN_PUBLIC=1` (modo apresentação: confia no proxy do túnel e limita tentativas de login e envio de fotos; o `npm run demo` da raiz já liga isso).

## Comandos desta pasta

| Comando | O que faz |
|---|---|
| `npm start` | sobe a API |
| `npm run dev` | sobe a API reiniciando quando um arquivo muda |
| `npm run db` | mostra o banco em tabelas (somente leitura) |
| `npm run smoke` | teste automático da API (precisa da API ligada) |
| `npm run admin:create` | cria (ou promove) uma conta de administrador |
| `npm run typecheck` | confere os tipos TypeScript |

## Estrutura

```
src/
  index.ts          Setup do Express (CORS, JSON, /uploads, rotas, erros)
  db.ts             Conexão SQLite, esquema das tabelas e migração leve
  seed.ts           Catálogo de pragas e dados de exemplo para usuários novos
  types.ts          Formato das linhas do banco
  upload.ts         multer (fotos, limite de 8 MB) e URL absoluta das fotos
  middleware/auth.ts  Verifica o token JWT e coloca o id do usuário em req.userId
  adminSetup.ts     Conta de administrador de demonstração (só em desenvolvimento)
  audit.ts          Registro das ações dos administradores
  routes/           auth, detections, orders, sectors, admin
scripts/
  create-admin.ts   Cria ou promove um administrador
  inspect-db.ts     Mostra o banco
  smoke.ts          Teste de ponta a ponta da API
```

## Rotas principais

`GET /health` · `POST /auth/register` · `POST /auth/login` · `GET/PATCH /auth/me` · `POST /auth/me/avatar` · `POST /auth/me/farm-photo` · `GET/POST /detections` (o POST aceita `latitude` e `longitude`, enviados juntos, do GPS do aparelho) · `GET/POST/PATCH /orders` · `GET /sectors`. As rotas, exceto `/health`, `/auth/register` e `/auth/login`, exigem o cabeçalho `Authorization: Bearer <token>`.

### Área do administrador

Rotas sob `/admin`, só para quem tem o papel `admin` (as demais contas recebem 403):

`GET /admin/overview` · `GET/PATCH/DELETE /admin/users` (buscar, promover, suspender, excluir) · `GET/PATCH/DELETE /admin/orders` · `GET/POST/PATCH/DELETE /admin/pests` (catálogo de pragas; uma praga em uso não pode ser excluída) · `GET /admin/audit`.

Um administrador não pode alterar, suspender nem excluir a si mesmo. Em desenvolvimento a API cria a conta `admin@agroscan.com` / `Admin@1234` na primeira subida; em produção defina `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
