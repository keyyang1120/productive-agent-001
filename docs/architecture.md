# Architecture and extension gates

```text
CLI / future MCP or A2A adapter
            ↓
Local HTTP → validation → execute(job)
                            ├─ IdentityAdapter
                            ├─ PaymentAdapter (none, zero only)
                            ├─ ModelAdapter (deterministic)
                            └─ ReputationAdapter (no-op)
                                      ↓
                              report + execution receipt

Future verified settlement → RevenueRouterAdapter (disabled)
```

src/agent.tsにHTTP、クラウド、wallet SDKの依存はない。node:cryptoだけは現在のNode実行環境への依存であり、別runtimeに移す際はhash/ID生成を差し替える。src/server.tsがNode固有の通信層。ports.tsは内部契約で、公式protocol schemaの代用ではない。

## Extension order

1. 公開サンプル10件と期待結果を揃え、別の開発者が再現できる状態を作る。
2. 小型ローカルモデルをModelAdapterとして追加し、ルール処理との品質・速度・メモリを比較する。モデルdownloadのサイズ・licenseを説明してから実施する。モデルにshellや財布を渡さない。
3. MCP 2026-07-28またはA2A 1.0.0の片方を実装し、実際の別clientから呼ぶ。version negotiation、errors、capabilities、task semanticsを公式schemaと照合する。ProtocolAdapterは変換点にすぎず、これだけで準拠するわけではない。
4. ERC-8004 testnet登録: chain、registry deployment、登録費、RPC制限、metadata公開範囲を確認。登録前にregistrationを偽造しない。private keyはコード・チャットに置かず、署名を専用wallet側で扱う。
5. x402かMPPのtestnet adapterを一つ実装。challenge生成・証明検証・決済確定をHTTP層に組み込み、金額/asset/network/相手/期限/リソースを照合する。timeout、replay、二重請求、決済済み仕事失敗時の扱いをテストする。
6. reputationは顧客/検証者の証拠を区別。revenue routerは確定settlementに対して一度だけ適用し、配分・端数・再試行・監査を保存する。

有料機能を追加するときはexecuteのPhase 1 guardも明示的に更新する。adapterを挿すだけで自動的に有料化されない。永続的idempotency、署名検証、認証、金額上限は現段階では実装されていない。

## Ownership hypothesis

目的は自分で管理するコード、評価ケース、実験履歴、開発者との接点を積むこと。chain上のIDを取得するだけでは事業価値や法的権利は生まれない。

初期利用者候補はagentを作る個人開発者。将来の支払者候補は品質検証・監査・費用制御を必要とする運用チームだが、需要は未検証。単なる集計処理には技術的新規性はない。まず相互運用と検証可能な実行の実験台として使う。

ネットワーク効果はまだない。第三者が比較できる評価ケースや接続例が集まれば価値になる、という仮説。最初の判断基準は「外部の開発者1人が再現し、改善要求を出す」こと。反応がなければ、需要のある評価・spending-control領域へ実験の焦点を変える。

5年後の資産額は予測できない。今の選択で確保するのは、複数の技術に接続できる実装経験と、自分で方向を変えられるプロジェクト。
