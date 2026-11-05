# AgroScan: site de apresentação (pitch)

Site estático (HTML, CSS e JavaScript puros, sem build) para a apresentação da disciplina de startup. Explica o problema, a solução, as telas do app, a equipe e o contato, e termina com o **QR Code** que abre o protótipo.

## Como ver

Opção mais simples: abra `website/index.html` no navegador (duplo clique).

Ou com um servidor local, a partir da raiz do repositório:

```bash
python -m http.server 5500 --directory website
```

e acesse http://localhost:5500.

## O que editar (tudo em `config.js`)

| Campo | Para quê |
|---|---|
| `slogan` | Frase da marca (topo, rodapé e título da aba) |
| `appUrl` | Endereço que o QR Code abre (o app na web ou o link de download) |
| `team` | Nomes, funções e fotos da equipe (`photo` opcional) |
| `contact` | E-mail, WhatsApp, Instagram e LinkedIn (deixe vazio o que não quiser mostrar) |
| `repoUrl` | Link do código no rodapé |

**No dia do pitch:** se o endereço do app mudar (por exemplo, um túnel novo), não precisa editar nada: abra o site com `?app=` e o endereço no final, por exemplo `index.html?app=https://meu-endereco.exemplo.com`. O QR Code é refeito na hora.

## Imagens

- `assets/phone-*.png`: telas do app em moldura de celular (ilustrações com dados de demonstração).
- `assets/logo.svg`: marca do site.
- Fotos da equipe: coloque em `assets/team/` e aponte em `config.js`.

## Publicado em

**https://nickznn.github.io/AgroScan/** (GitHub Pages, a partir da branch `gh-pages`).

## Atualizar o site publicado

Na raiz do repositório:

```bash
npm run site:deploy
```

O comando gera a versão web do app (`frontend/`), junta com esta pasta e publica na branch `gh-pages` (site em `/` e app em `/app/`). A página atualiza em cerca de 1 minuto. Tudo o que está em `website/` fica público, inclusive nomes e e-mail do `config.js`.

## Dia da apresentação (QR Code do app)

O app web precisa de uma API acessível pela internet. Na raiz do repositório:

```bash
npm run demo
```

O comando sobe a API em modo público (banco separado `backend/data/demo.db`, sem a conta de admin de demonstração, com limite de tentativas de login), abre um túnel HTTPS gratuito e mostra (e copia) o link do site já com o QR Code apontando para o app. Mantenha a janela aberta durante a apresentação: o endereço do túnel muda a cada execução e, se a janela fechar, o app para.

## Créditos

QR Code gerado com a biblioteca [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT), incluída em `vendor/`.
