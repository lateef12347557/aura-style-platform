import http from 'http';
import handler from './index.js';

const server = http.createServer((req, res) => {
  try {
    // Vercel-style handler: if it exports default function(req, res)
    const maybePromise = handler(req, res);
    if (maybePromise && typeof maybePromise.then === 'function') {
      maybePromise.catch((err) => {
        console.error('handler error', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('content-type', 'text/plain');
          res.end('handler error');
        }
      });
    }
  } catch (err) {
    console.error('server error', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'text/plain');
      res.end('server error');
    }
  }
});

server.listen(3002, () => console.log('test server listening on http://localhost:3002'));
