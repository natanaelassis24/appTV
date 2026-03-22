# App TV React

Projeto React com Vite pronto para deploy na Vercel.

## Rodar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy na Vercel

1. Importe a pasta do projeto na Vercel.
2. A Vercel deve detectar `Vite` automaticamente.
3. Use o comando de build `npm run build`.
4. O diretório de saida e `dist`.

## Estrutura

- `src/App.jsx`: interface principal
- `src/channels.js`: lista de canais
- `src/styles.css`: estilos
- `verify-m3u.js`: verificador local de playlists M3U
