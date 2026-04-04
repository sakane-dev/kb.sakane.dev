# kb.sakane.dev 改修: Bento Grid リデザイン v3（最終版）

```
kb.sakane.dev リポジトリのランディングページ、Bentoグリッドを3分割レイアウトに再設計する。
画像アセットは一切使用しない。CSS + インラインSVG（feTurbulence）で
Notionページデータから動的にリッチな背景テクスチャを生成する。

■ コア技術: Dynamic Semantic Textures
  各カードのNotion UUID（PaperCard.id）をシードとして、SVGの<feTurbulence>フィルタの
  baseFrequencyを変化させ、カードごとにユニークなノイズテクスチャを生成する。
  カードのタグに応じてテーマカラーを割り当て、色 × テクスチャの組み合わせで
  「知の指紋」を表現する。

■ カード内レイヤー構造（下から上へ）:
  Layer 1: Base — surface-container-low 背景色
  Layer 2: Generative — SVG feTurbulence ノイズ（opacity: 0.08, mix-blend-mode: overlay）
  Layer 3: Gradient — radial-gradient の発光層（色はタグで決定）
  Layer 4: Overlay — gradient-to-t のフェードアウト（Large Cardのみ）
  Layer 5: Glow — filter: blur() の多点発光体（Large Cardのみ）
  Layer 6: Glass Reflection — from-white/5 to-transparent の微細な光沢
  Layer 7: Content — glass-panel + テキスト

■ レイアウト: 3分割
  Large 1枚（8col×2row）+ Small 2枚（4col×1row each）= Bento 3枚
  残りは streamCards = filtered.slice(3) でStreamセクションに表示

■ カラー設計（タグ→色マッピング）:
  Large Card → primary系 #c2c1ff / #5e5ce6
  Small Card default → secondary系 #b9c8de
  Small Card alt → tertiary系 #ddb7ff / #9541e4

■ 変更ファイル: components/KBLandingPage.tsx + styles/kb-landing.css

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
変更1: ヘルパー関数を追加 — UUIDからfloatを生成
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KBLandingPage.tsx の Helpers セクション（formatSafeDate の近く）に追加:

```tsx
/**
 * 文字列（Notion UUID等）から 0〜1 の決定論的な浮動小数点を生成する。
 * SVGの feTurbulence baseFrequency のシード値に使用。
 */
function hashToFloat(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return Math.abs(hash % 1000) / 1000
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
変更2: 共通サブコンポーネント — DynamicTexture
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sub-components セクション（TagBadge の近く）に追加:

```tsx
/**
 * Notion UUID をシードに、feTurbulence でユニークなノイズテクスチャを生成。
 * color は CSS色文字列（rgba(...) or hex）。
 */
function DynamicTexture({
  seed,
  color,
  opacity = 0.08
}: {
  seed: string
  color: string
  opacity?: number
}) {
  const freq = 0.3 + hashToFloat(seed) * 0.5
  const filterId = `noise-${seed.slice(0, 8)}`

  return (
    <div className='kb-dynamic-texture' aria-hidden='true'>
      {/* Generative Layer: SVGノイズ */}
      <svg
        className='kb-dynamic-texture__svg'
        style={{ opacity }}
      >
        <filter id={filterId}>
          <feTurbulence
            type='fractalNoise'
            baseFrequency={freq}
            numOctaves={3}
            seed={Math.abs(seed.charCodeAt(0) * 127 + seed.charCodeAt(1) * 31)}
            stitchTiles='stitch'
          />
        </filter>
        <rect width='100%' height='100%' filter={`url(#${filterId})`} />
      </svg>
      {/* Gradient Layer: タグベースの発光 */}
      <div
        className='kb-dynamic-texture__gradient'
        style={{
          background: `radial-gradient(ellipse at 30% 25%, ${color} 0%, transparent 55%),
                       radial-gradient(ellipse at 75% 70%, ${color} 0%, transparent 50%)`
        }}
      />
      {/* Glass Reflection */}
      <div className='kb-dynamic-texture__reflection' />
    </div>
  )
}
```

CSSを追加:
```css
/* === Dynamic Texture (shared across all Bento cards) === */

