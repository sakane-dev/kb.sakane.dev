import Link from 'next/link'
import { type Block, type ExtendedRecordMap } from 'notion-types'
import {
  getBlockTitle,
  getDateValue,
  getTextContent,
  parsePageId
} from 'notion-utils'
import * as React from 'react'

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

const TAG_CONFIG: Record<string, { bg: string; text: string; border: string }> =
  {
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
    const month = Number.parseInt(parts[1] ?? '1', 10)
    const day = Number.parseInt(parts[2] ?? '1', 10)
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ]
    const monthName = months[month - 1] ?? 'Jan'
    return `${monthName} ${day}, ${year}`
  } catch {
    return dateStr
  }
}

/**
 * 文字列（Notion UUID等）から 0〜1 の決定論的な浮動小数点を生成する。
 * SVGの feTurbulence baseFrequency のシード値に使用。
 */
function hashToFloat(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.codePointAt(i) ?? 0
    hash = Math.trunc((hash << 5) - hash + char)
  }
  return Math.abs(hash % 1000) / 1000
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
  const schemaEntries = Object.entries(schema) as [string, any][]

  const titleKey = schemaEntries.find(([, v]) => v.type === 'title')?.[0]
  const slugKey = schemaEntries.find(
    ([, v]) => v.name?.toLowerCase() === 'slug'
  )?.[0]
  const publishedKey = schemaEntries.find(
    ([, v]) => v.name?.toLowerCase() === 'published'
  )?.[0]
  const dateKey = schemaEntries.find(
    ([, v]) => v.name?.toLowerCase() === 'date'
  )?.[0]
  const tagsKey = schemaEntries.find(
    ([, v]) => v.name?.toLowerCase() === 'tags'
  )?.[0]

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

    const slug =
      slugKey && properties[slugKey] ? getTextContent(properties[slugKey]) : ''

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
// Icons (SVG inline)
// ---------------------------------------------------------------------------

function IconFlask() {
  return (
    <svg
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
    >
      <path d='M9 3h6M8.5 3v6.5L5 15.5a3 3 0 002.7 4.5h8.6a3 3 0 002.7-4.5L15.5 9.5V3' />
    </svg>
  )
}

function IconBook() {
  return (
    <svg
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
    >
      <path d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
    >
      <circle cx='11' cy='11' r='8' />
      <path d='m21 21-4.35-4.35' />
    </svg>
  )
}

function IconDocument() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
    >
      <path d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
    </svg>
  )
}

function IconGraph() {
  return (
    <svg
      width='32'
      height='32'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
    >
      <path d='M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22' />
    </svg>
  )
}

function IconArrow() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={2}
    >
      <path d='M7 17L17 7M17 7H7M17 7v10' />
    </svg>
  )
}

function IconDashboard() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
    >
      <rect x='3' y='3' width='7' height='7' rx='1' />
      <rect x='14' y='3' width='7' height='7' rx='1' />
      <rect x='3' y='14' width='7' height='7' rx='1' />
      <rect x='14' y='14' width='7' height='7' rx='1' />
    </svg>
  )
}

function IconTag() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
    >
      <path d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z' />
    </svg>
  )
}

function IconLibrary() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
    >
      <path d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
    </svg>
  )
}

function IconResearch() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
    >
      <path d='M9 3h6M8.5 3v6.5L5 15.5a3 3 0 002.7 4.5h8.6a3 3 0 002.7-4.5L15.5 9.5V3' />
    </svg>
  )
}

function IconArchive() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
    >
      <path d='M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' />
    </svg>
  )
}

function IconTeam() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
    >
      <path d='M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' />
    </svg>
  )
}

function IconHelp() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
    >
      <circle cx='12' cy='12' r='10' />
      <path d='M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01' />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.5}
    >
      <circle cx='12' cy='12' r='3' />
      <path d='M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' />
    </svg>
  )
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
      <svg className='kb-dynamic-texture__svg' style={{ opacity }}>
        <filter id={filterId}>
          <feTurbulence
            type='fractalNoise'
            baseFrequency={freq}
            numOctaves={3}
            seed={Math.abs(
              (seed.codePointAt(0) ?? 0) * 127 + (seed.codePointAt(1) ?? 0) * 31
            )}
            stitchTiles='stitch'
          />
        </filter>
        <rect width='100%' height='100%' filter={`url(#${filterId})`} />
      </svg>
      <div
        className='kb-dynamic-texture__gradient'
        style={{
          background: `radial-gradient(ellipse at 30% 25%, ${color} 0%, transparent 55%),
                       radial-gradient(ellipse at 75% 70%, ${color} 0%, transparent 50%)`
        }}
      />
      <div className='kb-dynamic-texture__reflection' />
    </div>
  )
}

