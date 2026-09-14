import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RefundStore } from './refund-store.mjs';
import { SimulatedRefundProvider } from './refund-provider-simulator.mjs';

const port = Number(process.env.PORT ?? 4173);
const publicDirectory = fileURLToPath(new URL('./public/', import.meta.url));
const persistenceMode = process.env.PERSISTENCE_MODE ?? 'memory';
const providerSimulatorEnabled = process.env.ENABLE_PROVIDER_SIMULATOR === 'true';
const provider = new SimulatedRefundProvider();
const store = await createStore();
const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const maximumBodyBytes = 16 * 1024;

async function createStore() {
  if (persistenceMode === 'memory') return new RefundStore();
  if (persistenceMode !== 'postgres') throw new Error(`Unsupported PERSISTENCE_MODE: ${persistenceMode}`);
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required when PERSISTENCE_MODE=postgres.');
  const { PostgresRefundStore } = await import('./postgres-refund-store.mjs');
  const postgresStore = new PostgresRefundStore({ connectionString: process.env.DATABASE_URL });
  await postgresStore.initialize();
  return postgresStore;
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  let receivedBytes = 0;
  for await (const chunk of request) {
    receivedBytes += chunk.length;
    if (receivedBytes > maximumBodyBytes) {
      const error = new Error('Request body is too large.');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

  if (url.pathname === '/health') {
    return sendJson(response, 200, {
      status: 'ok', persistence: persistenceMode,
      provider: providerSimulatorEnabled ? 'simulated' : 'not-configured',
    });
  }
  if (request.method === 'GET' && url.pathname === '/api/order') return sendJson(response, 200, await store.getOrder());
  if (request.method === 'GET' && url.pathname === '/api/refunds') return sendJson(response, 200, await store.listRefunds());
  if (request.method === 'POST' && url.pathname === '/api/reset') {
    await store.reset();
    provider.reset();
    return sendJson(response, 200, { reset: true });
  }
  if (request.method === 'POST' && url.pathname === '/api/refunds') {
    try {
      if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) {
        return sendJson(response, 415, { error: 'Content-Type must be application/json.' });
      }
      const idempotencyKey = request.headers['idempotency-key'];
      if (typeof idempotencyKey !== 'string' || idempotencyKey.length === 0) {
        return sendJson(response, 400, { error: 'Idempotency-Key header is required.' });
      }
      if (idempotencyKey.length > 200) {
        return sendJson(response, 400, { error: 'Idempotency-Key must not exceed 200 characters.' });
      }
      const body = await readJson(request);
      if (!Number.isInteger(body.amount) || body.amount <= 0) {
        return sendJson(response, 400, { error: 'Refund amount must be a positive integer in cents.' });
      }
      const existing = await store.findByIdempotencyKey(idempotencyKey);
      if (existing) {
        if (existing.amount !== body.amount) {
          return sendJson(response, 409, { error: 'Idempotency-Key cannot be reused with a different refund amount.' });
        }
        return sendJson(response, 200, existing);
      }

      const scenarioHeader = request.headers['x-simulated-provider-scenario'];
      let providerResult;
      if (typeof scenarioHeader === 'string') {
        if (!providerSimulatorEnabled) {
          return sendJson(response, 400, { error: 'Simulated provider scenarios are disabled.' });
        }
        providerResult = await provider.process({ idempotencyKey, scenario: scenarioHeader });
        if (!providerResult.accepted) {
          return sendJson(response, providerResult.httpStatus, { error: providerResult.error });
        }
      }

      const result = await store.createRefund({
        amount: body.amount,
        idempotencyKey,
        status: providerResult?.status ?? 'PENDING',
      });
      if (result.error) return sendJson(response, result.status, { error: result.error });
      if (!result.created && result.refund.amount !== body.amount) {
        return sendJson(response, 409, { error: 'Idempotency-Key cannot be reused with a different refund amount.' });
      }
      return sendJson(response, result.created ? (providerResult?.httpStatus ?? 201) : 200, result.refund);
    } catch (error) {
      if (error.status === 413) return sendJson(response, 413, { error: error.message });
      if (error instanceof SyntaxError) return sendJson(response, 400, { error: 'Request body must be valid JSON.' });
      console.error('Refund request failed', error);
      return sendJson(response, 500, { error: 'Internal server error.' });
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
  process.stdout.write(`Refund demo (${persistenceMode}) listening on http://127.0.0.1:${port}\n`);
});
