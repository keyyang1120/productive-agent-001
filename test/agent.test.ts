import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { execute, hash, parseJob } from '../src/agent.ts';
import { localAdapters } from '../src/local-adapters.ts';
import { createAgentServer } from '../src/server.ts';

const job = { items: [{ label: 'A', status: 'done', minutes: 30 }, { label: 'B', status: 'open', minutes: 15 }] };
test('report is correct and receipt describes a free, unsigned execution', async () => {
  const result = await execute(job, localAdapters());
  assert.equal(result.report.totalMinutes, 45);
  assert.equal(result.report.completed, 1);
  assert.equal(result.report.open, 1);
  assert.equal(result.receipt.outputHash, hash(result.report));
  assert.equal(result.receipt.identity.registered, false);
  assert.equal(result.receipt.attestation, 'unsigned-local');
  assert.deepEqual(result.receipt.payment, { status: 'free', amountAtomic: '0' });
});
test('normalization is stable while changed work changes its hash', () => {
  assert.equal(hash(parseJob(job)), hash(parseJob({ items: [{ minutes: 30, status: 'done', label: ' A ' }, job.items[1]] })));
  assert.notEqual(hash(parseJob(job)), hash(parseJob({ items: [job.items[0]] })));
});
test('reject invalid or unbounded inputs', () => {
  for (const value of [null, [], {}, { items: [] }, { items: Array(101).fill(job.items[0]) },
    { ...job, url: 'https://example.com' },
    ...[-1, 1.5, 10081, '30'].map(minutes => ({ items: [{ ...job.items[0], minutes }] })),
    { items: [{ ...job.items[0], label: ' ' }] }, { items: [{ ...job.items[0], status: 'unknown' }] }])
    assert.throws(() => parseJob(value));
});
test('Phase 1 rejects paid or remote adapters before work', async () => {
  const paid = localAdapters(); paid.payment.protocol = 'x402';
  await assert.rejects(execute(job, paid), /Phase 1/);
  const remote = localAdapters(); remote.model.mode = 'remote-ai';
  await assert.rejects(execute(job, remote), /Phase 1/);
  const misleading = localAdapters();
  misleading.payment.authorize = async () => ({ status: 'settled', amountAtomic: '1', asset: 'USDC', network: 'test', reference: 'fake' });
  await assert.rejects(execute(job, misleading), /zero payment/);
});
test('free work never invokes revenue routing; model failures propagate', async () => {
  const adapters = localAdapters();
  adapters.revenue.route = async () => { assert.fail('Must not route revenue'); };
  await execute(job, adapters);
  adapters.model.run = async () => { throw new Error('model unavailable'); };
  await assert.rejects(execute(job, adapters), /model unavailable/);
});
test('HTTP integration: success, validation, body limits, browser and rebinding protections', async t => {
  const server = createAgentServer();
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const port = address.port;
  function call(path: string, method = 'GET', body?: string, headers: Record<string, string> = {}) {
    return new Promise<{ status: number; body: any }>((resolve, reject) => {
      const req = request({ hostname: '127.0.0.1', port, path, method,
        headers: { 'Content-Type': 'application/json', ...headers } }, res => {
        let text = ''; res.setEncoding('utf8'); res.on('data', chunk => { text += chunk; });
        res.on('end', () => resolve({ status: res.statusCode!, body: JSON.parse(text) }));
      });
      req.on('error', reject); req.end(body);
    });
  }
  assert.equal((await call('/health')).status, 200);
  const result = await call('/v1/jobs', 'POST', JSON.stringify(job));
  assert.equal(result.status, 200); assert.equal(result.body.report.totalMinutes, 45);
  assert.equal((await call('/v1/jobs', 'POST', '{')).status, 400);
  assert.equal((await call('/v1/jobs', 'POST', '{}')).status, 400);
  assert.equal((await call('/v1/jobs', 'GET')).status, 405);
  assert.equal((await call('/v1/jobs', 'POST', '{}', { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await call('/v1/jobs', 'POST', 'x'.repeat(32769))).status, 413);
  assert.equal((await call('/health', 'GET', undefined, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await call('/health', 'GET', undefined, { Host: 'evil.example' })).status, 403);
  assert.equal((await call('/.well-known/agent-card.json')).status, 404);
  const manifest = (await call('/v1/manifest')).body;
  assert.equal(manifest.mcp, false); assert.equal(manifest.a2a, false);
});
