# Productive Agent #001

Agent Economy Foundryの公開R&D用スターター。モデル・identity・paymentsを分け、5年先のagent経済に向けて、自分で管理できる実装・評価・接続実績を積み上げる。

**Phase 1: ローカル限定、料金0、追加パッケージ0、wallet不要。** 現在の処理は決定的なルール処理であり、LLMによるAI推論や自律行動はまだない。公開R&D用のコード。endpointの外部公開は行っていない。

## 何が動くか

作業データをJSONで送ると、件数・完了数・未完了数・作業時間のレポートと、入力/出力hashを含む実行記録を返す。これは将来AIや別agentから呼べる仕事の最小単位。

| 機能 | 現在 |
|---|---|
| HTTP endpoint | ローカルで動作 |
| Model | deterministic rules。AI APIなし |
| Identity | local ID。ERC-8004未登録 |
| Payments | free/0。x402/MPP未実装 |
| Reputation | 内部hookのみ。顧客評価・on-chain書込みなし |
| Revenue router | interfaceのみ。送金機能なし |
| MCP/A2A | interfaceのみ。protocol準拠はまだ主張しない |

## 今すぐ実行する

ターミナルを開き、取得したproductive-agent-001フォルダの親フォルダへ移動する。

```sh
cd productive-agent-001
node --version
npm test
npm start
```

保存場所が異なる場合は、このREADMEとpackage.jsonがあるフォルダへ移動する。

対応環境: Node.js 24.12以降の24系。今回の環境ではv24.19.0を検出。ユーザーがAgent関連ソフトを入れたという意味ではなく、この実行環境に既にあったNodeを使用している。`npm install`は不要。`npm test`/`npm start`はこのファイル内のローカルscriptだけを動かす。

`node: command not found`の場合はここで止める。Node導入は別途、入手元・変更点・通信を説明してから行う。コマンドを繰り返しても解決しない。

`http://127.0.0.1:8787`の起動表示が出たら、そのターミナルは開いたままにする。**もう一つのターミナル**で同じフォルダへ移動して:

```sh
npm run demo
```

期待されるreport:

```json
{
  "itemCount": 3,
  "completed": 2,
  "open": 1,
  "totalMinutes": 75,
  "summary": "3 tasks; 2 completed; 1 open; 75 minutes."
}
```

receiptのpaymentが`free`、amountAtomicが`0`、identity.registeredが`false`であることも確認する。jobIdと時刻は実行ごとに変わる。

終了はserver側でControl+C。`EADDRINUSE`なら8787が使用中。このプロジェクトの起動済みserverをControl+Cで止めてから再起動する。他のプロセスを無差別に終了しない。

この操作の通信先は自分のMacの127.0.0.1のみ。外部AI・wallet・chain・クラウドへ接続しない。電力とPC資源を使うがAPI課金はない。

## API

- `GET /health`: 起動確認
- `GET /v1/manifest`: 独自形式の実装状況。A2A Agent Cardではない
- `POST /v1/jobs`: `Content-Type: application/json`、[入力例](examples/job.json)

CLIから直接呼ぶ例:

```sh
curl --noproxy '*' http://127.0.0.1:8787/v1/jobs \
  -H 'Content-Type: application/json' \
  --data-binary @examples/job.json
```

## 構成と検証

- [src/ports.ts](src/ports.ts): model / identity / payment / reputation / revenue / protocol の内部契約
- [src/agent.ts](src/agent.ts): 入力検証・仕事の実行・receipt
- [src/local-adapters.ts](src/local-adapters.ts): 無料ローカル実装
- [src/server.ts](src/server.ts): Node HTTP transport
- [test/agent.test.ts](test/agent.test.ts): 集計、入力制限、料金/remote拒否、HTTPとOrigin/Host防御
- [仕様調査](docs/spec-review-2026-09-20.md): 2026-09-20の一次資料と設計判断
- [拡張設計とownership仮説](docs/architecture.md)
- [セキュリティ](SECURITY.md)

Node標準のTypeScript直接実行を利用。tsconfigは将来の静的検査用で、Nodeはこれを読み込まない。TypeScript compilerとNode型定義は未導入で、静的型検査は未実施。実行時テストの結果は[検証記録](docs/verification.md)を参照。

## 次の一歩

1. 自分のMacで上のdemoを1回成功させる。
2. 公開用の架空データ10件と期待値は作成済み。`npm run evaluate`で確認する。
3. GitHubで自分が管理するrepositoryを作り、このフォルダだけを公開する。公開範囲、commit情報、licenseを先に確認する。
4. 開発者1人に再現してもらい、実際の改善要求を得る。
5. ローカルAI → MCPまたはA2A → ERC-8004 testnet → testnet paymentsの順に、各段階の成果を確認して進む。

収益・資産形成は未検証。積み上げる対象は再利用できるコード、評価データ、実験履歴、ユーザーとの接点。即金の仕事とは別の長期R&D本線として管理する。

License: 未設定。公開前に決める。秘密鍵・seed phraseは今後もチャットに貼らない。

## 日本語で10件を確認する

同じフォルダで`npm run evaluate`を実行すると、架空の入力7件と不正な入力3件を確認する。サーバー起動や外部通信は不要。入力と期待値は[examples/evaluation.json](examples/evaluation.json)で読める。これは集計機能の回帰評価で、将来のAI能力評価とは分けて扱う。
