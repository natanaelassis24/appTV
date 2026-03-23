# App TV React

Projeto React com Vite para uma landing page do App TV Android, tela de ativacao do Android TV e painel administrativo.

## Rodar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Rotas

- `/` landing publica
- `/?tv=1` modo Android TV
- `/admin` painel administrativo

## Painel administrativo

O painel usa:

- `api/admin-login.js`
- `api/admin-accesses.js`
- `lib/admin-auth.js`
- `lib/firebase-admin.js`

Configure estas variaveis:

- `ADMIN_PANEL_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Use a rota `/admin` para entrar no painel. O gerador cria IDs aleatorios no formato `ATA-0000`, `ATA-2547`, `ATA-9081` e assim por diante.

## Firebase

A consulta de ID usa a colecao:

- `access_registry`

Exemplo de documento:

```json
{
  "accessId": "ATV-0001",
  "name": "Cliente Teste",
  "planId": "mensal",
  "planName": "Plano Mensal",
  "status": "active",
  "paymentLabel": "Pago",
  "expiresAt": "2026-04-23"
}
```

## Telegram e download

Configure as variaveis publicas:

- `VITE_TELEGRAM_URL`
- `VITE_APK_DOWNLOAD_URL`

## Vercel

1. Aponte o projeto para a raiz do repositorio.
2. Use build `npm run build`.
3. Mantenha a pasta `api` para as functions.
4. O `vercel.json` ja roteia `/api/*` para as funcoes Node.
