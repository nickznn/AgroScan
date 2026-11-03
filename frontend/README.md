# AgroScan: frontend (aplicativo)

Aplicativo de celular do AgroScan, feito com **Expo SDK 58**, **React Native 0.88** e **TypeScript**. Ele conversa com a API da pasta [`../backend`](../backend) por HTTP (axios).

## Como rodar

O jeito mais simples é pela **raiz do repositório**, que sobe o backend e o app juntos:

```bash
npm run dev
```

Para rodar **só o app** (com a API já ligada em outro terminal), dentro desta pasta:

```bash
cd frontend
npm install
npm start
```

Escaneie o QR Code com o **Expo Go** atualizado (versão do SDK 58). O app descobre sozinho o IP da API a partir do endereço do Expo; também dá para corrigi-lo na tela de login ("Servidor: … Alterar").

## Comandos desta pasta

| Comando | O que faz |
|---|---|
| `npm start` | inicia o Expo (QR Code) |
| `npm run web` | abre a versão web (útil para conferir telas; câmera, GPS e o mapa de satélite só no celular, com o Expo Go) |
| `npm run typecheck` | confere os tipos TypeScript |

Os testes das regras e a verificação da arquitetura rodam pela raiz: `npm test` e `npm run check:arch`.

## Arquitetura: MVVM por funcionalidade

```
src/
  features/<nome>/
    view/         Telas: só desenham e repassam toques
    viewmodel/    Um hook por tela: estado, validação e ações
    model/        Regras de negócio puras (com testes *.test.ts ao lado)
  shared/         Tipos, serviços (axios, câmera), estado, componentes, tema
  navigation/     Abas e pilhas que montam as Views
```

Funcionalidades: `auth`, `dashboard`, `scanner`, `reports`, `map`, `farm`, `orders`, `profile`, `settings`, `more`.

Regras (conferidas por `npm run check:arch`, na raiz): a View não importa serviços nem o estado global; o ViewModel não importa `react-native` nem navegação; o Model é TypeScript puro; **uma funcionalidade nunca importa outra** (o que é comum fica em `shared/`).

## Fronteira com o backend

Todo acesso à API passa por `src/shared/services/client.ts`. Esse arquivo é o **único** que conhece o endereço do servidor, o token e o formato das respostas. O frontend não importa nada do backend.
