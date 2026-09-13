import { defineConfig, type Plugin, type Connect } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const paceRoot = fileURLToPath(new URL('../PACE', import.meta.url));

function paceMime(file: string) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.svg')) return 'image/svg+xml';
  if (file.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

function servePacePlugin(): Plugin {
  return {
    name: 'serve-pace',
    configureServer(server) {
      server.middlewares.use(async (req: Connect.IncomingMessage, res, next) => {
        const raw = (req.url || '').split('?')[0];
        if (!raw.startsWith('/PACE')) return next();
        let rel = decodeURIComponent(raw.replace(/^\/PACE\/?/, ''));
        if (!rel || rel.endsWith('/')) rel += 'list.html';
        const file = path.resolve(paceRoot, rel);
        const root = path.resolve(paceRoot);
        if (!file.toLowerCase().startsWith(root.toLowerCase()) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return next();
        res.setHeader('Content-Type', paceMime(file));
        await pipeline(fs.createReadStream(file), res);
      });
    },
    closeBundle() {
      const out = fileURLToPath(new URL('./dist/PACE', import.meta.url));
      fs.cpSync(paceRoot, out, { recursive: true });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), servePacePlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
