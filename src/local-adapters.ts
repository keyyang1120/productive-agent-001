import type { Adapters } from './ports.ts';

export function localAdapters(): Adapters {
  return {
    model: {
      id: 'work-report-rules-v1', mode: 'deterministic',
      async run({ items }) {
        const completed = items.filter(item => item.status === 'done').length;
        const totalMinutes = items.reduce((sum, item) => sum + item.minutes, 0);
        return { itemCount: items.length, completed, open: items.length - completed,
          totalMinutes, summary: `${items.length} tasks; ${completed} completed; ${items.length - completed} open; ${totalMinutes} minutes.` };
      }
    },
    identity: { async resolve() { return { namespace: 'local', id: 'productive-agent-001', registered: false }; } },
    payment: { protocol: 'none', async authorize() { return { status: 'free', amountAtomic: '0' }; } },
    reputation: { async recordExecution() { /* No persistence or reputation claim. */ } },
    revenue: { async route() { throw new Error('Revenue routing disabled in Phase 1'); } }
  };
}
