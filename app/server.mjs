import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RefundStore } from './refund-store.mjs';

const port = Number(process.env.PORT ?? 4173);
const publicDirectory = fileURLToPath(new URL('./public/', import.meta.url));
const store = new RefundStore();
const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

function sendJson(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

  if (url.pathname === '/health') return sendJson(response, 200, { status: 'ok' });
  if (request.method === 'GET' && url.pathname === '/api/order') return sendJson(response, 200, store.getOrder());
  if (request.method === 'GET' && url.pathname === '/api/refunds') return sendJson(response, 200, store.listRefunds());
  if (request.method === 'POST' && url.pathname === '/api/reset') {
    store.reset();
    return sendJson(response, 200, { reset: true });
  }
  if (request.method === 'POST' && url.pathname === '/api/refunds') {
    try {
      const body = await readJson(request);
      const idempotencyKey = request.headers['idempotency-key'];
      if (typeof idempotencyKey !== 'string' || idempotencyKey.length === 0) {
        return sendJson(response, 400, { error: 'Idempotency-Key header is required.' });
      }
      const result = store.createRefund({ amount: body.amount, idempotencyKey });
      if (result.error) return sendJson(response, result.status, { error: result.error });
      return sendJson(response, result.created ? 201 : 200, result.refund);
    } catch {
      return sendJson(response, 400, { error: 'Request body must be valid JSON.' });
    }
  }

  const requestedFile = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  if (!['index.html', 'app.js', 'styles.css'].includes(requestedFile)) return sendJson(response, 404, { error: 'Not found' });

  try {
    const file = await readFile(join(publicDirectory, requestedFile));
    response.writeHead(200, { 'content-type': contentTypes[extname(requestedFile)] ?? 'application/octet-stream' });
    response.end(file);
  } catch {
    sendJson(response, 404, { error: 'Not found' });
  }
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Refund demo listening on http://127.0.0.1:${port}\n`);
});
