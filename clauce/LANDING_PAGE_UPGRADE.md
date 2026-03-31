# kb.sakane.dev — The Archive ランディングページ改修

## 概要

Next.js Notion Starter Kit のランディングページを、Notionの素のインラインDBテーブルビューから
**Material Design 3準拠のBento Grid探索ハブ**に差し替える改修。

論文詳細ページ（react-notion-xレンダリング）は一切変更なし。

## アーキテクチャ

```
                ┌─────────────────────┐
  GET /         │   pages/index.tsx   │  ← 変更なし
  ──────────►   │                     │
                └──────────┬──────────┘
                           │
                ┌──────────▼──────────┐
                │  NotionPage.tsx     │  ← isRootPage分岐を追加
                └──────────┬──────────┘
                           │
          ┌────────────────┼────────────────┐
          │                                 │
  isRootPage=true                  isRootPage=false
          │                                 │
  ┌───────▼───────────┐         ┌───────────▼──────────┐
  │ KBLandingPage.tsx │         │  NotionRenderer      │
  │ MD3 Bento Grid    │         │  (既存のまま)          │
  │ + kb-landing.css  │         │  論文詳細ページ        │
  └───────────────────┘         └──────────────────────┘
```

## 変更ファイル一覧

| ファイル | 操作 | 説明 |
|---------|------|------|
| `components/NotionPage.tsx` | **置換** | rootPage→KBLandingPage分岐追加 |
| `components/KBLandingPage.tsx` | **新規** | MD3 Bento Grid ランディングページ |
| `styles/kb-landing.css` | **新規** | グローバルCSS (MD3デザインシステム) |
| `pages/_app.tsx` | **置換** | kb-landing.css のimport追加 |
| `site.config.ts` | **置換** | typo修正 |

## デザインシステム

- **カラー**: MD3 dark theme (surface-container系5段階 + primary #c2c1ff)
- **タイポグラフィ**: Newsreader (見出し/本文) + Inter (UI/ラベル)
- **レイアウト**: 12カラムBento Grid (Featured 8col + Medium 4col)
- **エフェクト**: glass-panel, radial-gradient背景, staggeredアニメーション
- **コンポーネント**: 論文ページのMD3デザインと一貫性あり

## フォント追加

`pages/_document.tsx` または `<head>` に以下を追加（未追加の場合）：

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap" rel="stylesheet" />
```

## デプロイ手順

```bash
# 1. バックアップ
cp components/NotionPage.tsx components/NotionPage.tsx.bak
cp pages/_app.tsx pages/_app.tsx.bak

# 2. ファイル配置
# → components/KBLandingPage.tsx  (新規)
# → styles/kb-landing.css         (新規)
# → components/NotionPage.tsx     (置換)
# → pages/_app.tsx                (置換)
# → site.config.ts                (置換)

# 3. ローカル確認
pnpm dev

# 4. デプロイ
git add -A
git commit -m "feat: MD3 Bento Grid landing page"
git push origin main
```

## カスタマイズ

### タグカラー追加
`KBLandingPage.tsx` の `TAG_CONFIG` に追加：

```typescript
'NewTag': {
  bg: 'rgba(194,193,255,0.15)',
  text: '#c2c1ff',
  border: 'rgba(194,193,255,0.3)'
},
```

### Bento Gridレイアウト変更
`kb-landing.css` の `.kb-card--featured` / `.kb-card--grid` の `grid-column` を調整。

### Featured判定ロジック
デフォルトでは最初のPublished記事がFeatured。
`KBLandingPage.tsx` の `featured` 変数の判定を変更可能。
