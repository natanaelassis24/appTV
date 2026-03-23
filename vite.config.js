import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  envPrefix: ['VITE_'],
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://app-tv-psi.vercel.app',
        changeOrigin: true,
        secure: true
      }
    }
  }
});
