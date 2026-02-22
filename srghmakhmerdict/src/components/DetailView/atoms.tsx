import type { WordsHidingMode } from '../../providers/SettingsProvider'
import {
  Array_toNonEmptyArray_unsafe,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import React, { memo, useMemo } from 'react'
import { colorizeHtml } from '../../utils/text-processing/html'
import { colorizeHtml_nonEmptyArray } from './utils'
import styles from './hide-broken-images.module.css'
import { useKhmerAndNonKhmerClickListener, calculateKhmerAndNonKhmerContentStyles } from '../../hooks/useKhmerLinks'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { useSettings } from '../../providers/SettingsProvider'
import { useDictionary } from '../../providers/DictionaryProvider'
import { colorizeText } from '../../utils/text-processing/text'
import { processHtmlForPronunciationHiding, type PronunciationSource } from '../../utils/text-processing/pronunciation'
import { undefined_lift } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/undefined'
import type { ShortDefinition } from '../../db/dict'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'

export const SectionTitleWithRightContent = memo(function SectionTitleWithRightContent({
  children,
  rightContent,
}: {
  children: React.ReactNode
  rightContent?: React.ReactNode
}) {
  return (
    <div className="flex justify-between items-center border-b border-divider mb-[0.75em] pb-1 min-h-[28px]">
      <div className="text-xs uppercase tracking-wider font-bold text-default-400">{children}</div>
      {rightContent}
    </div>
  )
})

SectionTitleWithRightContent.displayName = 'SectionTitle'

export const SectionTitle = React.memo(({ children }: { children: React.ReactNode }) => (
  <div
    className={`text-xs uppercase tracking-wider font-bold text-default-400 mb-[0.75em] border-b border-divider pb-1`}
  >
    {children}
  </div>
))

SectionTitle.displayName = 'SectionTitle'

type RenderHtmlProps = {
  html: NonEmptyStringTrimmed | undefined
  className?: string
}

export const RenderHtml = React.memo(function RenderHtml({
  html,
  className,
  ref,
}: RenderHtmlProps & { ref: React.RefObject<HTMLDivElement | null> }) {
  const dangerousHtml = React.useMemo(() => (html ? { __html: html } : undefined), [html])

  if (!dangerousHtml) return null

  return (
    <div
      dangerouslySetInnerHTML={dangerousHtml}
      ref={ref} // ref comes from props
      className={`prose prose-sm max-w-none text-foreground/90 dark:prose-invert ${className} text-base`}
    />
  )
})

RenderHtml.displayName = 'RenderHtml'

export const RenderTextColorized = React.memo(function RenderTextColorized({
  text,
  khmerWordsHidingMode,
  nonKhmerWordsHidingMode,
  isKhmerPronunciationHidingEnabled,
  dictionaryMode_lonelyWordShouldBeSpilt,
  isShowShortDetailAboutKhmerWordEnabled,
  shortDefinitions,
  excludeWord,
}: {
  text: NonEmptyStringTrimmed
  khmerWordsHidingMode: WordsHidingMode
  nonKhmerWordsHidingMode: WordsHidingMode
  isKhmerPronunciationHidingEnabled: boolean
  dictionaryMode_lonelyWordShouldBeSpilt: boolean
  isShowShortDetailAboutKhmerWordEnabled: boolean
  shortDefinitions: NonEmptyRecord<TypedKhmerWord, ShortDefinition | null> | undefined
  excludeWord?: TypedKhmerWord
}) {
  const { maybeColorMode } = useSettings()
  const { km_map } = useDictionary()
  const containerRef = React.useRef<HTMLDivElement>(null)

  const processedText_html = useMemo(
    () =>
      colorizeText(
        text,
        maybeColorMode,
        km_map,
        dictionaryMode_lonelyWordShouldBeSpilt,
        isShowShortDetailAboutKhmerWordEnabled ? shortDefinitions : undefined,
        excludeWord,
      ),
    [
      text,
      maybeColorMode,
      km_map,
      dictionaryMode_lonelyWordShouldBeSpilt,
      isShowShortDetailAboutKhmerWordEnabled,
      shortDefinitions,
      excludeWord,
    ],
  )

  const khmerContentClass = calculateKhmerAndNonKhmerContentStyles(
    false,
    khmerWordsHidingMode,
    nonKhmerWordsHidingMode,
    isKhmerPronunciationHidingEnabled,
    isShowShortDetailAboutKhmerWordEnabled,
  )

  useKhmerAndNonKhmerClickListener(
    containerRef,
    undefined,
    khmerWordsHidingMode,
    nonKhmerWordsHidingMode,
    isKhmerPronunciationHidingEnabled,
  )

  return (
    <span
      dangerouslySetInnerHTML={{ __html: processedText_html }}
      ref={containerRef}
      className={`prose prose-sm max-w-none text-foreground/90 dark:prose-invert text-base ${khmerContentClass}`}
    />
  )
})

export const RenderHtmlColorized = React.memo(function RenderHtmlColorized({
  html,
  hideBrokenImages_enable,
  isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
  khmerWordsHidingMode,
  nonKhmerWordsHidingMode,
  isKhmerPronunciationHidingEnabled,
  pronunciationSource,
  dictionaryMode_lonelyWordShouldBeSpilt,
  isShowShortDetailAboutKhmerWordEnabled,
  shortDefinitions,
  excludeWord,
}: {
  html: NonEmptyStringTrimmed
  hideBrokenImages_enable: boolean
  isKhmerLinksEnabled_ifTrue_passOnNavigateKm: ((w: TypedKhmerWord) => void) | undefined
  khmerWordsHidingMode: WordsHidingMode
  nonKhmerWordsHidingMode: WordsHidingMode
  isKhmerPronunciationHidingEnabled: boolean
  pronunciationSource: PronunciationSource | undefined
  dictionaryMode_lonelyWordShouldBeSpilt: boolean
  isShowShortDetailAboutKhmerWordEnabled: boolean
  shortDefinitions: NonEmptyRecord<TypedKhmerWord, ShortDefinition | null> | undefined
  excludeWord?: TypedKhmerWord
}) {
  const { maybeColorMode } = useSettings()
  const { km_map } = useDictionary()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const processedHtml = useMemo(() => {
    if (!html) return html

    const html_withPronunciations = pronunciationSource
      ? processHtmlForPronunciationHiding(html, isKhmerPronunciationHidingEnabled, pronunciationSource)
      : html

    return colorizeHtml(
      html_withPronunciations,
      maybeColorMode,
      km_map,
      dictionaryMode_lonelyWordShouldBeSpilt,
      isShowShortDetailAboutKhmerWordEnabled ? shortDefinitions : undefined,
      excludeWord,
    )
  }, [
    html,
    maybeColorMode,
    km_map,
    isKhmerPronunciationHidingEnabled,
    pronunciationSource,
    dictionaryMode_lonelyWordShouldBeSpilt,
    isShowShortDetailAboutKhmerWordEnabled,
    shortDefinitions,
    excludeWord,
  ])

  const hideBrokenImagesClass = hideBrokenImages_enable ? styles.hideBroken : ''

  const khmerContentClass = calculateKhmerAndNonKhmerContentStyles(
    !!isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    khmerWordsHidingMode,
    nonKhmerWordsHidingMode,
    isKhmerPronunciationHidingEnabled,
    isShowShortDetailAboutKhmerWordEnabled,
  )

  useKhmerAndNonKhmerClickListener(
    containerRef,
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    khmerWordsHidingMode,
    nonKhmerWordsHidingMode,
    isKhmerPronunciationHidingEnabled,
  )

  if (!processedHtml) return null

  return (
    <RenderHtml ref={containerRef} className={`${hideBrokenImagesClass} ${khmerContentClass}`} html={processedHtml} />
  )
})

RenderHtmlColorized.displayName = 'RenderHtmlColorized'

export const HtmlListItem = React.memo(function HtmlListItem({ html }: { html: NonEmptyStringTrimmed }) {
  return <li dangerouslySetInnerHTML={{ __html: html }} />
})

HtmlListItem.displayName = 'HtmlListItem'

type CsvListRendererHtmlProps = {
  items: NonEmptyArray<NonEmptyStringTrimmed>
  ulClassName?: string
}

export const CsvListRendererHtml = React.memo(function CsvListRendererHtml({
  items,
  ulClassName,
  ref,
}: CsvListRendererHtmlProps & { ref: React.RefObject<HTMLUListElement | null> }) {
  return (
    <ul ref={ref} className={`list-disc list-inside space-y-1 text-foreground/80 ${ulClassName}`}>
      {items.map((item, i) => (
        <HtmlListItem key={i} html={item} />
      ))}
    </ul>
  )
})

CsvListRendererHtml.displayName = 'CsvListRendererHtml'

export const CsvListRendererColorized = React.memo(function CsvListRendererColorized({
  items,
  isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
  khmerWordsHidingMode,
  nonKhmerWordsHidingMode,
  isKhmerPronunciationHidingEnabled,
  pronunciationSource,
  dictionaryMode_lonelyWordShouldBeSpilt,
  isShowShortDetailAboutKhmerWordEnabled,
  shortDefinitions,
  excludeWord,
}: {
  items: NonEmptyArray<NonEmptyStringTrimmed> | undefined
  isKhmerLinksEnabled_ifTrue_passOnNavigateKm: ((w: TypedKhmerWord) => void) | undefined
  khmerWordsHidingMode: WordsHidingMode
  nonKhmerWordsHidingMode: WordsHidingMode
  isKhmerPronunciationHidingEnabled: boolean
  pronunciationSource: PronunciationSource | undefined
  dictionaryMode_lonelyWordShouldBeSpilt: boolean
  isShowShortDetailAboutKhmerWordEnabled: boolean
  shortDefinitions: NonEmptyRecord<TypedKhmerWord, ShortDefinition | null> | undefined
  excludeWord?: TypedKhmerWord
}) {
  const { km_map } = useDictionary()
  const { maybeColorMode } = useSettings()
  const listRef = React.useRef<HTMLUListElement>(null)

  const processedItems = useMemo(
    () =>
      colorizeHtml_nonEmptyArray(
        undefined_lift(Array_toNonEmptyArray_unsafe)(
          items?.map(i =>
            pronunciationSource
              ? processHtmlForPronunciationHiding(i, isKhmerPronunciationHidingEnabled, pronunciationSource)
              : i,
          ),
        ),
        maybeColorMode,
        km_map,
        dictionaryMode_lonelyWordShouldBeSpilt,
        isShowShortDetailAboutKhmerWordEnabled ? shortDefinitions : undefined,
        excludeWord,
      ),
    [
      items,
      maybeColorMode,
      km_map,
      isKhmerPronunciationHidingEnabled,
      pronunciationSource,
      dictionaryMode_lonelyWordShouldBeSpilt,
      isShowShortDetailAboutKhmerWordEnabled,
      shortDefinitions,
      excludeWord,
    ],
  )

  const khmerContentClass = calculateKhmerAndNonKhmerContentStyles(
    !!isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    khmerWordsHidingMode,
    nonKhmerWordsHidingMode,
    isKhmerPronunciationHidingEnabled,
    isShowShortDetailAboutKhmerWordEnabled,
  )

  useKhmerAndNonKhmerClickListener(
    listRef,
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    khmerWordsHidingMode,
    nonKhmerWordsHidingMode,
    isKhmerPronunciationHidingEnabled,
  )

  if (!processedItems) return null

  return <CsvListRendererHtml ref={listRef} items={processedItems} ulClassName={khmerContentClass} />
})

CsvListRendererColorized.displayName = 'CsvListRendererColorized'

export const CsvListRendererText = React.memo(function CsvListRendererText({
  items,
  khmerWordsHidingMode,
  nonKhmerWordsHidingMode,
  isKhmerPronunciationHidingEnabled,
  dictionaryMode_lonelyWordShouldBeSpilt,
  isShowShortDetailAboutKhmerWordEnabled,
  shortDefinitions,
  excludeWord,
}: {
  items: NonEmptyArray<NonEmptyStringTrimmed>
  khmerWordsHidingMode: WordsHidingMode
  nonKhmerWordsHidingMode: WordsHidingMode
  isKhmerPronunciationHidingEnabled: boolean
  dictionaryMode_lonelyWordShouldBeSpilt: boolean
  isShowShortDetailAboutKhmerWordEnabled: boolean
  shortDefinitions: NonEmptyRecord<TypedKhmerWord, ShortDefinition | null> | undefined
  excludeWord?: TypedKhmerWord
}) {
  const khmerContentClass = calculateKhmerAndNonKhmerContentStyles(
    false,
    khmerWordsHidingMode,
    nonKhmerWordsHidingMode,
    isKhmerPronunciationHidingEnabled,
    isShowShortDetailAboutKhmerWordEnabled,
  )

  return (
    <ul className={`list-disc list-inside space-y-1 text-foreground/80 ${khmerContentClass}`}>
      {items.map((item, i) => (
        <li key={i}>
          <RenderTextColorized
            dictionaryMode_lonelyWordShouldBeSpilt={dictionaryMode_lonelyWordShouldBeSpilt}
            excludeWord={excludeWord}
            isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
            isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
            khmerWordsHidingMode={khmerWordsHidingMode}
            nonKhmerWordsHidingMode={nonKhmerWordsHidingMode}
            shortDefinitions={shortDefinitions}
            text={item}
          />
        </li>
      ))}
    </ul>
  )
})

CsvListRendererText.displayName = 'CsvListRendererText'

export const CsvListRendererPronunciation = React.memo(function CsvListRendererPronunciation({
  items,
  isKhmerPronunciationHidingEnabled,
}: {
  items: NonEmptyArray<NonEmptyStringTrimmed>
  isKhmerPronunciationHidingEnabled: boolean
}) {
  const khmerContentClass = calculateKhmerAndNonKhmerContentStyles(
    false,
    'disabled',
    'disabled',
    isKhmerPronunciationHidingEnabled,
    false,
  )

  return (
    <ul className={`list-disc list-inside space-y-1 text-foreground/80 ${khmerContentClass}`}>
      {items.map((item, i) => (
        <li key={i}>
          <span className="prose prose-sm max-w-none text-foreground/90 dark:prose-invert text-base">
            <span className="khmer--ipa">{item}</span>
          </span>
        </li>
      ))}
    </ul>
  )
})

CsvListRendererPronunciation.displayName = 'CsvListRendererPronunciation'

export const FromRussianWikiRenderer = React.memo(function FromRussianWikiRenderer({
  html,
  isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
  khmerWordsHidingMode,
  nonKhmerWordsHidingMode,
  isKhmerPronunciationHidingEnabled,
  dictionaryMode_lonelyWordShouldBeSpilt,
  isShowShortDetailAboutKhmerWordEnabled,
  shortDefinitions,
  excludeWord,
}: {
  html: NonEmptyStringTrimmed
  isKhmerLinksEnabled_ifTrue_passOnNavigateKm: ((w: TypedKhmerWord) => void) | undefined
  khmerWordsHidingMode: WordsHidingMode
  nonKhmerWordsHidingMode: WordsHidingMode
  isKhmerPronunciationHidingEnabled: boolean
  dictionaryMode_lonelyWordShouldBeSpilt: boolean
  isShowShortDetailAboutKhmerWordEnabled: boolean
  shortDefinitions: NonEmptyRecord<TypedKhmerWord, ShortDefinition | null> | undefined
  excludeWord?: TypedKhmerWord
}) {
  return (
    <RenderHtmlColorized
      dictionaryMode_lonelyWordShouldBeSpilt={dictionaryMode_lonelyWordShouldBeSpilt}
      excludeWord={excludeWord}
      hideBrokenImages_enable={false}
      html={html}
      isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
      isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
      isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
      khmerWordsHidingMode={khmerWordsHidingMode}
      nonKhmerWordsHidingMode={nonKhmerWordsHidingMode}
      pronunciationSource="russian_wiki"
      shortDefinitions={shortDefinitions}
    />
  )
})

FromRussianWikiRenderer.displayName = 'FromRussianWikiRenderer'

export const GorgonievRenderer = React.memo(function GorgonievRenderer({
  html,
  isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
  khmerWordsHidingMode,
  nonKhmerWordsHidingMode,
  isKhmerPronunciationHidingEnabled,
  dictionaryMode_lonelyWordShouldBeSpilt,
  isShowShortDetailAboutKhmerWordEnabled,
  shortDefinitions,
  excludeWord,
}: {
  html: NonEmptyStringTrimmed
  isKhmerLinksEnabled_ifTrue_passOnNavigateKm: ((w: TypedKhmerWord) => void) | undefined
  khmerWordsHidingMode: WordsHidingMode
  nonKhmerWordsHidingMode: WordsHidingMode
  isKhmerPronunciationHidingEnabled: boolean
  dictionaryMode_lonelyWordShouldBeSpilt: boolean
  isShowShortDetailAboutKhmerWordEnabled: boolean
  shortDefinitions: NonEmptyRecord<TypedKhmerWord, ShortDefinition | null> | undefined
  excludeWord?: TypedKhmerWord
}) {
  return (
    <RenderHtmlColorized
      dictionaryMode_lonelyWordShouldBeSpilt={dictionaryMode_lonelyWordShouldBeSpilt}
      excludeWord={excludeWord}
      hideBrokenImages_enable={false}
      html={html}
      isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled_ifTrue_passOnNavigateKm}
      isKhmerPronunciationHidingEnabled={isKhmerPronunciationHidingEnabled}
      isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
      khmerWordsHidingMode={khmerWordsHidingMode}
      nonKhmerWordsHidingMode={nonKhmerWordsHidingMode}
      pronunciationSource="gorgoniev"
      shortDefinitions={shortDefinitions}
    />
  )
})

GorgonievRenderer.displayName = 'GorgonievRenderer'
