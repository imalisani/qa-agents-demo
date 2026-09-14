import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const port = Number(process.env.REPORT_PORT ?? 9323);
const root = resolve(process.argv[2] ?? 'reports/allure-current');
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8',
  '.webm': 'video/webm',
};

createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
  const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const target = resolve(root, `.${pathname}`);
  if (target !== root && !target.startsWith(`${root}${sep}`)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const body = await readFile(target);
    response.writeHead(200, { 'content-type': contentTypes[extname(target)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
}).listen(port, '127.0.0.1', () => {
  process.stdout.write(`Allure report available at http://127.0.0.1:${port}\n`);
});
