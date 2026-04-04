# kb.sakane.dev 改修: Bento Grid ビジュアルリデザイン v2

```
kb.sakane.dev リポジトリのランディングページ、Bentoグリッドのビジュアルをリデザインする。
画像アセットは一切使用しない。CSS/SVGのみで視覚的な豊かさを実現する。
以下のデザインリファレンス（stitchが生成したTailwind HTMLコード）の視覚表現を、
既存のバニラCSS（kb-landing.css）+ TSX実装に翻訳する。

■ デザイン3原則:
1. Generative Semantic Textures — 多層radial-gradientで「光の集積点」を表現。画像の代替
2. Physicality in Digital — gradient-to-t overlay + Glow で奥行き感を生成
3. Typographic Architecture — タグ先頭文字を巨大ウォーターマークとして背景に配置

■ カラー設計（MD3パレット4色でカードごとに色相を分離）:
  Large Card   → primary   #c2c1ff / #5e5ce6（紫青）
  Medium Card  → tertiary  #ddb7ff / #9541e4（紫ピンク）
  Small Card 1 → secondary #b9c8de（ブルーグレー）+ SVGノードグラフ
  Small Card 2 → error     #ffb4ab（ウォームコーラル）

■ 変更ファイル: components/KBLandingPage.tsx + styles/kb-landing.css

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
変更A: BentoLargeCard — 多層グラデーションテクスチャ + gradient overlay + eyebrow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

stitchの参照コード（Large Card部分）:
```html
<div class="col-span-8 ... h-80 flex flex-col justify-end p-8">
  <div class="absolute inset-0 opacity-40 mix-blend-overlay">
    <!-- stitchではここに画像 → CSSグラデーションで代替 -->
  </div>
  <div class="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
  <div class="relative">
    <span class="text-xs font-label uppercase tracking-[0.2em] text-primary mb-2 block">Foundational</span>
    <h3 class="font-serif text-3xl text-on-surface mb-2">Structural Intelligence</h3>
    <p class="font-body text-on-surface-variant max-w-md">...</p>
  </div>
</div>
```

TSXを以下に変更:
```tsx
function BentoLargeCard({ paper }: { paper: PaperCard }) {
  const watermarkChar = (paper.tags[0] ?? paper.title).charAt(0)
  const category = paper.tags[0] ?? 'Research'

  return (
    <Link href={paper.url} className='kb-bento-large'>
      {/* Layer 1: 多層グラデーション（画像の代替） */}
      <div className='kb-bento-large__texture' aria-hidden='true' />
      {/* Layer 2: gradient overlay（下→上のフェード） */}
      <div className='kb-bento-large__overlay' aria-hidden='true' />
      {/* Layer 3: ウォーターマーク */}
      <span className='kb-bento-large__watermark' aria-hidden='true'>{watermarkChar}</span>
      {/* Layer 4: コンテンツ */}
      <div className='kb-bento-large__content'>
        <span className='kb-bento-large__eyebrow'>{category}</span>
        <h3 className='kb-bento-large__title'>{paper.title}</h3>
        <div className='kb-bento-large__tags'>
          {paper.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      </div>
    </Link>
  )
}
```

変更点:
- __bg → __texture にリネーム
- __glow → __overlay にリネーム（stitch準拠の gradient-to-t オーバーレイ）
- IconHub 削除 → eyebrow カテゴリラベル
- __watermark 追加（tags[0]先頭文字。タグなしならタイトル先頭文字）

CSSの変更:

`.kb-bento-large__bg` と `.kb-bento-large__glow` を削除し、以下を新規作成:

```css
/* 多層グラデーション — 画像の代替として「光の集積点」を表現 */
.kb-bento-large__texture {
  position: absolute;
  inset: 0;
  opacity: 0.4;
  mix-blend-mode: overlay;
  transition: transform 0.7s ease;
  background:
    radial-gradient(ellipse at 25% 20%, rgba(194, 193, 255, 0.6) 0%, transparent 50%),
    radial-gradient(ellipse at 75% 70%, rgba(149, 65, 228, 0.4) 0%, transparent 45%),
    radial-gradient(ellipse at 50% 40%, rgba(94, 92, 230, 0.3) 0%, transparent 60%),
    radial-gradient(ellipse at 10% 80%, rgba(194, 193, 255, 0.2) 0%, transparent 40%);
}

.kb-bento-large:hover .kb-bento-large__texture {
  transform: scale(1.08);
}

/* gradient overlay — stitch の bg-gradient-to-t from-background 相当 */
.kb-bento-large__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, var(--md-background) 0%, rgba(18, 19, 21, 0.4) 50%, transparent 100%);
  pointer-events: none;
}

