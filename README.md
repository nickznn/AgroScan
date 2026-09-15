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

## Como rodar

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Isso sobe a API em `http://0.0.0.0:4000` (todas as interfaces de rede) e cria/popula o banco (`backend/data/agroscan.db`) na primeira execução.

### 2. App

```bash
npm install
npx expo start
```

Escaneie o QR code com o app **Expo Go** (Android/iOS), com o celular na mesma rede Wi-Fi do computador que está rodando o backend.

Por padrão o app tenta falar com `http://192.168.0.73:4000` (IP da máquina de desenvolvimento). **Se o IP mudar** (outra rede Wi-Fi, ex: na faculdade), abra o app → **Mais → Configurações → Servidor**, digite o novo endereço (ex: `http://<seu-ip-local>:4000`) e toque em "Testar e Salvar" — não precisa reinstalar nada.

### Rodando na faculdade (Wi-Fi bloqueando celular ↔ notebook)

Se o Wi-Fi da faculdade isolar os dispositivos (comum em rede institucional), o app em si ainda abre via **tunnel** do Expo, mas isso só entrega o código JS — as chamadas para a API (login, scanner, etc.) continuam precisando que o celular alcance o IP do notebook. O jeito mais simples de garantir isso é criar um **hotspot no próprio celular e conectar o notebook nele** (assim os dois ficam na mesma rede de verdade). Feito isso:

```bash
cd backend && npm run dev      # um terminal
npx expo start                  # outro terminal, na raiz do projeto
```

Se preferir usar o tunnel do Expo mesmo assim (só resolve o carregamento do app, não a API):

```bash
npm install @expo/ngrok@^4.1.0 --save-dev   # só na primeira vez
npx expo start --tunnel
```

Nas próximas vezes, sem precisar reinstalar nada:

```bash
npx expo start --tunnel
```

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
