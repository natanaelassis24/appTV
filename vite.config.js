import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function createJsonResponse(res) {
  return {
    status(code) {
      res.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      res.setHeader(name, value);
      return this;
    },
    json(payload) {
      if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }

      const body = payload === null ? 'null' : JSON.stringify(payload);
      res.end(body);
      return this;
    }
  };
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function loadLocalApiHandler(routeName) {
  const filePath = path.resolve(process.cwd(), 'api', `${routeName}.js`);
  const moduleUrl = `${pathToFileURL(filePath).href}?t=${Date.now()}`;
  const module = await import(moduleUrl);

  if (typeof module.default !== 'function') {
    throw new Error(`Rota API invalida: ${routeName}`);
  }

  return module.default;
}

function localApiPlugin() {
  return {
    name: 'local-api-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          next();
          return;
        }

        const requestUrl = new URL(req.url, 'http://localhost');
        const routeName = requestUrl.pathname.slice('/api/'.length).replace(/\/+$/, '');

        if (!routeName) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Rota API nao encontrada.' }));
          return;
        }

        try {
          const handler = await loadLocalApiHandler(routeName);
          req.query = Object.fromEntries(requestUrl.searchParams.entries());
          req.body = req.method === 'GET' || req.method === 'HEAD' ? {} : await readRequestBody(req);

          const response = createJsonResponse(res);
          await handler(req, response);
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              error: error?.message || 'Falha ao executar a API local.'
            })
          );
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const serverEnvKeys = [
    'APP_BASE_URL',
    'URL_BASE_DO_APLICATIVO',
    'FIREBASE_PROJECT_ID',
    'ID_DO_PROJETO_FIREBASE',
    'FIREBASE_CLIENT_EMAIL',
    'E_MAIL_DO_CLIENTE_FIREBASE',
    'E-MAIL_DO_CLIENTE_FIREBASE',
    'FIREBASE_PRIVATE_KEY'
  ];

  for (const key of serverEnvKeys) {
    if (env[key] && !process.env[key]) {
      process.env[key] = env[key];
    }
  }

  return {
    envPrefix: ['VITE_'],
    plugins: [react(), localApiPlugin()]
  };
});
