# kb.sakane.dev 改修: Bentoカードタイトルのtruncation解消

```
kb.sakane.dev リポジトリのランディングページで、Bentoグリッドのカードタイトルが途中で「...」に切れる問題を修正。

■ ファイル: styles/kb-landing.css のみ

■ 問題:
Medium CardとSmall Cardのタイトルに -webkit-line-clamp が設定されており、日本語の長いタイトルが途中で切れる。Bentoグリッドは既に min-height + auto rows に変更済みのため、line-clamp を外してもレイアウトは自然に拡張される。

■ 修正箇所1: .kb-bento-medium__title（689行目付近）

現在:
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
  overflow-wrap: anywhere;

変更後:
  display: block;
  word-break: auto-phrase;
  overflow-wrap: anywhere;

■ 修正箇所2: .kb-bento-small__title（774行目付近）

現在:
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
  overflow-wrap: anywhere;

変更後:
  display: block;
  word-break: auto-phrase;
  overflow-wrap: anywhere;

■ 補足:
- word-break を break-all → auto-phrase に変更する。break-all は日本語テキストを文字単位で改行するため不自然な位置で折り返される。auto-phrase はブラウザの自然な改行アルゴリズムに委ねる（Chrome 119+対応、非対応ブラウザでは normal にフォールバック）。
- .kb-bento-large__title には元々 line-clamp がないため変更不要。
- -webkit-line-clamp, -webkit-box-orient, display: -webkit-box の3行セットを削除し、overflow: hidden も削除すること。

■ 変更するファイル: styles/kb-landing.css のみ（2箇所）
■ 確認: pnpm dev → Bentoグリッドの Medium Card と Small Card のタイトルが「...」で切れずに全文表示されること。768px幅と1024px幅の両方で確認。
```
