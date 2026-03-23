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

## Firebase

O sistema de consulta de ID agora usa Firebase Firestore na API:

- `api/access-status.js`
- `api/create-checkout.js`
- `api/webhooks/mercadopago.js`
- `lib/firebase-admin.js`
- `lib/mercadopago.js`
- `lib/plans.js`

Configure estas variaveis na Vercel:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `APP_BASE_URL`
- `MERCADO_PAGO_ACCESS_TOKEN`

Colecao esperada no Firestore:

- `access_registry`

Exemplo de `access_registry`:

```json
{
  "accessId": "ATV-0001",
  "name": "Cliente Teste",
  "planId": "mensal",
  "planName": "Plano Mensal",
  "status": "active",
  "paymentStatus": "paid",
  "paymentLabel": "Pago",
  "expiresAt": "2026-04-23"
}
```

## Mercado Pago

Fluxo implementado:

1. O usuario escolhe um plano no site.
2. A API `api/create-checkout.js` gera uma `checkoutSessionId`.
3. O checkout do Mercado Pago e criado com `external_reference = checkoutSessionId`.
4. Nenhum ID de acesso e gravado no Firestore nesse momento.
5. O webhook `api/webhooks/mercadopago.js` recebe a confirmacao do pagamento.
6. Se aprovado, o sistema gera o `accessId`, grava em `access_registry` e calcula a validade pelo plano.
