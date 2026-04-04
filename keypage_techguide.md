# Technical Guide: Advanced Meta-Data & Reading Progress Implementation

`Key Page: Japanese Academic Focus` ({{DATA:SCREEN:SCREEN_20}}) で提案した、Notion標準にはない高度なメタデータ表示と「Reading Progress」の実装方法を定義します。

---

## 1. Reliability, Citations, Impact の取得と表示

これらは、Notionデータベースの「プロパティ（Properties）」をソースとして、フロントエンド（Next.js）側でリッチなUIに変換します。

### A. Notion側の設定
Notionデータベースに以下のプロパティを追加します。
- `Reliability`: 数値（Number）プロパティ（例: 0.984）
- `Citations`: 数値（Number）プロパティ（例: 1204）
- `Impact`: 数値（Number）プロパティ（例: 8.9）

### B. 実装ロジック (Next.js)
`react-notion-x` が取得する `recordMap` からプロパティを抽出し、提案したデザインのコンポーネントへ流し込みます。

```tsx
// components/PostMetaStats.tsx
const PostMetaStats = ({ properties }) => {
  const reliability = properties['Reliability']?.[0][0] ?? '0';
  const citations = properties['Citations']?.[0][0] ?? '0';
  
  return (
    <div className="glass-card p-6">
      <h4>Reliability Index</h4>
      <div className="progress-bar">
        <div style={{ width: `${parseFloat(reliability) * 100}%` }} />
      </div>
      <span>{parseFloat(reliability) * 100}%</span>
      {/* ...Citations / Impact も同様 */}
    </div>
  );
}
```

---

## 2. Reading Progress (読了状況) の実装

これはNotionのデータではなく、ユーザーの**ブラウザ上での行動（スクロール位置）**をリアルタイムに計算して表示します。

### A. 実装ロジック
Reactの `useEffect` と `scroll` イベントリスナーを使用して、現在のスクロール位置の割合を算出します。

```tsx
const [progress, setProgress] = useState(0);

useEffect(() => {
  const handleScroll = () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const currentScroll = window.scrollY;
    setProgress((currentScroll / totalHeight) * 100);
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

### B. UIへの反映
算出された `progress` 値を、右側の「Reading Progress」ゲージの幅とパーセンテージ表示に反映させます。これにより、ユーザーがページを読み進めるにつれて、ゲージが動的に伸びていくインタラクティブな体験が実現します。

---

## 3. なぜこの方法が「知識層」に響くのか？

1. **情報の「鮮度」と「信頼性」の可視化**: 経営層や研究者は、情報を読む前にその「質」を判断したいと考えています。NotionのプロパティをUIの前面に出すことで、エビデンスに基づいたアーカイブであることを瞬時に伝えられます。
2. **読書体験のガイド**: 長文の論文において、自分が今どのあたりにいるのかを常に把握できることは、認知負荷を下げ、最後まで読み進めるモチベーションを維持するのに役立ちます。

このデータ連携により、`kb.sakane.dev` は単なる「Notionの表示」を超え、**プロフェッショナルな「インテリジェンス・ダッシュボード」**へと進化します。

---

# Academic Component Deep Dive: Math & Multi-column

Notionの標準的な表現を超え、`kb.sakane.dev` をプロフェッショナルな学術アーカイブへと進化させるための高度なコンポーネント定義です。

---

## 1. Mathematical Expressions (KaTeX)
数式は単なる記号ではなく、「思考の結晶」として扱います。

- **Styling**: 標準のフォントを維持しつつ、背景に微かな光（Glow）を配置。
- **Interaction**: 複雑な式にはホバー時に「展開」や「変数解説」を表示するツールチップを想定。
- **Alignment**: 中央揃えを基本とし、前後には十分なエディトリアルな余白（`my-12`）を確保。

---

## 2. Multi-column Academic Layout
Notionのカラム機能を、雑誌のような「柔軟なグリッド」に変換します。

- **Logic**: デスクトップでは2列または3列の並列配置。モバイルでは流動的に1カラムにスタック。
- **Visuals**: カラム間に「Ghost Border」（15%不透明度）を配置し、視覚的な分離と構造化を強調。
- **Use Case**: 比較分析、要約と詳細の並置、図解と解説の組み合わせ。

---

## 3. High-Fidelity Callouts & Quotes
情報の重要度を視覚的な「質感」で区別します。

- **Callout**: グラスモーフィズムを採用。背景のブラー効果により、本文から浮き上がって見える設計。
- **Blockquote**: `Newsreader Italic` を最大化。大きな開始クォートを配置し、文学的・学術的な風格を演出。

---

## 4. Why This Matters
経営層や研究者は、情報を「スキャン」し、重要な「構造」を瞬時に把握することを好みます。これらのコンポーネントは、情報の認知負荷を下げ、深い洞察への到達を加速させます。
