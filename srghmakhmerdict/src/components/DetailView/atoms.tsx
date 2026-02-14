import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import React, { useMemo } from 'react'
import { colorizeHtml } from '../../utils/text-processing/html'
import { colorizeHtml_nonEmptyArray } from './utils'
import styles from './hide-broken-images.module.css'
import { useKhmerAndNonKhmerClickListener, calculateKhmerAndNonKhmerContentStyles } from '../../hooks/useKhmerLinks'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { useSettings } from '../../providers/SettingsProvider'
import { useDictionary } from '../../providers/DictionaryProvider'
import { colorizeText } from '../../utils/text-processing/text'
import { processHtmlForPronunciationHiding, type PronunciationSource } from '../../utils/text-processing/pronunciation'

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

export const RenderTextColorized = React.memo(function RenderTextColorized({
  text,
  isKhmerWordsHidingEnabled,
  isNonKhmerWordsHidingEnabled,
  isKhmerPronunciationHidingEnabled,
}: {
  text: NonEmptyStringTrimmed
  isKhmerWordsHidingEnabled: boolean
  isNonKhmerWordsHidingEnabled: boolean
  isKhmerPronunciationHidingEnabled: boolean
}) {
  const { maybeColorMode } = useSettings()
  const { km_map } = useDictionary()
  const containerRef = React.useRef<HTMLDivElement>(null)

  const processedText_html = useMemo(() => colorizeText(text, maybeColorMode, km_map), [text, maybeColorMode, km_map])

  useKhmerAndNonKhmerClickListener(
    containerRef,
    undefined,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    isKhmerPronunciationHidingEnabled,
  )

  return (
    <span
      dangerouslySetInnerHTML={{ __html: processedText_html }}
      ref={containerRef}
      className={`prose prose-sm max-w-none text-foreground/90 dark:prose-invert`}
    />
  )
})

export const RenderHtmlColorized = React.memo(
  ({
    html,
    hideBrokenImages_enable,
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    isKhmerPronunciationHidingEnabled,
    pronunciationSource,
  }: {
    html: NonEmptyStringTrimmed | undefined
    hideBrokenImages_enable: boolean
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm: ((w: TypedKhmerWord) => void) | undefined
    isKhmerWordsHidingEnabled: boolean
    isNonKhmerWordsHidingEnabled: boolean
    isKhmerPronunciationHidingEnabled: boolean
    pronunciationSource?: PronunciationSource
  }) => {
    const { maybeColorMode } = useSettings()
    const { km_map } = useDictionary()
    const containerRef = React.useRef<HTMLDivElement>(null)
    const processedHtml = useMemo(() => {
      if (!html) return html

      const html_withPronunciations = pronunciationSource
        ? processHtmlForPronunciationHiding(html, isKhmerPronunciationHidingEnabled, pronunciationSource)
        : html

      return colorizeHtml(html_withPronunciations, maybeColorMode, km_map)
    }, [html, maybeColorMode, km_map, isKhmerPronunciationHidingEnabled, pronunciationSource])

    const hideBrokenImagesClass = hideBrokenImages_enable ? styles.hideBroken : ''

    const khmerContentClass = calculateKhmerAndNonKhmerContentStyles(
      !!isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
      isKhmerWordsHidingEnabled,
      isNonKhmerWordsHidingEnabled,
      isKhmerPronunciationHidingEnabled,
    )

    useKhmerAndNonKhmerClickListener(
      containerRef,
      isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
      isKhmerWordsHidingEnabled,
      isNonKhmerWordsHidingEnabled,
      isKhmerPronunciationHidingEnabled,
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
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    isKhmerPronunciationHidingEnabled,
    pronunciationSource,
  }: {
    items: NonEmptyArray<NonEmptyStringTrimmed> | undefined
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm: ((w: TypedKhmerWord) => void) | undefined
    isKhmerWordsHidingEnabled: boolean
    isNonKhmerWordsHidingEnabled: boolean
    isKhmerPronunciationHidingEnabled: boolean
    pronunciationSource?: PronunciationSource
  }) => {
    const { km_map } = useDictionary()
    const { maybeColorMode } = useSettings()
    const listRef = React.useRef<HTMLUListElement>(null)

    const processedItems = useMemo(
      () =>
        colorizeHtml_nonEmptyArray(
          items?.map(i =>
            pronunciationSource
              ? processHtmlForPronunciationHiding(i, isKhmerPronunciationHidingEnabled, pronunciationSource)
              : i,
          ) as NonEmptyArray<NonEmptyStringTrimmed> | undefined,
          maybeColorMode,
          km_map,
        ),
      [items, maybeColorMode, km_map, isKhmerPronunciationHidingEnabled, pronunciationSource],
    )

    const khmerContentClass = calculateKhmerAndNonKhmerContentStyles(
      !!isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
      isKhmerWordsHidingEnabled,
      isNonKhmerWordsHidingEnabled,
      isKhmerPronunciationHidingEnabled,
    )

    useKhmerAndNonKhmerClickListener(
      listRef,
      isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
      isKhmerWordsHidingEnabled,
      isNonKhmerWordsHidingEnabled,
      isKhmerPronunciationHidingEnabled,
    )

    if (!processedItems) return null

    return <CsvListRendererHtml ref={listRef} items={processedItems} ulClassName={khmerContentClass} />
  },
)

