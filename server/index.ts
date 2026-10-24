import { createServer } from 'node:http';
import { loadEnv } from './env';
import { createApp } from './app';

loadEnv();

const port = Number(process.env.PORT) || 5173;
const dev = process.env.NODE_ENV !== 'production' && !process.argv.includes('--prod');

const server = createServer();
const app = await createApp({ dev, httpServer: server });
server.on('request', app);

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n  Port ${port} is already in use. Close the other MysticPalm window or set PORT in .env.\n`);
    process.exit(1);
  }
  throw error;
});

server.listen(port, '127.0.0.1', () => {
  const mode = process.env.ANTHROPIC_API_KEY ? 'live readings (Claude vision)' : 'demo readings (no ANTHROPIC_API_KEY set)';
  console.log(`\n  ✦ MysticPalm ready on http://localhost:${port}`);
  console.log(`    ${dev ? 'dev' : 'production'} · ${mode}\n`);
});
