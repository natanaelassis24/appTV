import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function devApiBridge() {
  return {
    name: 'dev-api-bridge',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost');

        if (url.pathname !== '/api/create-checkout' && url.pathname !== '/api/access-status') {
          next();
          return;
        }

        const body = await new Promise(resolve => {
          const chunks = [];
          req.on('data', chunk => chunks.push(chunk));
          req.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            if (!raw) {
              resolve(null);
              return;
            }

            try {
              resolve(JSON.parse(raw));
            } catch (_) {
              resolve(raw);
            }
          });
          req.on('error', () => resolve(null));
        });

        req.query = Object.fromEntries(url.searchParams.entries());
        req.body = body;
        req.path = url.pathname;
        res.status = code => {
          res.statusCode = code;
          return res;
        };
        res.json = payload => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(payload));
          return res;
        };

        const handler =
          url.pathname === '/api/create-checkout'
            ? (await import('./api/create-checkout.js')).default
            : (await import('./api/access-status.js')).default;

        await handler(req, res);
      });
    }
  };
}

export default defineConfig({
  envPrefix: ['VITE_', 'MERCADO_PAGO_'],
  plugins: [react(), devApiBridge()]
});