.kb-dynamic-texture {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.kb-dynamic-texture__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  mix-blend-mode: overlay;
}

.kb-dynamic-texture__gradient {
  position: absolute;
  inset: 0;
  opacity: 0.25;
  transition: transform 0.7s ease;
}

.kb-dynamic-texture__reflection {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top right, rgba(255,255,255,0.04) 0%, transparent 60%);
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
変更3: カード配分ロジック
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KBLandingPage 関数内:

変更前:
  const featured = filtered[0]
  const mediumCard = filtered[1]
  const smallCards = filtered.slice(2, 4)
  const streamCards = filtered.slice(4)

変更後:
  const featured = filtered[0]
  const smallCards = filtered.slice(1, 3)
  const streamCards = filtered.slice(3)

mediumCard 変数を削除。

JSXのBentoグリッド部分:

変更前:
  <div className='kb-bento-grid'>
    <BentoLargeCard paper={featured} />
    {mediumCard && <BentoMediumCard paper={mediumCard} />}
    {smallCards[0] && <BentoSmallCard paper={smallCards[0]} />}
    {smallCards[1] && <BentoSmallCard paper={smallCards[1]} alt />}
  </div>

変更後:
  <div className='kb-bento-grid'>
    <BentoLargeCard paper={featured} />
    {smallCards[0] && <BentoSmallCard paper={smallCards[0]} />}
    {smallCards[1] && <BentoSmallCard paper={smallCards[1]} alt />}
  </div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
変更4: グリッドCSS — 12カラム
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

.kb-bento-grid のCSSを以下に置き換え:

