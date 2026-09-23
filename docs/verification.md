# Verification — 2026-09-20

環境: macOS / Node.js v24.19.0。追加installなし。

- `npm test`: 6/6 pass。集計/receipt、正規化hash、入力制限、remote/paid拒否、revenue非実行、HTTP統合を確認。
- HTTP統合では正常応答、壊れたJSON、schema不正、method/content-type不正、32 KiB超過、Origin、偽Host、未実装A2A endpointの404を確認。
- `npm start`: 127.0.0.1:8787で起動成功。
- `npm run demo`: HTTP 200相当の成功。3件/完了2/未完了1/75分、payment=free、amountAtomic=0、registered=falseを確認。
- デモ後serverを停止。常駐プロセスや外部公開は残していない。

最初のHTTPテストはアプリのsandboxでlisten EPERM。ローカル待受の許可された実行に切り替えて全テストが通った。コードの不具合として処理したものではない。

未検証: TypeScript静的型検査（compiler未導入）、他OS/runtime、負荷・侵入試験、MCP/A2Aの相互接続、AI推論、on-chain登録・決済・reputation。これらの完成や準拠を主張しない。

## ユーザー環境での再現と評価データ

ユーザー提供の出力で2026-09-20T05:23:53.775Zのデモ成功を確認。3件/完了2/未完了1/75分、無料、local ID。

追加の`npm run evaluate`は10/10成功。公開用の架空データ7件と不正入力3件を、固定した期待値と比較。HTTP待受を使わずcoreを直接評価した。
