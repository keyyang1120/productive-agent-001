# Protocol review — 2026-09-20

一次資料を2026-09-20に確認。以下は閲覧時点の公式ページの記述であり、将来の互換性の保証ではない。main/latestへのリンクは更新される。実際のadapter開発時にバージョンとcommitを再確認・固定する。

| 領域 | 確認した仕様・状態 | このプロジェクトの判断 |
|---|---|---|
| ERC-8004 | EIP本文はDraft。Identity / Reputation / Validationのregistry。識別はregistryとagentIdの組。決済は範囲外 | identityとreputationを分離。今はlocal IDのみ。登録済みとは表示しない |
| x402 | V2、x402Version=2。HTTP 402とPAYMENT-REQUIRED / PAYMENT-SIGNATURE / PAYMENT-RESPONSEのフロー | 独立したpayment adapterの候補。今はnone。facilitatorもchainも固定しない |
| MCP | 2026-07-28改訂。ステートレス化、initialize handshakeの撤廃、各requestの_metaにversion/capabilities | 旧版のサンプルをそのまま使わない。独自HTTP endpointをMCP対応と呼ばない |
| A2A | 公式repoのlatest releasedは1.0.0。Agent Card、message/task、複数の通信binding | まず同期job core。A2A実装時にtask lifecycleとAgent Cardを追加。0.3のcardはコピーしない |
| MPP | paymentauth.orgの仕様群。HTTP Payment認証によるchallenge/credential。JSON-RPC/MCP transportは2026-09-19付Internet-Draft | x402と別adapterとして扱う。Draftを確定規格と扱わず、相互互換は仮定しない |

一次資料:

- ERC-8004: https://eips.ethereum.org/EIPS/eip-8004
- x402 V2 normative source: https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md
- x402 release context: https://x402.org/x402-v2-launch/
- MCP versioned specification: https://modelcontextprotocol.io/specification/2026-07-28
- MCP changelog: https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2026-07-28/changelog.mdx
- MCP release: https://blog.modelcontextprotocol.io/posts/2026-07-28/
- A2A released-version pointer: https://github.com/a2aproject/A2A/blob/main/docs/specification.md
- A2A specification: https://a2a-protocol.org/v1.0.0/specification/
- MPP core/spec index: https://paymentauth.org/
- MPP source: https://github.com/tempoxyz/mpp-specs
- MPP JSON-RPC/MCP draft: https://paymentauth.org/draft-payment-transport-mcp-00
- Node TypeScript execution (type stripping does not type-check): https://nodejs.org/api/typescript.html

設計判断（仕様上の義務ではない）:

1. 最初の成果物は、入力から再現可能な仕事と実行記録を返すこと。モデル、通信、登録、決済の同時導入を避ける。
2. LLMはまだ使わない。ModelAdapterのdeterministic実装で、後から同じ評価データを使ってlocal-aiと比較できるようにする。
3. 独自のnormalized JSON + SHA-256をローカル実験で使用。ERC-8004のfeedbackHashやJCS署名の代用品ではない。
4. reputationへ渡すのは実行記録用hook。自己申告の成功を顧客評価や第三者検証として登録しない。
5. 料金ゼロのローカルHTTPがPhase 1の完了条件。testnetが使えることと無料であることは別問題なので、RPC/walletの追加は次の段階で判断する。

仮説: 異なるモデルや決済方式でも仕事の品質・費用・実行証拠を比較できる基盤は、将来のagent運用者に役立つ可能性がある。顧客需要・収益・トークン価値は未検証。
