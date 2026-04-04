# kb.sakane.dev 改修: Bento Grid リデザイン v3

```
kb.sakane.dev リポジトリのランディングページ、Bentoグリッドを3分割レイアウトに再設計する。
画像アセットは一切使用しない。CSS/SVGのみで視覚的な豊かさを実現する。
ウォーターマーク文字は廃止し、カードごとに異なるテクスチャパターンでアイデンティティを出す。

■ デザイン原則:
1. Glass-panel — Large Cardのコンテンツをglass-panel（backdrop-blur + 半透明背景）の上に浮かせる
2. Multi-point Glow — filter: blur(20px) の発光体を複数の絶対位置に配置し、organic（有機的）な光の分布を作る
3. テクスチャパターン差別化 — 各カードのビジュアルパターン自体をアイデンティティにする（文字ウォーターマーク不使用）

■ レイアウト変更: 4分割 → 3分割
  現在: 4col × 2row（Large + Medium + Small×2 = 4枚）
  変更: Large 1枚（8col×2row）+ Small 2枚（4col×1row each）= 3枚

■ カラー設計:
  Large Card   → primary   #c2c1ff / #5e5ce6
  Small Card 1 → secondary #b9c8de + SVGノードグラフ
  Small Card 2 → tertiary  #ddb7ff + 抽象グラデーション

■ 変更ファイル: components/KBLandingPage.tsx + styles/kb-landing.css

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
変更1: カード配分ロジック（メインコンポーネント）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KBLandingPage関数内のカード変数を変更:

変更前:
  const featured = filtered[0]
  const mediumCard = filtered[1]
  const smallCards = filtered.slice(2, 4)
  const streamCards = filtered.slice(4)

変更後:
  const featured = filtered[0]
  const smallCards = filtered.slice(1, 3)
  const streamCards = filtered.slice(3)

mediumCard 変数を削除する。

JSXのBentoグリッド部分を変更:

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
変更2: グリッドCSS — 12カラムシステムに変更
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

.kb-bento-grid のメディアクエリを変更:

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

（height / min-height は grid-auto-rows で制御。固定値なし。）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
変更3: BentoLargeCard — glass-panel + multi-point glow + 多層テクスチャ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TSXを以下に変更:
```tsx
function BentoLargeCard({ paper }: { paper: PaperCard }) {
  const category = paper.tags[0] ?? 'Research'

  return (
    <Link href={paper.url} className='kb-bento-large'>
      {/* Layer 1: 多層グラデーション（画像代替テクスチャ） */}
      <div className='kb-bento-large__texture' aria-hidden='true' />
      {/* Layer 2: gradient overlay（下→上のfadeout） */}
      <div className='kb-bento-large__overlay' aria-hidden='true' />
      {/* Layer 3: 多点Glow */}
      <div className='kb-bento-large__glow kb-bento-large__glow--a' aria-hidden='true' />
      <div className='kb-bento-large__glow kb-bento-large__glow--b' aria-hidden='true' />
      {/* Layer 4: glass-panelコンテンツ */}
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

変更点:
- IconHub 削除、ウォーターマーク不使用
- __glow を2つの個別要素（__glow--a, --b）に分離（multi-point glow）
- __glass（glass-panel）でコンテンツを包む
- eyebrow カテゴリラベル追加

CSS:

既存の .kb-bento-large 関連CSS（__bg, __glow, __icon 含む）をすべて削除し、以下で置き換え:

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

/* 多層グラデーションテクスチャ */
.kb-bento-large__texture {
  position: absolute;
  inset: 0;
  opacity: 0.4;
  mix-blend-mode: overlay;
  transition: transform 1s ease;
  background:
    radial-gradient(ellipse at 25% 15%, rgba(194, 193, 255, 0.6) 0%, transparent 50%),
    radial-gradient(ellipse at 75% 70%, rgba(149, 65, 228, 0.4) 0%, transparent 45%),
    radial-gradient(ellipse at 50% 40%, rgba(94, 92, 230, 0.3) 0%, transparent 60%),
    radial-gradient(ellipse at 10% 85%, rgba(194, 193, 255, 0.2) 0%, transparent 40%);
}

.kb-bento-large:hover .kb-bento-large__texture {
  transform: scale(1.05);
}

/* gradient overlay */
.kb-bento-large__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top right, rgba(18, 19, 21, 0.9) 0%, transparent 50%, rgba(18, 19, 21, 0.4) 100%);
  pointer-events: none;
}