const SIDEBAR_NAV = [
  { icon: IconDashboard, label: 'DASHBOARD' },
  { icon: IconLibrary, label: 'LIBRARY' },
  { icon: IconResearch, label: 'RESEARCH' },
  { icon: IconArchive, label: 'ARCHIVE' },
  { icon: IconTeam, label: 'TEAM' }
]

function SidebarNav({
  allTags,
  activeTag,
  onTagSelect,
  publishedCount,
  totalCount
}: {
  allTags: string[]
  activeTag: string | null
  onTagSelect: (tag: string | null) => void
  publishedCount: number
  totalCount: number
}) {
  return (
    <aside className='kb-sidebar'>
      <div className='kb-sidebar__top'>
        <span className='kb-sidebar__logo'>The Digital Archive</span>
        <p className='kb-sidebar__section-label'>Workspace: Pro Intelligence</p>
        <nav className='kb-sidebar__nav'>
          {SIDEBAR_NAV.map(({ icon: Icon, label }) => (
            <button
              key={label}
              className={`kb-sidebar__link ${label === 'DASHBOARD' && activeTag === null ? 'kb-sidebar__link--active' : ''}`}
              onClick={
                label === 'DASHBOARD' ? () => onTagSelect(null) : undefined
              }
            >
              <span className='kb-sidebar__link-icon'>
                <Icon />
              </span>
              {label}
            </button>
          ))}
        </nav>

        {allTags.length > 0 && (
          <>
            <p
              className='kb-sidebar__section-label'
              style={{ marginTop: '1.5rem' }}
            >
              Filter by Tag
            </p>
            <nav className='kb-sidebar__nav'>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={`kb-sidebar__link ${activeTag === tag ? 'kb-sidebar__link--active' : ''}`}
                  onClick={() => onTagSelect(activeTag === tag ? null : tag)}
                >
                  <span className='kb-sidebar__link-icon'>
                    <IconTag />
                  </span>
                  {tag}
                </button>
              ))}
            </nav>
          </>
        )}
      </div>

      <div className='kb-sidebar__bottom'>
        <div className='kb-sidebar__bottom-nav'>
          <a href='#' className='kb-sidebar__link'>
            <span className='kb-sidebar__link-icon'>
              <IconHelp />
            </span>
            HELP
          </a>
          <a href='#' className='kb-sidebar__link'>
            <span className='kb-sidebar__link-icon'>
              <IconSettings />
            </span>
            SETTINGS
          </a>
        </div>
        <div className='kb-sidebar__profile'>
          <div className='kb-sidebar__avatar'>
            {(config.author?.[0] ?? 'S').toUpperCase()}
          </div>
          <div className='kb-sidebar__profile-info'>
            <p className='kb-sidebar__profile-name'>{config.author}</p>
            <p className='kb-sidebar__profile-sub'>
              {publishedCount} published · {totalCount} total
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function BentoLargeCard({ paper }: { paper: PaperCard }) {
  const category = paper.tags[0] ?? 'Research'

  return (
    <Link href={paper.url} className='kb-bento-large'>
      <DynamicTexture
        seed={paper.id}
        color='rgba(194, 193, 255, 0.35)'
        opacity={0.1}
      />
      <div className='kb-bento-large__overlay' aria-hidden='true' />
      <div
        className='kb-bento-large__glow kb-bento-large__glow--a'
        aria-hidden='true'
      />
      <div
        className='kb-bento-large__glow kb-bento-large__glow--b'
        aria-hidden='true'
      />
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

function BentoSmallCard({ paper, alt }: { paper: PaperCard; alt?: boolean }) {
  const dateText = React.useMemo(() => formatSafeDate(paper.date), [paper.date])
  const category = paper.tags[0] ?? 'Research'

  const textureColor = alt
    ? 'rgba(221, 183, 255, 0.35)'
    : 'rgba(185, 200, 222, 0.35)'

  return (
    <Link
      href={paper.url}
      className={`kb-bento-small ${alt ? 'kb-bento-small--alt' : ''}`}
    >
      <DynamicTexture seed={paper.id} color={textureColor} opacity={0.06} />
      <div className='kb-bento-small__body'>
        <div className='kb-bento-small__icon-box'>
          <span className='kb-bento-small__icon'>
            {alt ? <IconBook /> : <IconFlask />}
          </span>
        </div>
        <div className='kb-bento-small__glass'>
          <h4 className='kb-bento-small__title'>{paper.title}</h4>
          <p className='kb-bento-small__meta'>
            {dateText} · {category}
          </p>
        </div>
      </div>
    </Link>
  )
}

const STREAM_ICON_COLORS = [
  '',
  'kb-stream-item__icon--tertiary',
  'kb-stream-item__icon--secondary'
] as const

function StreamItem({ paper, index }: { paper: PaperCard; index: number }) {
  const dateText = React.useMemo(() => formatSafeDate(paper.date), [paper.date])
  const category = paper.tags[0] ?? 'Research'
  const colorClass = STREAM_ICON_COLORS[index % 3] ?? ''

  return (
    <Link href={paper.url} className='kb-stream-item'>
      <div className='kb-stream-item__left'>
        <div className={`kb-stream-item__icon-box ${colorClass}`}>
          <IconDocument />
        </div>
        <div>
          <h4 className='kb-stream-item__title'>{paper.title}</h4>
          <div className='kb-stream-item__meta'>
            <span className='kb-stream-item__date'>{dateText}</span>
            <span className='kb-stream-item__dot' />
            <span className='kb-stream-item__category'>{category}</span>
          </div>
        </div>
      </div>
      <div className='kb-stream-item__right'>
        <div className='kb-stream-item__status'>
          <span className='kb-stream-item__status-dot' />
          <span className='kb-stream-item__status-text'>Published</span>
        </div>
        <span className='kb-stream-item__more' aria-hidden='true'>
          ···
        </span>
      </div>
    </Link>
  )
}

function CTASection() {
  return (
    <section className='kb-cta'>
      <div className='kb-cta__inner'>
        <div className='kb-cta__circles' aria-hidden='true'>
          <div className='kb-cta__circle kb-cta__circle--lg' />
          <div className='kb-cta__circle kb-cta__circle--md' />
          <div className='kb-cta__circle kb-cta__circle--sm' />
        </div>
        <div className='kb-cta__content'>
          <div className='kb-cta__icon-box'>
            <IconGraph />
          </div>
          <h2 className='kb-cta__title'>Explore the Portfolio</h2>
          <p className='kb-cta__desc'>
            Discover the architect behind these insights — technical projects,
            career design frameworks, and strategic intelligence at sakane.dev.
          </p>
          <a
            href='https://www.sakane.dev/'
            className='kb-cta__btn'
            target='_blank'
            rel='noopener noreferrer'
          >
            Visit Portfolio <IconArrow />
          </a>
        </div>
      </div>
    </section>
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
  const [searchQuery, setSearchQuery] = React.useState('')

  const currentYear = React.useMemo(() => new Date().getFullYear(), [])

  const papers = React.useMemo(
    () => extractPapersFromRecordMap(recordMap, site),
    [recordMap, site]
  )

  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>()
    for (const paper of papers) {
      if (!paper.published) continue
      for (const tag of paper.tags) tagSet.add(tag)
    }
    return Array.from(tagSet).toSorted()
  }, [papers])

  const filtered = React.useMemo(() => {
    let result = papers
    if (activeTag) {
      result = result.filter((p) => p.tags.includes(activeTag))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return result
  }, [papers, activeTag, searchQuery])

  const featured = filtered[0]
  const smallCards = filtered.slice(1, 3)
  const streamCards = filtered.slice(3)

  const publishedCount = papers.filter((p) => p.published).length

  const handleSearch = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
    },
    []
  )

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
        <SidebarNav
          allTags={allTags}
          activeTag={activeTag}
          onTagSelect={setActiveTag}
          publishedCount={publishedCount}
          totalCount={papers.length}
        />

        <div className='kb-layout'>
          {/* Top Bar */}
          <header className='kb-topbar'>
            <div className='kb-topbar__inner'>
              <div className='kb-topbar__nav-links'>
                <a
                  className='kb-topbar__nav-link kb-topbar__nav-link--active'
                  href='#'
                >
                  Explore
                </a>
                <a className='kb-topbar__nav-link' href='#'>
                  Research
                </a>
                <a className='kb-topbar__nav-link' href='#'>
                  Archive
                </a>
              </div>
              <div className='kb-topbar__actions'>
                <a
                  href='https://www.sakane.dev/'
                  className='kb-topbar__btn'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Portfolio
                </a>
              </div>
            </div>
          </header>

          <main className='kb-main'>
            {/* Hero */}
            <section className='kb-hero'>
              <span className='kb-hero__eyebrow'>Intelligence Repository</span>
              <h1 className='kb-hero__title'>
                Curating the{' '}
                <span className='kb-hero__title-accent'>Intelligence</span>
                <br />
                of Tomorrow
              </h1>
              <p className='kb-hero__sub'>
                A highly-refined repository of architectural insights, career
                strategy, and computational logic — {papers.length} documents
                across {allTags.length} research domains.
              </p>
              <div className='kb-hero__search'>
                <div className='kb-hero__search-wrap'>
                  <div className='kb-hero__search-glow' />
                  <div className='kb-hero__search-inner'>
                    <span className='kb-hero__search-icon'>
                      <IconSearch />
                    </span>
                    <input
                      type='text'
                      className='kb-hero__search-input'
                      placeholder='Jump to a specific report, research, or category...'
                      value={searchQuery}
                      onChange={handleSearch}
                    />
                    <kbd className='kb-hero__search-kbd'>⌘K</kbd>
                  </div>
                </div>
              </div>
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
            {filtered.length > 0 ? (
              <>
                {featured && (
                  <section className='kb-bento-section'>
                    <div className='kb-bento-grid'>
                      <BentoLargeCard paper={featured} />
                      {smallCards[0] && (
                        <BentoSmallCard paper={smallCards[0]} />
                      )}
                      {smallCards[1] && (
                        <BentoSmallCard paper={smallCards[1]} alt />
                      )}
                    </div>
                  </section>
                )}

                {/* Stream */}
                {streamCards.length > 0 && (
                  <section className='kb-stream'>
                    <div className='kb-stream__head'>
                      <div>
                        <span className='kb-stream__eyebrow'>The Stream</span>
                        <h2 className='kb-stream__title'>Latest Insights</h2>
                      </div>
                      <a href='#' className='kb-stream__view-archive'>
                        View Archive <IconArrow />
                      </a>
                    </div>
                    <div className='kb-stream__list'>
                      {streamCards.map((paper, i) => (
                        <StreamItem key={paper.id} paper={paper} index={i} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            ) : (
              <div className='kb-empty'>
                <p>No documents found for this filter.</p>
              </div>
            )}

            {/* CTA */}
            <CTASection />
          </main>

          {/* Footer */}
          <footer className='kb-footer'>
            <div className='kb-footer__inner'>
              <div className='kb-footer__brand'>
                <span className='kb-footer__logo'>The Archive</span>
                <p className='kb-footer__copy' suppressHydrationWarning>
                  © {currentYear} {config.author}. Curated Intelligence.
                </p>
              </div>
              <div className='kb-footer__links'>
                <a
                  href='https://www.sakane.dev/'
                  className='kb-footer__link'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Portfolio
                </a>
                {config.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${config.linkedin}`}
                    className='kb-footer__link'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    LinkedIn
                  </a>
                )}
                {config.github && (
                  <a
                    href={`https://github.com/${config.github}`}
                    className='kb-footer__link kb-footer__link--accent'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    GitHub
                  </a>
                )}
              </div>
              <div className='kb-footer__socials'>
                <a
                  href='https://www.sakane.dev/'
                  className='kb-footer__social-btn'
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label='Portfolio'
                >
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth={1.5}
                  >
                    <path d='M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' />
                  </svg>
                </a>
                {config.github && (
                  <a
                    href={`https://github.com/${config.github}`}
                    className='kb-footer__social-btn'
                    target='_blank'
                    rel='noopener noreferrer'
                    aria-label='GitHub'
                  >
                    <svg
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='currentColor'
                    >
                      <path d='M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z' />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}
