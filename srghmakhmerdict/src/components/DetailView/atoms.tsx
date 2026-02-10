import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import React, { useMemo } from 'react'
import type { KhmerWordsMap } from '../../db/dict/index'
import { colorizeHtml } from '../../utils/text-processing/html'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'
import { colorizeHtml_nonEmptyArray } from './utils'
import styles from './hide-broken-images.module.css'
import { useKhmerAndNonKhmerClickListener, calculateKhmerAndNonKhmerContentStyles } from '../../hooks/useKhmerLinks'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'

export const SectionTitle = React.memo(({ children }: { children: React.ReactNode }) => (
  <div className="text-[0.7em] uppercase tracking-wider font-bold text-default-400 mb-[0.75em] border-b border-divider pb-1">
    {children}
  </div>
))

SectionTitle.displayName = 'SectionTitle'

type RenderHtmlProps = {
  html: NonEmptyStringTrimmed | undefined
  className?: string
}

export const RenderHtml = React.memo(
  ({ html, className, ref }: RenderHtmlProps & { ref: React.RefObject<HTMLDivElement | null> }) => {
    const dangerousHtml = React.useMemo(() => (html ? { __html: html } : undefined), [html])

    if (!dangerousHtml) return null

    return (
      <div
        dangerouslySetInnerHTML={dangerousHtml}
        ref={ref} // ref comes from props
        className={`prose prose-sm max-w-none text-foreground/90 dark:prose-invert ${className}`}
      />
    )
  },
)

RenderHtml.displayName = 'RenderHtml'

export const RenderHtmlColorized = React.memo(
  ({
    html,
    maybeColorMode,
    km_map,
    hideBrokenImages_enable,
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
  }: {
    html: NonEmptyStringTrimmed | undefined
    maybeColorMode: MaybeColorizationMode
    km_map: KhmerWordsMap
    hideBrokenImages_enable: boolean
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm: ((w: TypedKhmerWord) => void) | undefined
    isKhmerWordsHidingEnabled: boolean
    isNonKhmerWordsHidingEnabled: boolean
  }) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const processedHtml = useMemo(
      () => (maybeColorMode !== 'none' && html ? colorizeHtml(html, maybeColorMode, km_map) : html),
      [html, maybeColorMode, km_map],
    )

    const hideBrokenImagesClass = hideBrokenImages_enable ? styles.hideBroken : ''
    const khmerContentClass = calculateKhmerAndNonKhmerContentStyles(
      !!isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
      isKhmerWordsHidingEnabled,
      isNonKhmerWordsHidingEnabled,
    )

    useKhmerAndNonKhmerClickListener(
      containerRef,
      isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
      isKhmerWordsHidingEnabled,
      isNonKhmerWordsHidingEnabled,
    )

    if (!processedHtml) return null

    return (
      <RenderHtml ref={containerRef} className={`${hideBrokenImagesClass} ${khmerContentClass}`} html={processedHtml} />
    )
  },
)

RenderHtmlColorized.displayName = 'RenderHtmlColorized'

export const HtmlListItem = React.memo(({ html }: { html: NonEmptyStringTrimmed }) => {
  return <li dangerouslySetInnerHTML={{ __html: html }} />
})

HtmlListItem.displayName = 'HtmlListItem'

type CsvListRendererHtmlProps = {
  items: NonEmptyArray<NonEmptyStringTrimmed>
  ulClassName?: string
}

export const CsvListRendererHtml = React.memo(
  ({ items, ulClassName, ref }: CsvListRendererHtmlProps & { ref: React.RefObject<HTMLUListElement | null> }) => (
    <ul ref={ref} className={`list-disc list-inside space-y-1 text-foreground/80 ${ulClassName}`}>
      {items.map((item, i) => (
        <HtmlListItem key={i} html={item} />
      ))}
    </ul>
  ),
)

CsvListRendererHtml.displayName = 'CsvListRendererHtml'

export const CsvListRendererColorized = React.memo(
  ({
    items,
    maybeColorMode,
    km_map,
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
  }: {
    items: NonEmptyArray<NonEmptyStringTrimmed> | undefined
    maybeColorMode: MaybeColorizationMode
    km_map: KhmerWordsMap | undefined
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm: ((w: TypedKhmerWord) => void) | undefined
    isKhmerWordsHidingEnabled: boolean
    isNonKhmerWordsHidingEnabled: boolean
  }) => {
    const listRef = React.useRef<HTMLUListElement>(null)

    const processedItems = useMemo(
      () => colorizeHtml_nonEmptyArray(items, maybeColorMode, km_map),
      [items, maybeColorMode, km_map],
    )

    const khmerContentClass = calculateKhmerAndNonKhmerContentStyles(
      !!isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
      isKhmerWordsHidingEnabled,
      isNonKhmerWordsHidingEnabled,
    )

    useKhmerAndNonKhmerClickListener(
      listRef,
      isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
      isKhmerWordsHidingEnabled,
      isNonKhmerWordsHidingEnabled,
    )

    if (!processedItems) return null

    return <CsvListRendererHtml ref={listRef} items={processedItems} ulClassName={khmerContentClass} />
  },
)

CsvListRendererColorized.displayName = 'CsvListRendererColorized'

export const CsvListRendererText = React.memo(({ items }: { items: NonEmptyArray<NonEmptyStringTrimmed> }) => (
  <ul className="list-disc list-inside space-y-1 text-foreground/80">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
))

CsvListRendererText.displayName = 'CsvListRendererText'
