import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Built assets land in ../dist/web, which src/web/app.ts serves as static files.
// In dev, `npm run dev` proxies /api to the Node app so the two run side by side.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: { outDir: '../dist/web', emptyOutDir: true },
  server: {
    port: 5273,
    proxy: {
      '/api': 'http://localhost:1999',
      '/d': 'http://localhost:1999',
    },
  },
});
