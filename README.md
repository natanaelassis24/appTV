# App TV React

Projeto React com Vite para a landing publica, a tela de ativacao da Android TV e o painel administrativo.

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

## Admin

O admin usa Firebase Auth com email e senha.

Fluxo:

1. Ao abrir `/admin`, o app consulta `/api/admin-status`.
2. Se o painel ainda nao existir, aparece a tela de registro inicial com email e senha.
3. Depois do primeiro cadastro, o registro some e fica apenas a tela de login.
4. O acesso administrativo usa Firebase Auth e a sessao local no navegador.

Rotas de apoio:

- `api/admin-status.js`
- `api/admin-bootstrap.js`
- `api/admin-accesses.js`
- `api/admin-generate-access.js`

Configure estas variaveis:

- `VITE_FIREBASE_WEB_API_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Exemplo de acesso admin no Firebase:

- primeira vez: crie o admin com email e senha
- depois: entre com o mesmo email e senha
- o registro inicial desaparece quando o painel e criado

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

- `VITE_TELEGRAM_URL`
- `VITE_APK_DOWNLOAD_URL`

## Vercel

1. Aponte o projeto para a raiz do repositorio.
2. Use build `npm run build`.
3. Mantenha a pasta `api` para as functions.
4. O `vercel.json` ja roteia `/api/*` para as funcoes Node.
