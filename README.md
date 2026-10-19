# AgroScan Intelligence

Aplicativo mobile do projeto **AgroPragas IA** — detecção precoce de pragas e doenças agrícolas via visão computacional embarcada em smartphones, com foco em uso offline no campo.

> Projeto acadêmico (Startup + Desenvolvimento Mobile) — Equipe: Alan, Áquila, Arthur e Nícolas.

## Sobre

O AgroScan transforma o smartphone do produtor rural em um sensor inteligente: ele tira uma foto da planta, a IA identifica pragas/doenças, e o app organiza os resultados em relatórios, mapa de calor georreferenciado e ordens de serviço para aplicação localizada de defensivos.

O app (`/`) é um cliente React Native/Expo que fala com uma **API própria** (`/backend`) via HTTP — autenticação, histórico de detecções, setores e ordens de serviço são todos persistidos em um banco SQLite no servidor. A análise de IA em si ainda é **simulada no backend** (sorteia uma praga de um catálogo) — o objetivo atual é validar a experiência completa (app + API + persistência real), não o modelo de visão computacional.

## Funcionalidades

- **Login/Cadastro** — autenticação real (JWT) contra a API, senha com hash (bcrypt)
- **Dashboard** — saúde geral da lavoura (calculada a partir dos setores reais) e atalho para o scanner
- **Scanner** — captura foto (câmera ou galeria), envia para a API e recebe o resultado da "análise"
- **Relatório de Praga** — severidade, confiança da IA, ação recomendada
- **Histórico** — busca e filtro de detecções anteriores por severidade
- **Mapa de Focos** — visualização de calor das ocorrências na lavoura
- **Fazenda** — setores monitorados e health score
- **Ordens de Serviço** — criar e acompanhar aplicações (pendente ⇄ em andamento ⇄ concluída, status editável nos dois sentidos)
- **Configurações** — sincronizar (refaz o fetch de todos os dados) e trocar o endereço do servidor sem precisar reinstalar o app

## Tecnologias

