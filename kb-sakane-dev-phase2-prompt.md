# kb.sakane.dev Phase 2: 論文詳細ページ開発

以下は Claude Code 用のカスタムプロンプトです。
新規スレッドの冒頭に貼り付けて使用してください。

---

```
kb.sakane.dev プロジェクト継続開発プロンプト

## プロジェクト概要
Next.js Notion Starter Kit（transitive-bullshit/nextjs-notion-starter-kit fork）を使った
論文ナレッジベースサイト。Notion上のインラインDBに論文を管理し、Vercelにデプロイ。
ドメイン: kb.sakane.dev
リポジトリ: github.com/sakane-dev/kb.sakane.dev

## 完了済みの実装（ランディングページ）

### アーキテクチャ
- NotionPage.tsx: rootNotionPageId判定でランディングページとNotionRendererを分岐
- KBLandingPage.tsx: Notion recordMapからcollection/collection_queryを解析、Bentoグリッド描画
- kb-landing.css: グローバルCSS、MD3デザイントークン

### ランディングページ v3-final（現在のプロダクション）
- **レイアウト**: 3分割Bentoグリッド（Large 8col×2row + Small 4col×1row ×2）
- **DynamicTexture**: SVG feTurbulence + Notion UUID seed でカードごとにユニークなノイズ生成
  - hashToFloat() ヘルパー: UUID→決定論的float（Hydration安全）
  - DynamicTexture コンポーネント: __svg(ノイズ) + __gradient(発光) + __reflection(光沢)
- **glass-panel**: backdrop-filter: blur(12px) + 半透明背景 + border-left: 4px solid primary
- **multi-point glow**: filter: blur(25px) の発光体を2点配置（Large Card）
- **eyebrow**: カテゴリバッジ（pill形状、primary色背景）
- **BentoMediumCard**: 廃止済み
- **streamCards**: filtered.slice(3) でBento表示済みカードとの重複を防止
- **TopBar検索**: 削除済み（Hero検索のみ）
- **ESLint/Prettier**: 全パス済み

### デザインシステム（MD3ダークテーマ）
- primary: #c2c1ff, tertiary: #ddb7ff, secondary: #b9c8de, error: #ffb4ab
- surface-container-low: #1b1c1e, background: #121315
- フォント: Newsreader（serif, 見出し/本文）+ Inter（sans, UI/ラベル）
- ghost-border: 1px solid rgba(145, 143, 160, 0.15)
- glass: rgba(41, 42, 44, 0.4) + backdrop-filter: blur(12px)

### Notion DB構造
- rootNotionPageId: 3349ee114e2c80cc8330ce43f19a6bd1
- スキーマキー: title=title, Slug=lzv?, Published=lO]N, Date=W<Og, Tags=PwRK
- recordMap: block[id].value.value 二重ネスト構造（.value?.value ?? .value フォールバック）
- 現在6件Published

### 技術的制約
- react-notion-x の NotionRenderer が論文詳細ページを描画
- darkMode={true} ハードコード（ダークモード固定）
- Hydration対策: 決定論的ソート、suppressHydrationWarning、Math.random()禁止
- SVG属性はcamelCase: strokeWidth, viewBox, baseFrequency, numOctaves, stitchTiles

## Phase 2 開発タスク（優先順）

### 1. 論文詳細ページのデザイン・設計
- react-notion-x NotionRenderer のCSS上書きによるスタイリング
- ランディングページのMD3デザインシステムとの視覚的一貫性
- ヒーローエリア（タイトル + タグ + 日付 + eyebrow）のカスタムヘッダー検討
- サイドバーToC（Table of Contents）の将来的追加余地を確保

### 2. 実装
- styles/notion.css のカスタマイズ（NotionRenderer上書き）
- フォント統一（Newsreader + Inter）
- カラーパレット統一（MD3ダークテーマ）
- コードブロック、引用、テーブルのスタイリング

### 3. Mermaid / Graphviz 可視化
- Notionページ内のMermaid記法 / Graphviz DOT言語をブラウザで描画する方法の検討
- react-notion-x のコードブロックレンダリングをフックしてMermaid.jsで変換
- ダークテーマ対応

### 4. ページリンク修正
- 内部リンク（論文間の相互参照）が正しく動作するか確認・修正
- Slug設定の正規化

### 5. コンテンツテキスト修正
- Notion側のコンテンツ整備（typo修正、メタデータ整備）
- "Structual Intelligence" → "Structural Intelligence" のtypo修正

### 6. デザイン最終調整
- フォントサイズ、line-height、letter-spacing の微調整
- padding / margin の一貫性確認
- モバイルレスポンシブ対応
- ランディングページ ↔ 詳細ページ間のナビゲーション体験
```
