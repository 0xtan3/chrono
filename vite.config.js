import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import sendVerificationHandler from './api/send-verification.js';
import verifyHandler from './api/verify.js';
import cronHandler from './api/cron.js';

// Local development serverless API adapter for Vite
function devApiPlugin() {
  return {
    name: 'dev-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next();

        // Parse JSON body for incoming POST requests
        let body = {};
        if (req.method === 'POST') {
          const buffers = [];
          for await (const chunk of req) {
            buffers.push(chunk);
          }
          const raw = Buffer.concat(buffers).toString();
          if (raw) {
            try { body = JSON.parse(raw); } catch (e) {}
          }
        }

        const urlObj = new URL(req.url, 'http://localhost');
        const adaptedReq = {
          ...req,
          body,
          query: Object.fromEntries(urlObj.searchParams),
          headers: req.headers,
          method: req.method,
        };

        const adaptedRes = {
          status(code) {
            res.statusCode = code;
            return this;
          },
          json(data) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return this;
          }
        };

        try {
          if (urlObj.pathname === '/api/send-verification') {
            return await sendVerificationHandler(adaptedReq, adaptedRes);
          } else if (urlObj.pathname === '/api/verify') {
            return await verifyHandler(adaptedReq, adaptedRes);
          } else if (urlObj.pathname === '/api/cron') {
            return await cronHandler(adaptedReq, adaptedRes);
          }
        } catch (err) {
          console.error('Dev API Error:', err);
          return adaptedRes.status(500).json({ error: err.message });
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), devApiPlugin()],
});
