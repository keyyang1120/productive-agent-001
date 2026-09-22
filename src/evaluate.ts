import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execute, InputError } from './agent.ts';
import { localAdapters } from './local-adapters.ts';

type Case = { name: string; input: unknown; expectedError?: boolean;
  expected?: { itemCount: number; completed: number; open: number; totalMinutes: number } };
const cases: Case[] = JSON.parse(await readFile(new URL('../examples/evaluation.json', import.meta.url), 'utf8'));
console.log('\nProductive Agent #001 — 公開用サンプルの確認');
console.log('AI推論なし・外部通信なし・支払いなし。サーバーの起動は不要です。\n');
let passed = 0;
for (const sample of cases) {
  try {
    if (sample.expectedError) {
      await assert.rejects(execute(sample.input, localAdapters()), InputError);
      console.log(`✓ ${sample.name} → 正しく拒否しました`);
    } else {
      const { report, receipt } = await execute(sample.input, localAdapters());
      const { summary, ...numbers } = report;
      assert.deepEqual(numbers, sample.expected);
      assert.deepEqual(receipt.payment, { status: 'free', amountAtomic: '0' });
      console.log(`✓ ${sample.name} → ${report.itemCount}件 / 完了${report.completed} / 未完了${report.open} / ${report.totalMinutes}分`);
    }
    passed++;
  } catch (error) {
    console.error(`✗ ${sample.name}: ${error instanceof Error ? error.message : '確認に失敗'}`);
  }
}
console.log(`\n結果：${cases.length}件中${passed}件成功。`);
console.log('これは計算と入力検証の確認です。AIの能力や収益性を示すものではありません。');
if (passed !== cases.length) process.exitCode = 1;
