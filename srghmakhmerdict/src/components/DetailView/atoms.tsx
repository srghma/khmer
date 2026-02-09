import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import React, { useMemo } from 'react'
import type { KhmerWordsMap } from '../../db/dict'
import { colorizeHtml } from '../../utils/text-processing/html'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'
import { colorizeHtml_nonEmptyArray } from './utils'
import styles from './hide-broken-images.module.css'
import type { DictionaryLanguage } from '../../types'
import { useKhmerAndNonKhmerClickListener, useKhmerAndNonKhmerContentStyles } from '../../hooks/useKhmerLinks'
import { isContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'

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
  React.forwardRef<HTMLDivElement, RenderHtmlProps>(({ html, className }, ref) => {
    const dangerousHtml = React.useMemo(() => (html ? { __html: html } : undefined), [html])

    if (!dangerousHtml) return null

    return (
      <div
        dangerouslySetInnerHTML={dangerousHtml}
        ref={ref}
        className={`prose prose-sm max-w-none text-foreground/90 dark:prose-invert ${className}`}
      />
    )
  }),
)

RenderHtml.displayName = 'RenderHtml'

export const RenderHtmlColorized = React.memo(
  ({
    html,
    maybeColorMode,
    km_map,
    hideBrokenImages_enable,
    onNavigate,
    isKhmerLinksEnabled,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
  }: {
    html: NonEmptyStringTrimmed | undefined
    maybeColorMode: MaybeColorizationMode
    km_map: KhmerWordsMap
    hideBrokenImages_enable: boolean
    onNavigate: (w: NonEmptyStringTrimmed, m: DictionaryLanguage) => void
    isKhmerLinksEnabled: boolean
    isKhmerWordsHidingEnabled: boolean
    isNonKhmerWordsHidingEnabled: boolean
  }) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const processedHtml = useMemo(
      () =>
        maybeColorMode !== 'none' && html && isContainsKhmer(html) ? colorizeHtml(html, maybeColorMode, km_map) : html,
      [html, maybeColorMode, km_map],
    )

    const hideBrokenImagesClass = hideBrokenImages_enable ? styles.hideBroken : ''
    const khmerContentClass = useKhmerAndNonKhmerContentStyles(
      isKhmerLinksEnabled,
      isKhmerWordsHidingEnabled,
      isNonKhmerWordsHidingEnabled,
    )

    useKhmerAndNonKhmerClickListener(
      containerRef,
      onNavigate,
      isKhmerLinksEnabled,
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
  React.forwardRef<HTMLUListElement, CsvListRendererHtmlProps>(({ items, ulClassName }, ref) => (
    <ul ref={ref} className={`list-disc list-inside space-y-1 text-foreground/80 ${ulClassName}`}>
      {items.map((item, i) => (
        <HtmlListItem key={i} html={item} />
      ))}
    </ul>
  )),
)

CsvListRendererHtml.displayName = 'CsvListRendererHtml'

export const CsvListRendererColorized = React.memo(
  ({
    items,
    maybeColorMode,
    km_map,
    onNavigate,
    isKhmerLinksEnabled,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
  }: {
    items: NonEmptyArray<NonEmptyStringTrimmed> | undefined
    maybeColorMode: MaybeColorizationMode
    km_map: KhmerWordsMap | undefined
    onNavigate: (w: NonEmptyStringTrimmed, m: DictionaryLanguage) => void
    isKhmerLinksEnabled: boolean
    isKhmerWordsHidingEnabled: boolean
    isNonKhmerWordsHidingEnabled: boolean
  }) => {
    const listRef = React.useRef<HTMLUListElement>(null)

    const processedItems = useMemo(
      () => colorizeHtml_nonEmptyArray(items, maybeColorMode, km_map),
      [items, maybeColorMode, km_map],
    )

    const khmerContentClass = useKhmerAndNonKhmerContentStyles(
      isKhmerLinksEnabled,
      isKhmerWordsHidingEnabled,
      isNonKhmerWordsHidingEnabled,
    )

    useKhmerAndNonKhmerClickListener(
      listRef,
      onNavigate,
      isKhmerLinksEnabled,
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