```css
.kb-bento-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .kb-bento-grid {
    grid-template-columns: repeat(12, 1fr);
    grid-auto-rows: minmax(200px, auto);
  }
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
変更5: BentoLargeCard — DynamicTexture + overlay + glow + glass-panel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TSXを以下に変更:
```tsx
function BentoLargeCard({ paper }: { paper: PaperCard }) {
  const category = paper.tags[0] ?? 'Research'

  return (
    <Link href={paper.url} className='kb-bento-large'>
      {/* Layer 1-3: 動的テクスチャ */}
      <DynamicTexture
        seed={paper.id}
        color='rgba(194, 193, 255, 0.35)'
        opacity={0.1}
      />
      {/* Layer 4: gradient overlay */}
      <div className='kb-bento-large__overlay' aria-hidden='true' />
      {/* Layer 5: 多点Glow */}
      <div className='kb-bento-large__glow kb-bento-large__glow--a' aria-hidden='true' />
      <div className='kb-bento-large__glow kb-bento-large__glow--b' aria-hidden='true' />
      {/* Layer 7: glass-panelコンテンツ */}
      <div className='kb-bento-large__content'>
        <div className='kb-bento-large__glass'>
          <span className='kb-bento-large__eyebrow'>{category}</span>
          <h3 className='kb-bento-large__title'>{paper.title}</h3>
          <div className='kb-bento-large__tags'>
            {paper.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
```

CSS — 既存の .kb-bento-large 関連CSSをすべて削除し、以下で置き換え:

```css
/* === Large Card (8col × 2row) === */

.kb-bento-large {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  background: var(--md-surface-container-low);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.3s;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
}

@media (min-width: 768px) {
  .kb-bento-large {
    grid-column: span 8;
    grid-row: span 2;
  }
}

.kb-bento-large:hover {
  border-color: rgba(194, 193, 255, 0.25);
}

.kb-bento-large:hover .kb-dynamic-texture__gradient {
  transform: scale(1.05);
}

/* gradient overlay */
.kb-bento-large__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top right, rgba(18, 19, 21, 0.9) 0%, transparent 50%, rgba(18, 19, 21, 0.4) 100%);
  pointer-events: none;
  z-index: 1;
}

/* multi-point glow */
.kb-bento-large__glow {
  position: absolute;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  filter: blur(25px);
  pointer-events: none;
  opacity: 0.5;
  transition: opacity 0.5s;
  z-index: 2;
}

.kb-bento-large:hover .kb-bento-large__glow {
  opacity: 0.8;
}

.kb-bento-large__glow--a {
  top: 10%;
  left: 8%;
  background: radial-gradient(circle, rgba(194, 193, 255, 0.25) 0%, transparent 70%);
}

.kb-bento-large__glow--b {
  bottom: 20%;
  right: 15%;
  background: radial-gradient(circle, rgba(94, 92, 230, 0.2) 0%, transparent 70%);
}

/* コンテンツ配置 */
.kb-bento-large__content {
  position: relative;
  z-index: 3;
  padding: 2.5rem;
  width: 100%;
}

/* glass-panel */
.kb-bento-large__glass {
  background: rgba(41, 42, 44, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 4px solid var(--md-primary);
  border-radius: 1rem;
  padding: 2rem 2.5rem;
  max-width: 32rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
}

/* eyebrowバッジ */
.kb-bento-large__eyebrow {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background: rgba(194, 193, 255, 0.15);
  color: var(--md-primary);
  font-family: 'Inter', sans-serif;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 1rem;
}

.kb-bento-large__title {
  font-family: 'Newsreader', 'Georgia', serif;
  font-style: italic;
  font-size: clamp(1.25rem, 2.5vw, 2rem);
  font-weight: 400;
  color: var(--md-on-surface);
  margin: 0 0 1.25rem;
  line-height: 1.25;
}

.kb-bento-large__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
変更6: BentoSmallCard — DynamicTexture 2バリアント + glass-panel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TSXを以下に変更:
```tsx
function BentoSmallCard({ paper, alt }: { paper: PaperCard; alt?: boolean }) {
  const dateText = React.useMemo(() => formatSafeDate(paper.date), [paper.date])
  const category = paper.tags[0] ?? 'Research'

  const textureColor = alt
    ? 'rgba(221, 183, 255, 0.35)'
    : 'rgba(185, 200, 222, 0.35)'

  return (
    <Link href={paper.url} className={`kb-bento-small ${alt ? 'kb-bento-small--alt' : ''}`}>
      {/* 動的テクスチャ（色はバリアントで分岐） */}
      <DynamicTexture
        seed={paper.id}
        color={textureColor}
        opacity={0.06}
      />
      <div className='kb-bento-small__body'>
        <div className='kb-bento-small__icon-box'>
          <span className='kb-bento-small__icon'>
            {alt ? <IconBook /> : <IconFlask />}
          </span>
        </div>
        <div className='kb-bento-small__glass'>
          <h4 className='kb-bento-small__title'>{paper.title}</h4>
          <p className='kb-bento-small__meta'>{dateText} · {category}</p>
        </div>
      </div>
    </Link>
  )
}
```

変更点:
- DynamicTexture をカード共通で使用（seed=paper.id, colorをバリアントで分岐）
- default: secondary色 rgba(185, 200, 222, 0.35)
- alt: tertiary色 rgba(221, 183, 255, 0.35)
- 各カードがpage IDベースで異なるノイズパターンを持つ
- glass-panel で タイトル+メタ を包む
- アイコンを glass風ボックスに格納

CSS — 既存の .kb-bento-small 関連CSSをすべて削除し、以下で置き換え:

```css
/* === Small Card (4col × 1row) === */

.kb-bento-small {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  background: var(--md-surface-container-low);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-decoration: none;
  color: inherit;
  transition: background 0.3s, border-color 0.3s;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

@media (min-width: 768px) {
  .kb-bento-small {
    grid-column: span 4;
    grid-row: span 1;
  }
}

.kb-bento-small:hover {
  background: var(--md-surface-container-high);
  border-color: rgba(185, 200, 222, 0.25);
}

.kb-bento-small:hover .kb-dynamic-texture__gradient {
  transform: scale(1.06);
}

.kb-bento-small--alt:hover {
  border-color: rgba(221, 183, 255, 0.25);
}

/* カード内レイアウト */
.kb-bento-small__body {
  position: relative;
  z-index: 1;
  height: 100%;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* アイコンボックス */
.kb-bento-small__icon-box {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background: rgba(41, 42, 44, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.kb-bento-small__icon {
  color: var(--md-secondary);
}

.kb-bento-small--alt .kb-bento-small__icon-box {
  border-color: rgba(221, 183, 255, 0.2);
}

.kb-bento-small--alt .kb-bento-small__icon {
  color: var(--md-tertiary);
}

/* glass-panel（タイトル+メタ） */
.kb-bento-small__glass {
  background: rgba(41, 42, 44, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  padding: 1.25rem;
}

.kb-bento-small__title {
  font-family: 'Newsreader', 'Georgia', serif;
  font-style: italic;
  font-size: 1.125rem;
  font-weight: 400;
  color: var(--md-on-surface);
  margin: 0 0 0.375rem;
  line-height: 1.3;
  word-break: auto-phrase;
  overflow-wrap: anywhere;
}

.kb-bento-small__meta {
  font-family: 'Inter', sans-serif;
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--md-on-surface-variant);
  opacity: 0.7;
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
変更7: BentoMediumCard の完全削除
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

以下を削除:
- TSX: BentoMediumCard 関数定義全体
- CSS: .kb-bento-medium 関連のすべてのルール

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
変更8: 不要コードの削除
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TSX:
- BentoMediumCard 関数全体
- IconHub: grep で確認し、他で使用されていなければ関数定義ごと削除
- IconTrend: grep で確認し、他で使用されていなければ関数定義ごと削除

CSS:
- .kb-bento-large__bg, .kb-bento-large:hover .kb-bento-large__bg（旧テクスチャ）
- .kb-bento-large__glow（旧版の単一glow）
- .kb-bento-large__icon
- .kb-bento-medium 関連すべて

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ SVG属性の注意:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

JSX内のSVG属性は camelCase:
  basefrequency → baseFrequency
  numoctaves → numOctaves
  stitchtiles → stitchTiles
  stroke-width → strokeWidth
  viewbox → viewBox

feTurbulence の seed 属性は number 型であること。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ feTurbulence の Hydration 注意:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

hashToFloat と seed の計算は決定論的（同じidなら同じ結果）なので、
SSR/CSR間で不一致は起きない。
ただし Math.random() は絶対に使わないこと（Hydration Mismatch になる）。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ デグレ防止（絶対に変更しないこと）:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. streamCards は filtered.slice(3) にする（Bento 3枚に変更したため）。
   Bento表示済みカードがStreamに重複しない原則を維持。

2. TopBar内の検索フィールドは削除済み。復元しない。

3. ESLint修正済み箇所:
   - Number.parseInt を parseInt に戻さない
   - import順序を崩さない
   - Array.from(tagSet).toSorted() を .sort() に戻さない

4. .kb-bento-small__title の word-break: auto-phrase を維持。
   -webkit-line-clamp を再追加しない。

5. 行高さに固定値（height: 440px, auto-rows-[340px] 等）を使わない。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 確認:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. `pnpm dev` → ビルドエラーなし
2. Bentoグリッド3枚の視覚確認:
   - Large Card（8col×2row）:
     feTurbulenceノイズテクスチャ（primary色のグラデーション発光）
     gradient overlay + 多点Glow
     下部にglass-panel（backdrop-blur + border-left: primary + 半透明）
     glass-panel内にeyebrowバッジ + タイトル + タグ
   - Small Card 1（4col×1row）:
     feTurbulenceノイズ（secondary色グラデーション）
     glass風アイコンボックス + glass-panel(タイトル+メタ)
   - Small Card 2（4col×1row）:
     feTurbulenceノイズ（tertiary色グラデーション）
     アイコンボックスがtertiary色ボーダー
3. 3枚のカードのノイズパターンが互いに異なること（UUID由来）
4. hover: texture gradient scale, glow opacity, border-color 変化
5. 768px / 1024px / 1440px で確認
6. モバイル（< 768px）で1カラムスタック
7. `npm run test:lint` でエラーなし
8. Hydrationエラーがないこと（devコンソールでwarning確認）
9. デグレ確認:
   - TopBarに検索フィールドが復活していない
   - StreamにBento表示済みカードが重複していない（slice(3)）
   - カードタイトルが「...」で切れていない
```
