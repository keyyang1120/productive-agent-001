// Internal application contracts; these are NOT protocol wire schemas.
export type WorkItem = { label: string; status: 'done' | 'open'; minutes: number };
export type Job = { items: WorkItem[] };
export type Report = { itemCount: number; completed: number; open: number; totalMinutes: number; summary: string };
export interface ModelAdapter {
  readonly id: string;
  readonly mode: 'deterministic' | 'local-ai' | 'remote-ai';
  run(job: Job): Promise<Report>;
}
export type AgentIdentity = { namespace: string; id: string; registered: boolean };
export interface IdentityAdapter { resolve(): Promise<AgentIdentity> }
export type PaymentResult =
  | { status: 'free'; amountAtomic: '0' }
  | { status: 'settled'; amountAtomic: string; asset: string; network: string; reference: string };
export interface PaymentAdapter {
  readonly protocol: 'none' | 'x402' | 'mpp';
  // A future paid adapter must bind proof to job, resource, amount and expiry,
  // verify AND settle with replay protection before returning 'settled'.
  authorize(context: { jobId: string; inputHash: string; resource: string; proof?: string }): Promise<PaymentResult>;
}
export type ExecutionReceipt = {
  schema: 'foundry.execution.v1'; jobId: string; identity: AgentIdentity;
  model: { id: string; mode: ModelAdapter['mode'] };
  inputHash: string; outputHash: string; completedAt: string;
  payment: PaymentResult; attestation: 'unsigned-local';
};
export interface ReputationAdapter {
  // Execution evidence is not a customer rating or ERC-8004 feedback.
  recordExecution(receipt: ExecutionReceipt): Promise<void>;
}
export interface RevenueRouterAdapter {
  route(payment: Extract<PaymentResult, { status: 'settled' }>): Promise<{ status: 'routed'; reference: string }>;
}
export interface ProtocolAdapter<Input, Output> {
  readonly protocol: 'mcp' | 'a2a';
  decode(message: Input): Job;
  encode(result: { report: Report; receipt: ExecutionReceipt }): Output;
}
export type Adapters = {
  model: ModelAdapter; identity: IdentityAdapter; payment: PaymentAdapter;
  reputation: ReputationAdapter; revenue: RevenueRouterAdapter;
};