CsvListRendererColorized.displayName = 'CsvListRendererColorized'

export const CsvListRendererText = React.memo(function CsvListRendererText({
  items,
  isKhmerWordsHidingEnabled,
  isNonKhmerWordsHidingEnabled,
  isKhmerPronunciationHidingEnabled,
}: {
  items: NonEmptyArray<NonEmptyStringTrimmed>
  isKhmerWordsHidingEnabled: boolean
  isNonKhmerWordsHidingEnabled: boolean
  isKhmerPronunciationHidingEnabled: boolean
}) {
  const khmerContentClass = calculateKhmerAndNonKhmerContentStyles(
    false,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    isKhmerPronunciationHidingEnabled,
  )

  return (
    <ul className={`list-disc list-inside space-y-1 text-foreground/80 ${khmerContentClass}`}>
      {items.map((item, i) => (
        <li key={i}>
          <RenderTextColorized
            isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
            isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
            isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
            text={item}
          />
        </li>
      ))}
    </ul>
  )
})

CsvListRendererText.displayName = 'CsvListRendererText'

export const FromRussianWikiRenderer = React.memo(
  ({
    html,
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    isKhmerPronunciationHidingEnabled,
  }: {
    html: NonEmptyStringTrimmed | undefined
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm: ((w: TypedKhmerWord) => void) | undefined
    isKhmerWordsHidingEnabled: boolean
    isNonKhmerWordsHidingEnabled: boolean
    isKhmerPronunciationHidingEnabled: boolean
  }) => {
    return (
      <RenderHtmlColorized
        hideBrokenImages_enable={false}
        html={html}
        isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
        isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
        isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
        isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
        pronunciationSource="russian_wiki"
      />
    )
  },
)

FromRussianWikiRenderer.displayName = 'FromRussianWikiRenderer'

export const GorgonievRenderer = React.memo(
  ({
    html,
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    isKhmerPronunciationHidingEnabled,
  }: {
    html: NonEmptyStringTrimmed | undefined
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm: ((w: TypedKhmerWord) => void) | undefined
    isKhmerWordsHidingEnabled: boolean
    isNonKhmerWordsHidingEnabled: boolean
    isKhmerPronunciationHidingEnabled: boolean
  }) => {
    return (
      <RenderHtmlColorized
        hideBrokenImages_enable={false}
        html={html}
        isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
        isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
        isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
        isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
        pronunciationSource="gorgoniev"
      />
    )
  },
)

GorgonievRenderer.displayName = 'GorgonievRenderer'
