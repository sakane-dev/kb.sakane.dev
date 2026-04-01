import * as React from 'react'
import Link from 'next/link'
import {
  type ExtendedRecordMap,
  type Block
} from 'notion-types'
import {
  getBlockTitle,
  getDateValue,
  getTextContent,
  parsePageId
} from 'notion-utils'

import type * as types from '@/lib/types'
import * as config from '@/lib/config'
import { mapPageUrl } from '@/lib/map-page-url'

import { PageHead } from './PageHead'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaperCard {
  id: string
  title: string
  slug: string
  published: boolean
  date: string | null
  tags: string[]
  url: string
}

// ---------------------------------------------------------------------------
// Tag config — MD3 color system
// ---------------------------------------------------------------------------

const TAG_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  'Structual Intelligence': {
    bg: 'rgba(194,193,255,0.15)',
    text: '#c2c1ff',
    border: 'rgba(194,193,255,0.3)'
  },
  'Structural Intelligence': {
    bg: 'rgba(194,193,255,0.15)',
    text: '#c2c1ff',
    border: 'rgba(194,193,255,0.3)'
  },
  構造知性: {
    bg: 'rgba(194,193,255,0.15)',
    text: '#c2c1ff',
    border: 'rgba(194,193,255,0.3)'
  },
  'Career Design': {
    bg: 'rgba(221,183,255,0.15)',
    text: '#ddb7ff',
    border: 'rgba(221,183,255,0.3)'
  },
  'Co-Creation': {
    bg: 'rgba(185,200,222,0.15)',
    text: '#b9c8de',
    border: 'rgba(185,200,222,0.3)'
  },
  AI: {
    bg: 'rgba(255,180,171,0.12)',
    text: '#ffb4ab',
    border: 'rgba(255,180,171,0.25)'
  },
  RAG: {
    bg: 'rgba(194,193,255,0.10)',
    text: '#c2c1ff',
    border: 'rgba(194,193,255,0.2)'
  },
  Agent: {
    bg: 'rgba(221,183,255,0.10)',
    text: '#ddb7ff',
    border: 'rgba(221,183,255,0.2)'
  },
  Cybersecurity: {
    bg: 'rgba(255,180,171,0.15)',
    text: '#ffb4ab',
    border: 'rgba(255,180,171,0.3)'
  },
  Engineering: {
    bg: 'rgba(185,200,222,0.10)',
    text: '#b9c8de',
    border: 'rgba(185,200,222,0.2)'
  },
  'Full-Stack': {
    bg: 'rgba(185,200,222,0.10)',
    text: '#b9c8de',
    border: 'rgba(185,200,222,0.2)'
  },
  CCBR: {
    bg: 'rgba(255,180,171,0.12)',
    text: '#ffb4ab',
    border: 'rgba(255,180,171,0.25)'
  },
  DX: {
    bg: 'rgba(194,193,255,0.10)',
    text: '#c2c1ff',
    border: 'rgba(194,193,255,0.2)'
  }
}

const DEFAULT_TAG_STYLE = {
  bg: 'rgba(145,143,160,0.10)',
  text: '#918fa0',
  border: 'rgba(145,143,160,0.15)'
}