**App**
- [Expo](https://expo.dev) + React Native + TypeScript
- React Navigation (bottom tabs + native stack)
- `expo-camera` / `expo-image-picker`
- `@react-native-async-storage/async-storage` (cache do token de sessão e do endereço da API)
- Design system próprio (cores, tipografia Hanken Grotesk / Public Sans / JetBrains Mono) baseado no protótipo do Google Stitch

**Backend** (`/backend`)
- Node.js + Express
- SQLite (via `better-sqlite3`) — sem serviço externo, o banco é um arquivo local
- Autenticação JWT + senha com hash (`bcryptjs`)
- Upload de fotos (`multer`), servidas estaticamente em `/uploads`

## Como rodar (passo a passo para qualquer computador)

> Serve para o PC da faculdade, para a casa dos colegas e para o seu. O app roda no **celular** (Expo Go) e o
> **backend** roda no computador; o comando abaixo sobe os dois juntos.

### 1. Antes de tudo: instale o Node (só na primeira vez)

Baixe o **Node 22 LTS** em https://nodejs.org (botão "LTS") e instale com tudo no padrão. Depois **feche o VS Code por
completo e abra de novo** e confira no terminal:

```bash
node -v
```

O número precisa ser **20.19.4 ou maior, 22.13 ou maior, ou 24.3 ou maior**. Versões como 18, 20.10 ou 22.5 **não funcionam**
(o Expo quebra com um erro enorme e sem sentido, como `configs.toReversed is not a function`).
Instale também o **Expo Go** no celular (Play Store / App Store).

### 2. Baixe o projeto

```bash
git clone https://github.com/nickznn/AgroScan.git
cd AgroScan
```

(sem git: no GitHub, **Code → Download ZIP**, extraia e abra a pasta no VS Code. Prefira um caminho curto, como `C:\projetos\AgroScan`, e
**fora do OneDrive**.)

### 3. Rode (um comando só)

```bash
npm run dev
```

Na primeira vez ele instala tudo sozinho (alguns minutos, precisa de internet), confere o ambiente, sobe o **backend** e o **Expo**
e mostra o **QR Code**. Escaneie com o **Expo Go**. Na tela de login do app deve aparecer **"Servidor conectado"** (bolinha verde).
Crie uma conta e use. Para parar tudo: `Ctrl+C`.

### Se algo não funcionar

Rode o diagnóstico e mande o resultado (print) no grupo:

```bash
npm run doctor
```

| O que aparece | Causa | Solução |
|---|---|---|
| `Node ... não serve para este projeto` | Node antigo | Instale o Node 22 LTS (passo 1), feche e reabra o VS Code, `npm run setup -- --clean` |
| `configs.toReversed is not a function` | Node 18 (ou antigo) rodando o Expo direto | Mesma coisa acima. Use `npm run dev`, que avisa em português |
| `gyp ERR! find VS` / `Could not find any Visual Studio` | O SQLite tentou compilar porque o Node é muito antigo/novo | Node 20.19.4+, 22.13+ ou 24.3+ (passo 1). O projeto fixa o `better-sqlite3@12.9.0`, que tem binário pronto para essas versões |
| `NODE_MODULE_VERSION ... was compiled against a different Node` | As dependências foram instaladas com outro Node | `npm run setup -- --clean` (o `npm run dev` já tenta consertar sozinho) |
| `A porta 4000 está ocupada` | Outro terminal antigo com o backend aberto | Feche-o (ou mande o comando que o aviso mostra) |
| Login: **"Sem resposta do servidor"** (bolinha vermelha) | O celular não alcança o computador | Os dois precisam estar na **mesma rede Wi-Fi**. Se não resolver, veja "Rodando na faculdade" abaixo |
| O QR Code abre, mas com o IP errado | O computador tem várias redes (VPN, VirtualBox, WSL...) | `npm run dev -- --ip=192.168.x.x` (o IP do Wi-Fi; `ipconfig` mostra) |
| O Windows perguntou sobre o Firewall (ou o celular não conecta e o Firewall é suspeito) | Primeira vez que o Node abre uma porta; o Windows só marca "redes privadas" por padrão, e Wi-Fi de casa/faculdade/hotspot costuma ser tratado como "pública" | Clique em **Permitir acesso** marcando **privadas e públicas**. Já negou ou marcou só uma? Rode `npm run doctor`: ele confere o Firewall e mostra o comando exato (PowerShell como administrador) para liberar |
| `EPERM` / `EBUSY` durante a instalação | Pasta dentro do OneDrive/antivírus travando arquivos | Mova o projeto para `C:\projetos\AgroScan` e rode `npm run setup -- --clean` |
| Expo Go: "incompatible SDK version" | Expo Go desatualizado | Atualize o Expo Go na loja de aplicativos |

### Rodando na faculdade (a rede costuma bloquear celular ↔ computador)

Redes de faculdade geralmente **isolam os aparelhos**: o celular e o computador estão no mesmo Wi-Fi, mas não conseguem se falar. Nesse caso
o celular nem abre o app, ou abre e o login mostra "Sem resposta do servidor". O modo `--tunnel` do Expo **não resolve**: ele entrega só
o código do app, e o backend (login, fotos, ordens) continua inalcançável.

**Solução que funciona:** use o **hotspot do celular**.

1. No celular, ligue o **hotspot / roteador Wi-Fi** (Configurações → Conexões → Roteador Wi-Fi). Não gasta o plano de dados: o tráfego entre os dois aparelhos é local.
2. Conecte o **computador** nessa rede do celular.
3. No computador: `npm run dev` e escaneie o QR Code com o Expo Go (no mesmo celular).
4. No login deve aparecer "Servidor conectado". Se o IP estiver errado: `npm run dev -- --ip=IP_DO_COMPUTADOR`.

Faça esse teste **antes** da apresentação, na própria sala.

### Outros comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | sobe backend + app juntos (o principal) |
| `npm run api` | sobe só o backend |
| `npm run setup` | instala e confere o ambiente (`-- --clean` apaga e reinstala tudo) |
| `npm run doctor` | diagnóstico do computador, para mandar no grupo |
| `cd backend && npm run db` | mostra o banco de dados em tabelas (somente leitura) |
| `cd backend && npm run smoke` | teste automático da API (51 verificações; precisa do backend ligado) |

**Endereço do servidor:** o app descobre sozinho o IP do computador (o mesmo de onde o Expo Go baixa o código) e usa a porta 4000.
Dá para ver e corrigir na **tela de login** ("Servidor: … Alterar") e em **Mais → Configurações → Servidor**.

**Por que o `better-sqlite3` está fixado em `12.9.0`:** é a última versão que publica binário pronto (sem compilar) para Node 20, 22, 24 e 25
em Windows, Mac e Linux. A `12.10.0` em diante parou de publicar para o Node 20, e aí o `npm install` tenta compilar C++ e falha em quem não
tem o Visual Studio.

## Estrutura do projeto

```
src/
  api/          Cliente HTTP (fetch) que fala com o backend
  components/   Botões, cards, badges reutilizáveis
  context/      Estado global (auth, histórico, ordens, setores) alimentado pela API
  data/         Dados estáticos que não vêm do backend (perfil da fazenda)
  navigation/   Bottom tabs + stacks
  screens/      Telas do app
  theme/        Cores, tipografia e espaçamento
  types/        Tipos TypeScript compartilhados

backend/
  src/
    db.js           Conexão SQLite + schema das tabelas
    seed.js          Catálogo de pragas e dados de exemplo para novos usuários
    middleware/auth.js  Middleware de verificação do JWT
    routes/          Rotas: auth, detections, orders, sectors
    index.js         Setup do Express
```
