# AgroScan Intelligence

Aplicativo mobile do projeto **AgroPragas IA** — detecção precoce de pragas e doenças agrícolas via visão computacional embarcada em smartphones, com foco em uso offline no campo.

> Projeto acadêmico (Startup + Desenvolvimento Mobile) — Equipe: Alan, Áquila, Arthur e Nícolas.

## Sobre

O AgroScan transforma o smartphone do produtor rural em um sensor inteligente: ele tira uma foto da planta, a IA identifica pragas/doenças, e o app organiza os resultados em relatórios, mapa de calor georreferenciado e ordens de serviço para aplicação localizada de defensivos.

Nesta versão, a detecção por IA é **simulada localmente** (não há backend nem modelo real embarcado) — o foco é validar a experiência completa do app: navegação, câmera, histórico e fluxo de decisão do produtor.

## Funcionalidades

- **Login/Cadastro** — autenticação mockada, dados salvos apenas no dispositivo
- **Dashboard** — saúde geral da lavoura e atalho para o scanner
- **Scanner** — captura foto (câmera ou galeria) e simula análise por IA
- **Relatório de Praga** — severidade, confiança da IA, ação recomendada
- **Histórico** — busca e filtro de detecções anteriores por severidade
- **Mapa de Focos** — visualização de calor das ocorrências na lavoura
- **Fazenda** — setores monitorados e health score
- **Ordens de Serviço** — acompanhamento de aplicações (pendente → em andamento → concluída)
- **Configurações** — sincronização em nuvem e mapas offline

## Tecnologias

- [Expo](https://expo.dev) + React Native + TypeScript
- React Navigation (bottom tabs + native stack)
- `expo-camera` / `expo-image-picker`
- `@react-native-async-storage/async-storage` para persistência local
- Design system próprio (cores, tipografia Hanken Grotesk / Public Sans / JetBrains Mono) baseado no protótipo do Google Stitch

## Como rodar

```bash
npm install
npx expo start
```

Escaneie o QR code com o app **Expo Go** (Android/iOS), com o celular na mesma rede Wi-Fi do computador.

## Estrutura do projeto

```
src/
  components/   Botões, cards, badges reutilizáveis
  context/      Estado global (auth, histórico, ordens, sync)
  data/         Dados mockados (pragas, setores, ordens)
  navigation/   Bottom tabs + stacks
  screens/      Telas do app
  theme/        Cores, tipografia e espaçamento
  types/        Tipos TypeScript compartilhados
```
