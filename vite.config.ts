import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `npm run dev` serves this through Express (server/index.ts) in middleware mode,
// so the SPA and /api share one origin in development and production.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: '127.0.0.1' },
  build: { outDir: 'dist' },
});
