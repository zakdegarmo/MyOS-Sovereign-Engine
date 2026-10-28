import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'

const devServers = new Map();
let nextPort = 5200;

function appletDevServerPlugin() {
  return {
    name: 'applet-dev-server',
    configureServer(server: any) {
      server.middlewares.use('/__boot', (req: any, res: any) => {
        try {
          const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
          const appParam = url.searchParams.get('app');
          if (!appParam) {
            res.statusCode = 400;
            return res.end();
          }

          if (devServers.has(appParam)) {
            const existing = devServers.get(appParam);
            if (existing.ready) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ port: existing.port }));
            }
            // If it's already booting but not ready, we can't easily attach multiple listeners in this simple script
            // For now, assume if it exists, it's either ready or almost ready, but it's safer to just return it...
            // Actually, we should just let it boot.
          }

          const port = nextPort++;
          const cwd = path.resolve(__dirname, 'public/integrations/integrations', appParam);
          const hasNodeModules = fs.existsSync(path.join(cwd, 'node_modules'));
          
          // SPEED OPTIMIZATION: Only install if missing. Use --prefer-offline for speed.
          const installCmd = hasNodeModules ? 'echo skipping_install' : 'npm install --no-audit --no-fund --prefer-offline';
          const proc = spawn('cmd.exe', ['/c', `${installCmd} && npm run dev -- --port ${port} --strictPort`], { cwd });
          
          let isReady = false;

          proc.stdout.on('data', (d) => {
            const out = d.toString();
            // console.log(`[${appParam}] ${out}`); // Suppress noisy logs during boot
            if (out.includes('Local:') || out.includes('localhost:')) {
                isReady = true;
                devServers.set(appParam, { port, proc, ready: true });
                if (!res.headersSent) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ port }));
                }
            }
          });

          proc.stderr.on('data', (d) => {
            const out = d.toString();
            if (!out.includes('npm WARN')) console.error(`[${appParam}] ${out}`);
          });

          proc.on('close', () => devServers.delete(appParam));

          // Set initial unready state
          devServers.set(appParam, { port, proc, ready: false });

          // Safety timeout in case Vite never prints 'Local:'
          setTimeout(() => {
              if (!isReady && !res.headersSent) {
                  isReady = true;
                  devServers.set(appParam, { port, proc, ready: true });
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ port }));
              }
          }, 30000); // reduced to 30 second fallback

        } catch (e) {
            console.error('Applet DevServer Boot Error', e);
            if (!res.headersSent) {
                res.statusCode = 500;
                res.end();
            }
        }
      });
    }
  }
}

function screeningsPlugin() {
  return {
    name: 'screenings-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/screenings/save', (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end('Method Not Allowed');
        }

        try {
          const screeningsDir = path.resolve(__dirname, 'public/screenings');
          if (!fs.existsSync(screeningsDir)) {
            fs.mkdirSync(screeningsDir, { recursive: true });
          }

          const customName = req.headers['x-filename'] || '';
          const ext = customName && customName.endsWith('.mp4') ? '.mp4' : '.webm';
          const cleanName = customName
            ? customName.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/\.[^/.]+$/, '') + ext
            : `take_filmset_${new Date().toISOString().replace(/[:.]/g, '-')}${ext}`;

          const targetPath = path.join(screeningsDir, cleanName);
          const writeStream = fs.createWriteStream(targetPath);

          req.pipe(writeStream);

          writeStream.on('finish', () => {
            const stat = fs.statSync(targetPath);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              filename: cleanName,
              url: `/screenings/${cleanName}`,
              sizeBytes: stat.size
            }));
          });

          writeStream.on('error', (err: any) => {
            console.error('[ScreeningsPlugin] File write error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          });
        } catch (e: any) {
          console.error('[ScreeningsPlugin] Save error:', e);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });

      server.middlewares.use('/api/screenings', (_req: any, res: any) => {
        try {
          const screeningsDir = path.resolve(__dirname, 'public/screenings');
          if (!fs.existsSync(screeningsDir)) {
            fs.mkdirSync(screeningsDir, { recursive: true });
          }
          const files = fs.readdirSync(screeningsDir);
          const videoFiles = files.filter(f => /\.(mp4|webm|mov|mkv)$/i.test(f));
          const screenings = videoFiles.map(filename => {
            try {
              const stat = fs.statSync(path.join(screeningsDir, filename));
              return {
                id: filename,
                filename,
                title: filename.replace(/_/g, ' ').replace(/\.[^/.]+$/, '').toUpperCase(),
                url: `/screenings/${filename}`,
                sizeBytes: stat.size,
                mtime: stat.mtime
              };
            } catch {
              return { id: filename, filename, title: filename, url: `/screenings/${filename}` };
            }
          });
          screenings.sort((a, b) => new Date(b.mtime || 0).getTime() - new Date(a.mtime || 0).getTime());
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, screenings }));
        } catch (e: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), appletDevServerPlugin(), screeningsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@Self': path.resolve(__dirname, './src/Self'),
      '@Thought': path.resolve(__dirname, './src/Thought'),
      '@Logic': path.resolve(__dirname, './src/Logic'),
      '@Unity': path.resolve(__dirname, './src/Unity'),
      '@Existence': path.resolve(__dirname, './src/Existence'),
      '@Improvement': path.resolve(__dirname, './src/Improvement'),
      '@Mastery': path.resolve(__dirname, './src/Mastery'),
      '@Resonance': path.resolve(__dirname, './src/Resonance'),
      '@Transcendence': path.resolve(__dirname, './src/Transcendence'),
      '@Omni': path.resolve(__dirname, './src/Omni'),
      '@Omni/types': path.resolve(__dirname, './src/Omni/types.ts'),
      '@Omni/constants': path.resolve(__dirname, './src/Omni/constants.ts'),
      '@b-movie-beatdown': path.resolve(__dirname, '../../packages/b-movie-beatdown'),
      '@neon-nightmare': path.resolve(__dirname, '../../packages/b-movie-beatdown'),
    },
  },
  optimizeDeps: {
    include: [
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'lucide-react',
      'd3',
      '@orama/orama'
    ]
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    watch: {
      ignored: [
        '**/public/integrations/**',
        '**/public/maps/**',
        '**/public/Images/**',
        '**/node_modules/**',
        '**/.git/**',
        '**/temp_tiles/**',
        '**/tmp/**',
        '**/artifacts/**',
        '**/*.png',
        '**/*.jpg',
        '**/*.glb',
        '**/*.blend*'
      ]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        timeout: 30000
      },
      '/ollama-api': {
        target: 'http://localhost:11434/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama-api/, ''),
        secure: false,
        timeout: 30000
      }
    }
  }
})