.kb-bento-large__watermark {
  position: absolute;
  right: -0.5rem;
  bottom: -1.5rem;
  font-family: 'Newsreader', 'Georgia', serif;
  font-style: italic;
  font-size: clamp(10rem, 20vw, 16rem);
  line-height: 1;
  color: rgba(255, 255, 255, 0.04);
  pointer-events: none;
  user-select: none;
  z-index: 0;
}

.kb-bento-large__eyebrow {
  font-family: 'Inter', sans-serif;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--md-primary);
  margin-bottom: 0.75rem;
  display: block;
}
```

`.kb-bento-large__icon` のCSSを削除。
`.kb-bento-large:hover .kb-bento-large__bg` ルールを削除（__textureのhoverで置き換え済み）。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
変更B: BentoMediumCard — tertiary色系テクスチャ + ウォーターマーク、decor削除
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

stitchの参照（Small Abstract Cardに対応）:
```html
<div class="col-span-4 ... flex flex-col justify-between">
  <div class="absolute top-4 right-4 opacity-5 pointer-events-none">
    <span class="font-serif italic text-9xl">C</span>
  </div>
  <div>
    <span class="material-symbols-outlined text-primary mb-4">architecture</span>
    <h3 class="font-serif text-2xl text-on-surface">Career Design</h3>
  </div>
  <p class="text-xs ... uppercase tracking-widest mt-auto">128 Entries</p>
</div>
```

TSXを以下に変更:
```tsx
function BentoMediumCard({ paper }: { paper: PaperCard }) {
  const dateText = React.useMemo(() => formatSafeDate(paper.date), [paper.date])
  const watermarkChar = (paper.tags[0] ?? paper.title).charAt(0)

  return (
    <Link href={paper.url} className='kb-bento-medium'>
      <div className='kb-bento-medium__texture' aria-hidden='true' />
      <span className='kb-bento-medium__watermark' aria-hidden='true'>{watermarkChar}</span>
      <div className='kb-bento-medium__body'>
        <span className='kb-bento-medium__icon'><IconTrend /></span>
        <h3 className='kb-bento-medium__title'>{paper.title}</h3>
        <p className='kb-bento-medium__meta'>{dateText}</p>
      </div>
    </Link>
  )
}
```

変更点:
- __decor（装飾サークル + IconBook）を完全削除
- __texture（tertiary色系グラデーション背景）を追加
- __watermark を追加

CSSの変更:

`.kb-bento-medium__decor` と `.kb-bento-medium:hover .kb-bento-medium__decor` を削除。

`.kb-bento-medium__body` から `padding-right: 1.5rem` と `max-width: 60%` を削除。

以下を新規追加:
```css
.kb-bento-medium__texture {
  position: absolute;
  inset: 0;
  opacity: 0.25;
  background:
    radial-gradient(ellipse at 70% 30%, rgba(221, 183, 255, 0.5) 0%, transparent 50%),
    radial-gradient(ellipse at 20% 80%, rgba(149, 65, 228, 0.3) 0%, transparent 45%);
  transition: transform 0.7s ease;
}

.kb-bento-medium:hover .kb-bento-medium__texture {
  transform: scale(1.06);
}

