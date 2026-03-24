# App TV React

Projeto React com Vite para a landing publica, a tela de ativacao da Android TV e o painel administrativo.

## Build

```bash
npm run build
```

## Rotas

- `/` landing publica
- `/?tv=1` modo Android TV
- `/admin` painel administrativo

## Admin

O admin usa Firebase Auth com email e senha.

Fluxo:

1. Ao abrir `/admin`, o app mostra apenas a tela de login.
2. O acesso administrativo usa Firebase Auth e a sessao local no navegador.
3. A conta do admin precisa existir antes no Firebase Authentication.

Rotas de apoio:

- `api/admin-status.js`
- `api/admin-bootstrap.js`
- `api/admin-accesses.js`
- `api/admin-generate-access.js`

Configure estas variaveis:

- `APP_FIREBASE_WEB_API_KEY`
- `APP_FIREBASE_PROJECT_ID`
- `APP_FIREBASE_CLIENT_EMAIL`
- `APP_FIREBASE_PRIVATE_KEY`

O valor de `APP_FIREBASE_WEB_API_KEY` vem do app Web do Firebase, no campo `apiKey`.

Use as variaveis no painel da Vercel para producao. O arquivo `.env.local` na raiz do projeto serve apenas para o ambiente de desenvolvimento da sua maquina.

Exemplo de acesso admin no Firebase:

- crie o admin diretamente no Firebase Authentication
- depois: entre com o mesmo email e senha

## Firebase

A consulta de ID usa a colecao:

- `access_registry`

Exemplo de documento:

```json
{
  "accessId": "ATA-2547",
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

- `APP_TELEGRAM_URL`
- `APP_APK_DOWNLOAD_URL`

## Vercel

1. Aponte o projeto para a raiz do repositorio.
2. Use build `npm run build`.
3. Mantenha a pasta `api` para as functions.
4. Garanta as variaveis `APP_FIREBASE_WEB_API_KEY`, `APP_FIREBASE_PROJECT_ID`, `APP_FIREBASE_CLIENT_EMAIL` e `APP_FIREBASE_PRIVATE_KEY` no projeto da Vercel.
5. O `vercel.json` ja roteia `/api/*` para as funcoes Node.
