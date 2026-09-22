import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { execute, InputError } from './agent.ts';
import { localAdapters } from './local-adapters.ts';

export function createAgentServer() {
  const adapters = localAdapters();
  const server = createServer(async (req, res) => {
    const reply = (status: number, body: unknown) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Connection': 'close' });
      res.end(JSON.stringify(body));
    };
    // Exact Host check mitigates DNS rebinding; browsers are not clients in Phase 1.
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    if (req.headers.host !== `127.0.0.1:${port}` || req.headers.origin !== undefined) {
      reply(403, { error: 'Use a local CLI client and 127.0.0.1' }); return;
    }
    if (req.method === 'GET' && req.url === '/health') { reply(200, { status: 'ok', phase: 1 }); return; }
    if (req.method === 'GET' && req.url === '/v1/manifest') {
      reply(200, { name: 'Productive Agent #001', version: '0.1.0', transport: 'foundry-http-v1',
        skill: 'work-report', model: 'deterministic', registered: false, payments: false,
        mcp: false, a2a: false }); return;
    }
    if (req.url !== '/v1/jobs') { reply(404, { error: 'Not found' }); return; }
    if (req.method !== 'POST') { reply(405, { error: 'Use POST' }); return; }
    if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
      reply(415, { error: 'Use application/json' }); return;
    }
    if (req.headers['content-encoding'] !== undefined) { reply(415, { error: 'Encoded bodies are unsupported' }); return; }
    try {
      const chunks: Buffer[] = []; let bytes = 0;
      for await (const chunk of req) {
        const buffer = Buffer.from(chunk); bytes += buffer.length;
        if (bytes > 32768) { reply(413, { error: 'Body exceeds 32 KiB' }); return; }
        chunks.push(buffer);
      }
      let body: unknown;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { throw new InputError('Invalid JSON'); }
      reply(200, await execute(body, adapters));
    } catch (error) {
      if (!res.headersSent) reply(error instanceof InputError ? 400 : 500,
        { error: error instanceof InputError ? error.message : 'Execution failed' });
    }
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  server.setTimeout(5000, socket => socket.destroy());
  server.maxConnections = 16;
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createAgentServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(8787, '127.0.0.1', () => console.log('Productive Agent #001: http://127.0.0.1:8787 (local only, zero payments)'));
}
