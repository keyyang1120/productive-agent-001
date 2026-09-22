import { createHash, randomUUID } from 'node:crypto';
import type { Adapters, ExecutionReceipt, Job } from './ports.ts';

export class InputError extends Error {}
export function parseJob(value: unknown): Job {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InputError('Expected an object');
  const obj = value as Record<string, unknown>;
  if (Object.keys(obj).some(key => key !== 'items') || !Array.isArray(obj.items) || obj.items.length < 1 || obj.items.length > 100)
    throw new InputError('Expected only items: an array of 1..100 work items');
  return { items: obj.items.map((item: unknown) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new InputError('Invalid work item');
    const x = item as Record<string, unknown>;
    if (Object.keys(x).some(key => !['label', 'status', 'minutes'].includes(key)) ||
      typeof x.label !== 'string' || x.label.trim().length < 1 || x.label.length > 200 ||
      (x.status !== 'done' && x.status !== 'open') ||
      typeof x.minutes !== 'number' || !Number.isSafeInteger(x.minutes) || x.minutes < 0 || x.minutes > 10080)
      throw new InputError('Each item needs label (1..200 chars), status (done/open), minutes (integer 0..10080)');
    return { label: x.label.trim(), status: x.status, minutes: x.minutes };
  }) };
}
// Hash is over this application's normalized JSON, not JCS or an on-chain proof.
export const hash = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export async function execute(value: unknown, adapters: Adapters) {
  const job = parseJob(value);
  // This guard deliberately prevents a plug-in from silently activating paid/remote work.
  if (adapters.model.mode !== 'deterministic' || adapters.payment.protocol !== 'none')
    throw new Error('Phase 1 permits only deterministic, free execution');
  const jobId = randomUUID();
  const inputHash = hash(job);
  const identity = await adapters.identity.resolve();
  const payment = await adapters.payment.authorize({ jobId, inputHash, resource: '/v1/jobs' });
  if (payment.status !== 'free' || payment.amountAtomic !== '0') throw new Error('Phase 1 requires zero payment');
  const report = await adapters.model.run(job);
  const receipt: ExecutionReceipt = {
    schema: 'foundry.execution.v1', jobId, identity,
    model: { id: adapters.model.id, mode: adapters.model.mode },
    inputHash, outputHash: hash(report), completedAt: new Date().toISOString(),
    payment, attestation: 'unsigned-local'
  };
  await adapters.reputation.recordExecution(receipt);
  return { report, receipt };
}
