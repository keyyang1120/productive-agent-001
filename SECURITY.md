# Phase 1 security boundaries

- Serverは127.0.0.1に固定。LANやインターネットには公開しない。tunnel、port forwarding、public deployは使わない。
- Node本体以外の実行依存はゼロ。API key、wallet、seed phrase、カード情報は不要。外部AI、RPC、telemetry、外部URLの取得はない。
- 入力は手作りのサンプルだけ。会社の顧客名・業務記録・個人情報を使わない。入力本文のファイル保存やloggingはしない。応答には実行情報とhashが含まれる。
- JSONは32 KiB、最大100件、各labelは200文字、minutesは0..10080の整数。未知のfield、非JSON、圧縮bodyを拒否する。
- Hostの完全一致とOrigin拒否でbrowser経由のアクセスを制限。CORSは有効にしない。ローカルの他プロセスは呼べる。ユーザー認証の代わりではない。
- labelはデータで、命令として実行しない。eval、shell、ファイル書込み、ユーザー指定URLの取得機能はない。
- hashは正しさ・本人性・第三者検証の証明ではない。低エントロピーの入力hashから情報を推測される可能性もあるので機密データのhashを公開しない。
- 実行履歴は永続保存しない。再実行は別jobId。冪等性を必要とする決済/配当処理へ流用しない。
- 支払い上限は0で、支払い実装自体がない。将来のadapterコードは信頼できるコードとして審査する必要があり、mode文字列はsandboxではない。
- NodeのTypeScript直接実行は型検査をしない。静的型検査はTypeScriptとNode型定義を別途導入してから行う。現版の検証はruntime tests。

外部公開前: 認証、TLS、rate limit、永続idempotency、監視、logの匿名化、費用上限、秘密管理を追加して再レビューする。無料枠のあるクラウドも超過課金があり得る。

GitHub公開前: 公開されるファイル/commit名/メールを確認。秘密・会社データを含めず、公開licenseを選ぶ。この雛形はまだlicenseを付与していない。公開リポジトリとopen-source licenseは別物。

問題を報告する際にも秘密情報を貼らない。公開窓口はリポジトリ作成後に設定する。
