import { readFile } from 'node:fs/promises';
const body = await readFile(new URL('../examples/job.json', import.meta.url), 'utf8');
try {
  const response = await fetch('http://127.0.0.1:8787/v1/jobs', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
    redirect: 'error', signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  console.log(JSON.stringify(await response.json(), null, 2));
} catch (error) {
  console.error('Demo failed. Start the server with npm start in another terminal.', error instanceof Error ? error.message : '');
  process.exitCode = 1;
}
