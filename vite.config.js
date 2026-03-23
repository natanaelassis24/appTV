import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  envPrefix: ['VITE_', 'MERCADO_PAGO_'],
  plugins: [react()]
});
