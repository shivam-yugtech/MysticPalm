import { loadEnv } from './env';
import { createApp } from './app';

loadEnv();

const port = Number(process.env.PORT) || 5173;
const dev = process.env.NODE_ENV !== 'production';

const app = await createApp({ dev });

app.listen(port, '127.0.0.1', () => {
  const mode = process.env.ANTHROPIC_API_KEY ? 'live readings (Claude vision)' : 'demo readings (no ANTHROPIC_API_KEY set)';
  console.log(`\n  ✦ MysticPalm ready on http://localhost:${port}`);
  console.log(`    ${dev ? 'dev' : 'production'} · ${mode}\n`);
});
