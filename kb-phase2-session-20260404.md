# kb.sakane.dev Phase 2 開発ログ — 2026-04-04

## 本日の実施内容

### 1. デザインリファレンス分析・共有
- keypage.html / academic.html / implementation.html / keypage_techguide.md を分析
- academic.html を CSS上書き実装のターゲットとして確定
- implementation.html のアーキテクチャ（コンポーネント構成、データマッピング）を把握
- 実装戦略を2層に整理:
  - **レイヤー1**: CSS上書き（notion.css）— 先行着手
  - **レイヤー2**: カスタムコンポーネント（TSX）— 後日

### 2. react-notion-x CSSクラス調査
- Claude Code にて notion.css の既存オーバーライド済みクラス一覧を取得
- 未オーバーライドだが Phase 2 で必要なクラスを特定（TOC系、page-content系等）

### 3. CSS上書き実装（完了分）

| # | 対象 | セレクタ | 変更内容 | 状態 |
|---|------|----------|----------|------|
| ① | コードブロック | `.notion-code` | 背景 #0d0e10、border rgba(70,69,84,0.2)、角丸 0.75rem、色 #c7c4d7、padding 1.5rem、font-size 0.875rem、line-height 1.625、shadow | ✅ 完了 |
| ② | H2 見出し | `.notion-h2` | Newsreader、padding-top 2rem、border-bottom 1px solid rgba(70,69,84,0.1)、padding-bottom 0.5rem | ✅ 完了 |
| - | TOC 非表示 | `.notion-aside-table-of-contents` | display: none（将来カスタムToC差替予定） | ✅ 完了 |
| - | キャプション | `.notion-asset-caption` | text-align: left | ✅ 完了 |
| - | はみ出し防止 | `.notion-code`, `.notion-asset-wrapper`, `.notion-simple-table`, `.notion-collection-row` | max-width: 100% + overflow-x: auto | ✅ 完了 |

## 未実施・次回以降のタスク

### HIGH（CSS上書き残り）

| # | 対象 | セレクタ | 概要 |
|---|------|----------|------|
| ③ | Blockquote | `.notion-quote` | Glassmorphism化（blur + 半透明背景 + primary/40左ボーダー + ::before クォート装飾） |
| ④ | Drop Cap | `.notion-text:first-of-type::first-letter` | Newsreader italic 5rem、#c2c1ff、要セレクタ検証 |

### MEDIUM（CSS上書き）

| # | 対象 | セレクタ | 概要 |
|---|------|----------|------|
| ⑤ | Callout | `.notion-callout` | Glassmorphism化 |
| ⑥ | TOC | `.notion-table-of-contents-*` | 番号付きナビスタイル（CSS counter） |
| ⑦ | 本文サイズ | `.notion-text` | font-size: 1.125rem 追加 |
| ⑧ | Selection | `::selection` | background: #5e5ce6、color: #f4f1ff |

### LOW（TSXコンポーネント / CSS混在）

| # | 対象 | 概要 |
|---|------|------|
| ⑨ | Reading Progress | scrollベースゲージ（useEffect + CSS） |
| ⑩ | Article Header Metadata | 著者・日付・Read Time 表示レイアウト |
| ⑪ | inline-code | `.notion-inline-code` 背景色・角丸 |

### Phase 2 後半（コンポーネント層）

- 右サイドバー: Document Meta / Analytics Stats / カスタムToC
- ヒーローヘッダー: eyebrow + 著者 + アクションボタン
- Mermaid / Graphviz レンダリング（コードブロックフック）
- Notion DBプロパティ拡張（Reliability / Citations / Impact）
- モバイルレスポンシブ

## 技術メモ

- **デザインリファレンス**: academic.html（日本語版）を primary target として使用
- **macOS風コードブロックヘッダー**: CSS疑似要素では困難、後日検討
- **Drop Cap セレクタ**: `.notion-text:first-of-type` がページプロパティ行等と競合する可能性あり、DevTools確認必要
- **TOC**: react-notion-x の自動生成 aside を非表示にし、将来カスタム実装で差替予定
- **本文幅**: `.notion-page` の max-width は現状維持（画像・コード・表のはみ出し防止で対応）

## ファイル変更箇所

- `styles/notion.css` — L38, L211-222, L218(code), L259-265 付近
