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

**https://nickznn.github.io/AgroScan/** (GitHub Pages, a partir da branch `gh-pages`, que contém só esta pasta).

## Atualizar o site publicado

Depois de editar algo em `website/`, na raiz do repositório:

```bash
git add website
git commit -m "Update the website"
git push origin master
git subtree push --prefix website origin gh-pages
```

A página atualiza em cerca de um minuto. Tudo o que está em `website/` fica público, inclusive nomes e e-mail do `config.js`.

## Créditos

QR Code gerado com a biblioteca [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT), incluída em `vendor/`.