/* multi-point glow */
.kb-bento-large__glow {
  position: absolute;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  filter: blur(25px);
  pointer-events: none;
  opacity: 0.6;
  transition: opacity 0.5s;
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
  z-index: 1;
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
変更4: BentoSmallCard — 2バリアント（SVGノードグラフ / 抽象グラデーション）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TSXを以下に変更:
```tsx
function BentoSmallCard({ paper, alt }: { paper: PaperCard; alt?: boolean }) {
  const dateText = React.useMemo(() => formatSafeDate(paper.date), [paper.date])
  const category = paper.tags[0] ?? 'Research'

  return (
    <Link href={paper.url} className={`kb-bento-small ${alt ? 'kb-bento-small--alt' : ''}`}>
      {/* テクスチャ: default=SVGノードグラフ / alt=抽象グラデーション */}
      {alt ? (
        <div className='kb-bento-small__texture' aria-hidden='true' />
      ) : (
        <svg className='kb-bento-small__graph' viewBox='0 0 100 100' aria-hidden='true'>
          <circle cx='50' cy='50' r='1.5' fill='#b9c8de' />
          <circle cx='18' cy='28' r='1' fill='#b9c8de' />
          <circle cx='82' cy='38' r='1' fill='#b9c8de' />
          <circle cx='28' cy='76' r='1' fill='#b9c8de' />
          <circle cx='76' cy='18' r='0.8' fill='#b9c8de' />
          <circle cx='68' cy='72' r='0.8' fill='#b9c8de' />
          <line x1='50' y1='50' x2='18' y2='28' stroke='#b9c8de' strokeWidth='0.3' />
          <line x1='50' y1='50' x2='82' y2='38' stroke='#b9c8de' strokeWidth='0.3' />
          <line x1='50' y1='50' x2='28' y2='76' stroke='#b9c8de' strokeWidth='0.3' />
          <line x1='50' y1='50' x2='76' y2='18' stroke='#b9c8de' strokeWidth='0.2' />
          <line x1='50' y1='50' x2='68' y2='72' stroke='#b9c8de' strokeWidth='0.2' />
          <line x1='18' y1='28' x2='76' y2='18' stroke='#b9c8de' strokeWidth='0.15' />
          <line x1='82' y1='38' x2='68' y2='72' stroke='#b9c8de' strokeWidth='0.15' />
        </svg>
      )}
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
- ウォーターマーク不使用
- default: SVGノードグラフ背景（secondary #b9c8de）
- alt: 抽象グラデーション（tertiary #ddb7ff）
- アイコンを glass-panel 風ボックスに格納（stitchの w-12 h-12 rounded-xl glass-panel 参照）
- タイトル + メタ情報を small glass-panel に格納
- メタ情報に日付 + カテゴリ（タグ[0]）を表示（情報密度を維持）

CSS:

既存の .kb-bento-small 関連CSSをすべて削除し、以下で置き換え:

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

/* alt variant hover */
.kb-bento-small--alt:hover {
  border-color: rgba(221, 183, 255, 0.25);
}

/* SVGノードグラフ背景（default） */
.kb-bento-small__graph {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.1;
  transition: opacity 0.3s;
}

.kb-bento-small:hover .kb-bento-small__graph {
  opacity: 0.2;
}

/* 抽象グラデーション（alt） */
.kb-bento-small__texture {
  position: absolute;
  inset: 0;
  opacity: 0.2;
  background:
    radial-gradient(ellipse at 65% 25%, rgba(221, 183, 255, 0.5) 0%, transparent 50%),
    radial-gradient(ellipse at 25% 80%, rgba(149, 65, 228, 0.3) 0%, transparent 45%);
  transition: transform 0.7s ease;
}

.kb-bento-small--alt:hover .kb-bento-small__texture {
  transform: scale(1.06);
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

/* アイコンボックス（glass風） */
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

/* small glass-panel（タイトル + メタ） */
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
変更5: BentoMediumCard の完全削除
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

以下を削除:
- TSX: BentoMediumCard 関数定義全体
- CSS: .kb-bento-medium 関連のすべてのルール
  （.kb-bento-medium, .kb-bento-medium__body, .kb-bento-medium__icon,
   .kb-bento-medium__title, .kb-bento-medium__meta, .kb-bento-medium__decor,
   .kb-bento-medium:hover 系すべて）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
変更6: 不要になるコード
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TSX:
- BentoMediumCard 関数全体
- IconHub: BentoLargeCard から削除。grep でIconHubの他の使用箇所を確認し、
  なければ関数定義ごと削除
- IconTrend: BentoMediumCard でのみ使用。MediumCard削除に伴い、
  grep で他の使用箇所を確認し、なければ関数定義ごと削除

CSS:
- .kb-bento-large__bg, .kb-bento-large:hover .kb-bento-large__bg
- .kb-bento-large__glow（旧版。__glow--a, --bで置き換え済み）
- .kb-bento-large__icon
- .kb-bento-medium 関連すべて
- .kb-bento-small--alt の旧 border-left ルール（新CSSで再定義済み）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ SVG属性の注意:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

JSX内のSVG属性は camelCase:
  stroke-width → strokeWidth
  viewbox → viewBox
  fill, stroke はそのまま。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ デグレ防止（絶対に変更しないこと）:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. streamCards のスライスは Bento枚数に合わせて filtered.slice(3) に変更する。
   これはデグレではなくレイアウト変更に伴う必然的変更。
   ただし「Bento表示済みカードがStreamに重複しない」原則は維持すること。

2. TopBar内の検索フィールドは削除済み。復元しない。

3. ESLint修正済み箇所:
   - Number.parseInt を parseInt に戻さない
   - import順序を崩さない
   - Array.from(tagSet).toSorted() を .sort() に戻さない

4. .kb-bento-small__title の word-break: auto-phrase を維持。
   -webkit-line-clamp を再追加しない。

5. 行高さに固定値（height: 440px, auto-rows-[340px] 等）を使わない。
   min-height または auto を使用すること。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 確認:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. `pnpm dev` → ビルドエラーなし
2. Bentoグリッド3枚の視覚確認:
   - Large Card（8col×2row）:
     多層グラデーションテクスチャ + gradient overlay + 多点Glow
     下部にglass-panel（backdrop-blur + 半透明 + 左ボーダーprimary色）
     glass-panel内にeyebrowバッジ + タイトル + タグ
   - Small Card 1（4col×1row）:
     SVGノードグラフが背景に薄く表示（secondary色）
     上部にglass風アイコンボックス、下部にglass-panelでタイトル+メタ
   - Small Card 2（4col×1row）:
     tertiary色のグラデーションテクスチャ
     上部にglass風アイコンボックス（tertiary色ボーダー）、下部にglass-panel
3. 3枚のカードが互いに異なるテクスチャパターンで視覚的に区別できること
4. hover時のインタラクション（texture scale, glow opacity, border-color）
5. 768px / 1024px / 1440px のビューポートで確認
6. モバイル（< 768px）で1カラムにスタックされること
7. `npm run test:lint` でエラーがないこと
8. デグレ確認:
   - TopBarに検索フィールドが復活していないこと
   - StreamにBento表示済みカードが重複していないこと（slice(3)）
   - カードタイトルが「...」で切れていないこと
   - 行高さが固定値になっていないこと
```