.kb-bento-medium__watermark {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-family: 'Newsreader', 'Georgia', serif;
  font-style: italic;
  font-size: clamp(6rem, 12vw, 10rem);
  line-height: 1;
  color: rgba(255, 255, 255, 0.04);
  pointer-events: none;
  user-select: none;
  z-index: 0;
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
変更C: BentoSmallCard — 2種のバリアント（SVGノードグラフ / ウォームコーラル）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

stitchの参照（Knowledge Graphカード）:
```html
<div class="col-span-4 ... border border-primary/5">
  <div class="absolute inset-0 opacity-10">
    <svg class="w-full h-full" viewbox="0 0 100 100">
      <circle cx="50" cy="50" fill="#c2c1ff" r="1"/>
      <circle cx="20" cy="30" fill="#c2c1ff" r="1"/>
      <circle cx="80" cy="40" fill="#c2c1ff" r="1"/>
      <circle cx="30" cy="70" fill="#c2c1ff" r="1"/>
      <line stroke="#c2c1ff" stroke-width="0.2" x1="50" x2="20" y1="50" y2="30"/>
      ...
    </svg>
  </div>
</div>
```

TSXを以下に変更:
```tsx
function BentoSmallCard({ paper, alt }: { paper: PaperCard; alt?: boolean }) {
  const dateText = React.useMemo(() => formatSafeDate(paper.date), [paper.date])
  const watermarkChar = (paper.tags[0] ?? paper.title).charAt(0)

  return (
    <Link href={paper.url} className={`kb-bento-small ${alt ? 'kb-bento-small--alt' : ''}`}>
      {/* default: SVGノードグラフ / alt: warm gradient */}
      {alt ? (
        <div className='kb-bento-small__texture' aria-hidden='true' />
      ) : (
        <svg className='kb-bento-small__graph' viewBox='0 0 100 100' aria-hidden='true'>
          <circle cx='50' cy='50' r='1.5' fill='#b9c8de' />
          <circle cx='20' cy='30' r='1' fill='#b9c8de' />
          <circle cx='80' cy='40' r='1' fill='#b9c8de' />
          <circle cx='30' cy='75' r='1' fill='#b9c8de' />
          <circle cx='75' cy='20' r='0.8' fill='#b9c8de' />
          <circle cx='65' cy='70' r='0.8' fill='#b9c8de' />
          <line x1='50' y1='50' x2='20' y2='30' stroke='#b9c8de' strokeWidth='0.3' />
          <line x1='50' y1='50' x2='80' y2='40' stroke='#b9c8de' strokeWidth='0.3' />
          <line x1='50' y1='50' x2='30' y2='75' stroke='#b9c8de' strokeWidth='0.3' />
          <line x1='50' y1='50' x2='75' y2='20' stroke='#b9c8de' strokeWidth='0.2' />
          <line x1='50' y1='50' x2='65' y2='70' stroke='#b9c8de' strokeWidth='0.2' />
          <line x1='20' y1='30' x2='75' y2='20' stroke='#b9c8de' strokeWidth='0.15' />
          <line x1='80' y1='40' x2='65' y2='70' stroke='#b9c8de' strokeWidth='0.15' />
        </svg>
      )}
      <span className='kb-bento-small__watermark' aria-hidden='true'>{watermarkChar}</span>
      <span className='kb-bento-small__icon'>
        {alt ? <IconBook /> : <IconFlask />}
      </span>
      <h4 className='kb-bento-small__title'>{paper.title}</h4>
      <p className='kb-bento-small__meta'>{dateText}</p>
    </Link>
  )
}
```

変更点:
- default（alt=false）: SVGノードグラフ背景（secondary色 #b9c8de）
- alt（alt=true）: warm gradient テクスチャ（error色 #ffb4ab）
- 両方にウォーターマーク追加

CSSの変更:

以下を新規追加:
```css
/* SVGノードグラフ背景（default variant） */
.kb-bento-small__graph {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.12;
  transition: opacity 0.3s;
}

.kb-bento-small:hover .kb-bento-small__graph {
  opacity: 0.2;
}

/* warm gradient テクスチャ（alt variant） */
.kb-bento-small__texture {
  position: absolute;
  inset: 0;
  opacity: 0.2;
  background:
    radial-gradient(ellipse at 60% 30%, rgba(255, 180, 171, 0.5) 0%, transparent 50%),
    radial-gradient(ellipse at 30% 80%, rgba(255, 180, 171, 0.25) 0%, transparent 45%);
  transition: transform 0.7s ease;
}

.kb-bento-small--alt:hover .kb-bento-small__texture {
  transform: scale(1.06);
}

.kb-bento-small__watermark {
  position: absolute;
  right: -0.25rem;
  bottom: -0.75rem;
  font-family: 'Newsreader', 'Georgia', serif;
  font-style: italic;
  font-size: clamp(5rem, 10vw, 8rem);
  line-height: 1;
  color: rgba(255, 255, 255, 0.04);
  pointer-events: none;
  user-select: none;
  z-index: 0;
}
```

`.kb-bento-small--alt` のborder-leftスタイルを変更:
```css
.kb-bento-small--alt {
  border-left: 2px solid rgba(255, 180, 171, 0.3);
}
```
（現在の primary 色から error 色に変更して色相分離を強調）

`.kb-bento-small--alt:hover` のborder-colorも変更:
```css
.kb-bento-small--alt:hover {
  border-color: rgba(255, 180, 171, 0.35);
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
変更D: 全Bentoカード共通 — ghost-border
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

.kb-bento-large, .kb-bento-medium, .kb-bento-small の border を統一:
  border: 1px solid rgba(145, 143, 160, 0.15);
（stitch の ghost-border 定義に準拠）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 不要になるコード:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TSX:
- IconHub: BentoLargeCardから削除。grep でIconHubの他の使用箇所を確認し、
  なければ関数定義ごと削除。

CSS:
- .kb-bento-large__bg（__textureで置き換え済み）
- .kb-bento-large:hover .kb-bento-large__bg
- .kb-bento-large__glow（__overlayで置き換え済み）
- .kb-bento-large__icon
- .kb-bento-medium__decor
- .kb-bento-medium:hover .kb-bento-medium__decor

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ SVGのstrokeWidth属性について:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

JSX内のSVG属性は camelCase で記述すること:
  stroke-width → strokeWidth
  viewbox → viewBox
これは以前のhydrationエラー修正と同じルール。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ デグレ防止（絶対に変更しないこと）:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. streamCards = filtered.slice(4) を維持すること。filtered全件に戻さない。
2. .kb-bento-grid の min-height: 440px + grid-template-rows: repeat(2, minmax(220px, auto)) を維持。
3. TopBar内の検索フィールドは削除済み。復元しない。
4. ESLint修正済み箇所:
   - Number.parseInt を parseInt に戻さない
   - IconExternal は削除済み。再追加しない
   - import順序を崩さない
   - Array.from(tagSet).toSorted() を .sort() に戻さない
5. .kb-bento-medium__title と .kb-bento-small__title の
   -webkit-line-clamp を再追加しない。word-break: auto-phrase を維持。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 確認:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. `pnpm dev` → ビルドエラーなし
2. Bentoグリッド4枚の視覚確認:
   - Large Card: 紫青系の多層グラデーション + 下からのfadeout + eyebrowラベル + ウォーターマーク
   - Medium Card: 紫ピンク系のテクスチャ + ウォーターマーク（装飾サークルなし）
   - Small Card 1: SVGノードグラフが背景に薄く表示 + ブルーグレー系
   - Small Card 2: ウォームコーラル系のテクスチャ + 左ボーダーがコーラル色
3. 4枚のカードが互いに異なる色相で、視覚的バリエーションがあること
4. hover時: texture/graphのscale or opacityが変化すること
5. 768px / 1024px 両方のビューポートで確認
6. `npm run test:lint` でエラーがないこと
7. デグレ確認:
   - TopBarに検索フィールドが復活していないこと
   - Streamに Bento表示済みカードが重複していないこと
   - カードタイトルが「...」で切れていないこと
```