function getTagStyle(tag: string) {
  return TAG_CONFIG[tag] || DEFAULT_TAG_STYLE
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSafeDate(dateStr: string | null): string {
  if (!dateStr) return 'Draft'
  try {
    const parts = dateStr.split('-')
    if (parts.length !== 3) return dateStr
    const year = parts[0] ?? ''
    const month = parseInt(parts[1] ?? '1', 10)
    const day = parseInt(parts[2] ?? '1', 10)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthName = months[month - 1] || 'Jan'
    return `${monthName} ${day}, ${year}`
  } catch {
    return dateStr
  }
}

// ---------------------------------------------------------------------------
// Data extraction from Notion recordMap
// ---------------------------------------------------------------------------

function extractPapersFromRecordMap(
  recordMap: ExtendedRecordMap,
  site: types.Site
): PaperCard[] {
  const papers: PaperCard[] = []

  const collectionIds = Object.keys(recordMap.collection || {})
  if (collectionIds.length === 0) return papers

  const collectionId = collectionIds[0]!
  // Notion API returns double-nested: collection[id].value.value
  const collectionWrapper = recordMap.collection[collectionId]?.value as any
  const collection = collectionWrapper?.value ?? collectionWrapper
  if (!collection) return papers

  const schema = collection.schema || {}
  const schemaEntries = Object.entries(schema)

  const titleKey = schemaEntries.find(([, v]) => v.type === 'title')?.[0]
  const slugKey = schemaEntries.find(([, v]) => v.name?.toLowerCase() === 'slug')?.[0]
  const publishedKey = schemaEntries.find(([, v]) => v.name?.toLowerCase() === 'published')?.[0]
  const dateKey = schemaEntries.find(([, v]) => v.name?.toLowerCase() === 'date')?.[0]
  const tagsKey = schemaEntries.find(([, v]) => v.name?.toLowerCase() === 'tags')?.[0]

  const collectionQueryIds = Object.keys(recordMap.collection_query || {})
  let pageIds: string[] = []

  for (const cqId of collectionQueryIds) {
    const queryResults = recordMap.collection_query[cqId]
    if (queryResults) {
      const viewIds = Object.keys(queryResults)
      for (const viewId of viewIds) {
        const result = queryResults[viewId] as any
        if (result?.collection_group_results?.blockIds) {
          pageIds = result.collection_group_results.blockIds
          break
        }
        if (result?.blockIds) {
          pageIds = result.blockIds
          break
        }
      }
      if (pageIds.length > 0) break
    }
  }

  if (pageIds.length === 0) {
    for (const [blockId, blockData] of Object.entries(recordMap.block || {})) {
      const blockWrapper = blockData?.value as any
      const block = (blockWrapper?.value ?? blockWrapper) as Block
      if (
        block?.type === 'page' &&
        block?.parent_table === 'collection' &&
        block?.parent_id === collectionId
      ) {
        pageIds.push(blockId)
      }
    }
  }

  const searchParams = new URLSearchParams()
  const urlMapper = mapPageUrl(site, recordMap, searchParams)

  for (const pageId of pageIds) {
    const blockWrapper = recordMap.block[pageId]?.value as any
    const block = (blockWrapper?.value ?? blockWrapper) as Block
    if (!block) continue

    const properties = block.properties || {}

    let title = 'Untitled'
    if (titleKey && properties[titleKey]) {
      title = getTextContent(properties[titleKey]) || 'Untitled'
    } else {
      title = getBlockTitle(block, recordMap) || 'Untitled'
    }

    const slug = slugKey && properties[slugKey] ? getTextContent(properties[slugKey]) : ''

    let published = false
    if (publishedKey && properties[publishedKey]) {
      const val = properties[publishedKey]
      published = val?.[0]?.[0] === 'Yes'
    }

    let date: string | null = null
    if (dateKey && properties[dateKey]) {
      const dateVal = getDateValue(properties[dateKey])
      if (dateVal?.start_date) {
        date = dateVal.start_date
      }
    }

    const tags: string[] = []
    if (tagsKey && properties[tagsKey]) {
      const tagText = getTextContent(properties[tagsKey])
      if (tagText) {
        tags.push(
          ...tagText
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean)
        )
      }
    }

    const url = urlMapper(pageId)

    // Untitled（タイトル未設定）または unpublished はスキップ
    if (title === 'Untitled' || !published) continue

    papers.push({
      id: parsePageId(pageId, { uuid: false }) || pageId,
      title,
      slug,
      published,
      date,
      tags,
      url
    })
  }

  // 決定論的ソート（ハイドレーション不一致防止）
  papers.sort((a, b) => {
    if (a.published !== b.published) return a.published ? -1 : 1
    const dateA = a.date || ''
    const dateB = b.date || ''
    if (dateA !== dateB) return dateB.localeCompare(dateA)
    return a.id.localeCompare(b.id)
  })

  return papers
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TagBadge({ tag }: { tag: string }) {
  const style = getTagStyle(tag)
  return (
    <span
      className='kb-tag-badge'
      style={{
        background: style.bg,
        color: style.text,
        borderColor: style.border
      }}
    >
      {tag}
    </span>
  )
}

function FeaturedCard({ paper }: { paper: PaperCard }) {
  const dateText = React.useMemo(() => formatSafeDate(paper.date), [paper.date])

  return (
    <Link href={paper.url} className='kb-card kb-card--featured'>
      <div className='kb-card__bg-featured' />
      <div className='kb-card__content kb-card__content--featured'>
        <div className='kb-card__header'>
          <span className='kb-badge--primary'>Primary Thesis</span>
          <span className='kb-meta'>{paper.tags.length} topics</span>
        </div>
        <h3 className='kb-card__title--featured'>{paper.title}</h3>
        <div className='kb-card__tags'>
          {paper.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
        <div className='kb-card__footer'>
          <span className='kb-meta'>{dateText}</span>
          <span className='kb-arrow-btn'>→</span>
        </div>
      </div>
    </Link>
  )
}

function GridCard({
  paper,
  variant
}: {
  paper: PaperCard
  variant: 'image' | 'solid'
}) {
  return (
    <Link
      href={paper.url}
      className={`kb-card kb-card--grid ${variant === 'image' ? 'kb-card--with-bg' : 'kb-card--solid'}`}
    >
      {variant === 'image' && (
        <>
          <div className='kb-card__bg-grid' />
          <div className='kb-card__gradient' />
        </>
      )}
      <div
        className={`kb-card__content kb-card__content--grid ${variant === 'image' ? 'kb-card__content--bottom' : ''}`}
      >
        {variant === 'solid' && (
          <div className='kb-card__icon-box'>
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth={1.5}
            >
              <path d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
            </svg>
          </div>
        )}
        <h3 className='kb-card__title--grid'>{paper.title}</h3>
        <div className='kb-card__meta-row'>
          {paper.tags.slice(0, 2).map((tag, i) => (
            <React.Fragment key={tag}>
              {i > 0 && <span className='kb-meta-dot'>·</span>}
              <span className='kb-meta'>{tag}</span>
            </React.Fragment>
          ))}
          {paper.published && (
            <>
              <span className='kb-meta-dot'>·</span>
              <span className='kb-meta kb-meta--accent'>Published</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}

function ActivityRow({ paper }: { paper: PaperCard }) {
  return (
    <Link href={paper.url} className='kb-row'>
      <div className='kb-row__icon'>
        <svg
          width='18'
          height='18'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth={1.5}
        >
          <path d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
        </svg>
      </div>
      <div className='kb-row__body'>
        <h4 className='kb-row__title'>{paper.title}</h4>
        <div className='kb-row__meta'>
          {paper.tags.slice(0, 2).map((tag, i) => (
            <React.Fragment key={tag}>
              {i > 0 && <span>·</span>}
              <span>{tag}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className='kb-row__end'>
        {paper.published ? (
          <span className='kb-status kb-status--pub'>Published</span>
        ) : (
          <span className='kb-status kb-status--draft'>Draft</span>
        )}
      </div>
      <svg
        className='kb-row__chevron'
        width='16'
        height='16'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth={2}
      >
        <path d='M9 18l6-6-6-6' />
      </svg>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function KBLandingPage({
  site,
  recordMap,
  pageId
}: {
  site: types.Site
  recordMap: ExtendedRecordMap
  pageId: string
}) {
  const [activeTag, setActiveTag] = React.useState<string | null>(null)

  // サーバーとクライアントで完全に同一の値にする（Hydration Error 防止）
  const currentYear = React.useMemo(() => new Date().getFullYear(), [])

  const papers = React.useMemo(
    () => extractPapersFromRecordMap(recordMap, site),
    [recordMap, site]
  )

  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>()
    // published 論文のみからタグを集計（"0 research domains" バグ対策）
    for (const paper of papers) {
      if (!paper.published) continue
      for (const tag of paper.tags) tagSet.add(tag)
    }
    return Array.from(tagSet).sort()
  }, [papers])

  const filtered = React.useMemo(() => {
    if (!activeTag) return papers
    return papers.filter((p) => p.tags.includes(activeTag))
  }, [papers, activeTag])

  const featured = filtered.find((p) => p.published) || filtered[0]
  const rest = filtered.filter((p) => p !== featured)
  const gridCards = rest.slice(0, 5)
  const listCards = rest.slice(5)

  const publishedCount = papers.filter((p) => p.published).length

  return (
    <>
      <PageHead
        pageId={pageId}
        site={site}
        title={site.name}
        description={config.description}
        url={`https://${site.domain}`}
      />

      <div className='kb-landing'>
        {/* Top Bar */}
        <header className='kb-topbar'>
          <div className='kb-topbar__inner'>
            <div className='kb-topbar__brand'>
              <span className='kb-topbar__logo'>The Archive</span>
              <span className='kb-topbar__label'>Curated Intelligence</span>
            </div>
            <nav className='kb-topbar__nav'>
              <a
                href='https://www.sakane.dev/'
                className='kb-topbar__link'
                target='_blank'
                rel='noopener noreferrer'
              >
                Portfolio
              </a>
              {config.linkedin && (
                <a
                  href={`https://linkedin.com/in/${config.linkedin}`}
                  className='kb-topbar__link'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  LinkedIn
                </a>
              )}
              {config.github && (
                <a
                  href={`https://github.com/${config.github}`}
                  className='kb-topbar__link'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  GitHub
                </a>
              )}
            </nav>
          </div>
        </header>

        <main className='kb-main'>
          {/* Hero */}
          <section className='kb-hero'>
            <h1 className='kb-hero__title'>Collections</h1>
            <p className='kb-hero__sub'>
              構造知性の軌跡 — A curated mapping of technical intelligence,
              architectural frameworks, and strategic insights across{' '}
              {papers.length} documents and {allTags.length} research domains.
            </p>
            <div className='kb-filters'>
              <button
                className={`kb-chip ${activeTag === null ? 'kb-chip--active' : ''}`}
                onClick={() => setActiveTag(null)}
              >
                All Intelligence
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={`kb-chip ${activeTag === tag ? 'kb-chip--active' : ''}`}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          {/* Bento Grid */}
          {filtered.length > 0 && (
            <section className='kb-bento'>
              {featured && <FeaturedCard paper={featured} />}
              {gridCards.map((paper, i) => (
                <GridCard
                  key={paper.id}
                  paper={paper}
                  variant={i % 3 === 0 ? 'image' : 'solid'}
                />
              ))}
            </section>
          )}

          {/* Activity List */}
          {listCards.length > 0 && (
            <section className='kb-activity'>
              <div className='kb-activity__head'>
                <h3 className='kb-activity__title'>More Intelligence</h3>
                <p className='kb-activity__sub'>
                  {listCards.length} additional documents
                </p>
              </div>
              <div className='kb-activity__list'>
                {listCards.map((paper) => (
                  <ActivityRow key={paper.id} paper={paper} />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <div className='kb-empty'>
              <p>No documents found for this filter.</p>
            </div>
          )}
        </main>

        <footer className='kb-footer'>
          <span suppressHydrationWarning>
            © {currentYear} {config.author}
          </span>
          <span className='kb-footer__dot'>·</span>
          <span>{publishedCount} published</span>
          <span className='kb-footer__dot'>·</span>
          <span>{papers.length} total</span>
        </footer>
      </div>
    </>
  )
}
