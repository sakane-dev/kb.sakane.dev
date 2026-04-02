import React from 'react'
import Link from 'next/link'

export function AppLayout({ children, disabled = false }: { children: React.ReactNode; disabled?: boolean }) {
  if (disabled) return <>{children}</>
  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary/30 min-h-screen flex dark">
      {/* サイドバー：デスクトップ時のみ表示 */}
      <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-[#1b1c1e] z-50 border-r border-[#343537]/15">
        <div className="p-8">
          <div className="text-xl font-bold tracking-tight text-[#c2c1ff] font-body mb-1">The Archive</div>
          <div className="text-[10px] uppercase tracking-widest text-outline font-label">Curated Intelligence</div>
        </div>
        <div className="mt-4 flex-1">
          <nav className="space-y-1">
            <Link href="/" className="text-[#c2c1ff] font-semibold border-r-2 border-[#c2c1ff] bg-[#292a2c]/50 px-6 py-3 flex items-center gap-3 transition-colors duration-200">
              <span className="material-symbols-outlined text-sm">folder_special</span>
              <span className="font-label text-sm">Collections</span>
            </Link>
          </nav>
        </div>
        <div className="p-6 border-t border-outline-variant/10">
          <div className="flex items-center gap-3 mb-6">
            <div>
              <div className="text-sm font-semibold text-on-surface">Yasuyuki Sakane</div>
              <div className="text-[10px] uppercase text-outline tracking-tighter">Researcher</div>
            </div>
          </div>
        </div>
      </aside>

      {/* メインコンテンツ領域 */}
      <main className="flex-1 md:ml-64 min-h-screen relative flex flex-col">
        {/* トップナビゲーション */}
        <header className="flex justify-between items-center px-8 h-16 fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] z-40 bg-[#121315]/80 backdrop-blur-xl border-b border-[#343537]/15">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 text-outline font-label text-[11px] uppercase tracking-[0.2em]">
              <span>kb.sakane.dev</span>
            </div>
          </div>
        </header>

        {/* ページコンテンツが描画される領域 */}
        <div className="pt-16 flex-1 w-full">
          {children}
        </div>
      </main>

      {/* モバイル用フローティングボタンのプレースホルダー */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button className="w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </div>
  )
}
