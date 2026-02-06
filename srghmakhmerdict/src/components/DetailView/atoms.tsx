import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import React, { useMemo } from 'react'
import type { KhmerWordsMap } from '../../db/dict'
import { colorizeHtml_allowUndefined } from '../../utils/text-processing/html'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'
import { processArrayColorized } from './utils'

export const SectionTitle = React.memo(({ children }: { children: React.ReactNode }) => (
  <div className="text-[0.7em] uppercase tracking-wider font-bold text-default-400 mb-[0.75em] border-b border-divider pb-1">
    {children}
  </div>
))

SectionTitle.displayName = 'SectionTitle'

export const RenderHtml = React.memo(({ html }: { html: NonEmptyStringTrimmed | undefined }) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const dangerousHtml = useMemo(() => (html ? { __html: html } : undefined), [html])

  React.useEffect(() => {
    const container = containerRef.current

    if (!container) return
    const handleImageError = (event: Event) => {
      const target = event.target as HTMLElement

      if (target.tagName === 'IMG') target.style.display = 'none'
    }

    container.addEventListener('error', handleImageError, true)

    return () => container.removeEventListener('error', handleImageError, true)
  }, [])

  if (!dangerousHtml) return null

  return (
    <div
      dangerouslySetInnerHTML={dangerousHtml}
      ref={containerRef}
      className="prose prose-sm max-w-none text-foreground/90 dark:prose-invert"
    />
  )
})

RenderHtml.displayName = 'RenderHtml'

export const RenderHtmlColorized = React.memo(
  ({
    html,
    maybeColorMode,
    km_map,
  }: {
    html: NonEmptyStringTrimmed | undefined
    maybeColorMode: MaybeColorizationMode
    km_map: KhmerWordsMap | undefined
  }) => {
    const processedHtml = useMemo(
      () => (maybeColorMode !== 'none' && km_map ? colorizeHtml_allowUndefined(html, maybeColorMode, km_map) : html),
      [html, maybeColorMode, km_map],
    )

    if (!processedHtml) return null

    return <RenderHtml html={processedHtml} />
  },
)

RenderHtmlColorized.displayName = 'RenderHtmlColorized'

export const HtmlListItem = React.memo(({ html }: { html: NonEmptyStringTrimmed }) => {
  return <li dangerouslySetInnerHTML={{ __html: html }} />
})

HtmlListItem.displayName = 'HtmlListItem'

export const CsvListRendererHtml = React.memo(({ items }: { items: NonEmptyArray<NonEmptyStringTrimmed> }) => (
  <ul className="list-disc list-inside space-y-1 text-foreground/80 font-khmer">
    {items.map((item, i) => (
      <HtmlListItem key={i} html={item} />
    ))}
  </ul>
))

CsvListRendererHtml.displayName = 'CsvListRendererHtml'

export const CsvListRendererColorized = React.memo(
  ({
    items,
    maybeColorMode,
    km_map,
  }: {
    items: NonEmptyArray<NonEmptyStringTrimmed> | undefined
    maybeColorMode: MaybeColorizationMode
    km_map: KhmerWordsMap | undefined
  }) => {
    const processedItems = useMemo(
      () => processArrayColorized(items, maybeColorMode, km_map),
      [items, maybeColorMode, km_map],
    )

    if (!processedItems) return null

    return <CsvListRendererHtml items={processedItems} />
  },
)

CsvListRendererColorized.displayName = 'CsvListRendererColorized'

export const CsvListRendererText = React.memo(({ items }: { items: NonEmptyArray<NonEmptyStringTrimmed> }) => (
  <ul className="list-disc list-inside space-y-1 text-foreground/80 font-khmer">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
))

CsvListRendererText.displayName = 'CsvListRendererText'
