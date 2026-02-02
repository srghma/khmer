import React, { useState, useCallback, useMemo } from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import {
  Array_toNonEmptyArray_orThrow,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { Button } from '@heroui/react'
import { Card, CardBody } from '@heroui/react'
import { ScrollShadow } from '@heroui/scroll-shadow'
import { Spinner } from '@heroui/react'
import type { SharedSelection } from '@heroui/react'

import { type DictionaryLanguage } from '../types'
import { WiktionaryRenderer } from './WiktionaryRenderer'
import { useWordData, useTtsHandlers } from '../hooks/useDetailViewLogic'
import {
  stringToColorizationModeOrThrow,
  type ColorizationMode,
  type MaybeColorizationMode,
} from '../utils/text-processing/utils'
import type { KhmerWordsMap } from '../db/dict'
import { EnKmHtmlRenderer } from './EnKmHtmlRenderer'
import { DetailViewHeader } from './DetailViewHeader'
import { colorizeHtml, colorizeHtml_allowUndefined } from '../utils/text-processing/html'

// --- HELPER FUNCTIONS ---

const processArrayColorized = (
  items: NonEmptyArray<NonEmptyStringTrimmed> | undefined,
  colorMode: MaybeColorizationMode,
  km_map: KhmerWordsMap | undefined,
): NonEmptyArray<NonEmptyStringTrimmed> | undefined => {
  if (!items) return undefined
  if (colorMode === 'none' || !km_map) return undefined

  return Array_toNonEmptyArray_orThrow(items.map(item => colorizeHtml(item, colorMode, km_map)))
}

// --- SUB-COMPONENTS ---

const SectionTitle = React.memo(({ children }: { children: React.ReactNode }) => (
  <div className="text-[0.7em] uppercase tracking-wider font-bold text-default-400 mb-[0.75em] border-b border-divider pb-1">
    {children}
  </div>
))

SectionTitle.displayName = 'SectionTitle'

const RenderHtml = React.memo(({ html }: { html: NonEmptyStringTrimmed | undefined }) => {
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

const RenderHtmlColorized = React.memo(
  ({
    html,
    colorMode,
    km_map,
  }: {
    html: NonEmptyStringTrimmed | undefined
    colorMode: MaybeColorizationMode
    km_map: KhmerWordsMap | undefined
  }) => {
    const processedHtml = useMemo(
      () => (colorMode !== 'none' && km_map ? colorizeHtml_allowUndefined(html, colorMode, km_map) : html),
      [html, colorMode, km_map],
    )

    if (!processedHtml) return null

    return <RenderHtml html={processedHtml} />
  },
)

RenderHtmlColorized.displayName = 'RenderHtmlColorized'

const HtmlListItem = React.memo(({ html }: { html: NonEmptyStringTrimmed }) => {
  return <li dangerouslySetInnerHTML={{ __html: html }} />
})

HtmlListItem.displayName = 'HtmlListItem'

const CsvListRendererHtml = React.memo(({ items }: { items: NonEmptyArray<NonEmptyStringTrimmed> }) => (
  <ul className="list-disc list-inside space-y-1 text-foreground/80 font-khmer">
    {items.map((item, i) => (
      <HtmlListItem key={i} html={item} />
    ))}
  </ul>
))

CsvListRendererHtml.displayName = 'CsvListRendererHtml'

const CsvListRendererColorized = React.memo(
  ({
    items,
    colorMode,
    km_map,
  }: {
    items: NonEmptyArray<NonEmptyStringTrimmed> | undefined
    colorMode: MaybeColorizationMode
    km_map: KhmerWordsMap | undefined
  }) => {
    const processedItems = useMemo(() => processArrayColorized(items, colorMode, km_map), [items, colorMode, km_map])

    if (!processedItems) return null

    return <CsvListRendererHtml items={processedItems} />
  },
)

CsvListRendererColorized.displayName = 'CsvListRendererColorized'

const CsvListRendererText = React.memo(({ items }: { items: NonEmptyArray<NonEmptyStringTrimmed> }) => (
  <ul className="list-disc list-inside space-y-1 text-foreground/80 font-khmer">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
))

CsvListRendererText.displayName = 'CsvListRendererText'

interface DetailSectionsProps {
  desc?: NonEmptyStringTrimmed
  desc_en_only?: NonEmptyStringTrimmed
  en_km_com?: NonEmptyStringTrimmed
  from_csv_raw_html?: NonEmptyStringTrimmed
  from_csv_variants?: NonEmptyArray<NonEmptyStringTrimmed>
  from_csv_noun_forms?: NonEmptyArray<NonEmptyStringTrimmed>
  from_csv_pronunciations?: NonEmptyArray<NonEmptyStringTrimmed>
  wiktionary?: NonEmptyStringTrimmed
  from_russian_wiki?: NonEmptyStringTrimmed
  from_chuon_nath?: NonEmptyStringTrimmed
  from_chuon_nath_translated?: NonEmptyStringTrimmed
  colorMode: ColorizationMode
  km_map: KhmerWordsMap | undefined
  mode: DictionaryLanguage
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
}

export const DetailSections = React.memo(
  ({
    desc,
    desc_en_only,
    en_km_com,
    from_csv_raw_html,
    from_csv_variants,
    from_csv_noun_forms,
    from_csv_pronunciations,
    wiktionary,
    from_russian_wiki,
    from_chuon_nath,
    from_chuon_nath_translated,
    colorMode,
    km_map,
    mode,
    onNavigate,
  }: DetailSectionsProps) => {
    return (
      <>
        {desc && (
          <div className="mb-1">
            <SectionTitle>Definition</SectionTitle>
            <RenderHtmlColorized colorMode={colorMode} html={desc} km_map={km_map} />
          </div>
        )}

        {desc_en_only && (
          <div className="mb-6">
            <SectionTitle>English Definition</SectionTitle>
            <RenderHtmlColorized colorMode={colorMode} html={desc_en_only} km_map={km_map} />
          </div>
        )}

        {en_km_com && (
          <div className="mb-1">
            <SectionTitle>English-Khmer</SectionTitle>
            <EnKmHtmlRenderer colorMode={colorMode} html={en_km_com} km_map={km_map} />
          </div>
        )}

        {from_csv_raw_html && (
          <div className="mb-1">
            <SectionTitle>English</SectionTitle>
            {from_csv_variants && (
              <div className="mb-2">
                <CsvListRendererColorized colorMode={colorMode} items={from_csv_variants} km_map={km_map} />
              </div>
            )}
            {from_csv_noun_forms && (
              <>
                <div className="mt-4 border-b border-divider pb-1 mb-3">
                  <span className="text-[0.7em] uppercase tracking-wider font-bold text-default-400">Noun forms</span>
                </div>
                <CsvListRendererColorized colorMode={colorMode} items={from_csv_noun_forms} km_map={km_map} />
              </>
            )}
            {from_csv_pronunciations && (
              <>
                <div className="mt-4 border-b border-divider pb-1 mb-3">
                  <span className="text-[0.7em] uppercase tracking-wider font-bold text-default-400">
                    Pronunciations
                  </span>
                </div>
                <CsvListRendererText items={from_csv_pronunciations} />
              </>
            )}
            <RenderHtml html={from_csv_raw_html} />
          </div>
        )}

        {wiktionary && (
          <div className="mb-6">
            <SectionTitle>Wiktionary</SectionTitle>
            <WiktionaryRenderer
              colorMode={colorMode}
              currentMode={mode}
              html={wiktionary}
              km_map={km_map}
              onNavigate={onNavigate}
            />
          </div>
        )}

        {from_russian_wiki && (
          <div className="mb-6">
            <SectionTitle>Russian Wiki</SectionTitle>
            <RenderHtmlColorized colorMode={colorMode} html={from_russian_wiki} km_map={km_map} />
          </div>
        )}

        {from_chuon_nath && (
          <div className="mb-6">
            <SectionTitle>Chuon Nath</SectionTitle>
            <RenderHtmlColorized colorMode={colorMode} html={from_chuon_nath} km_map={km_map} />
            {from_chuon_nath_translated && (
              <div className="mt-4 pt-4 border-t border-divider">
                <RenderHtmlColorized colorMode={colorMode} html={from_chuon_nath_translated} km_map={km_map} />
              </div>
            )}
          </div>
        )}
      </>
    )
  },
)

DetailSections.displayName = 'DetailSections'

interface DetailViewProps {
  word: NonEmptyStringTrimmed
  mode: DictionaryLanguage
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  fontSize: number
  highlightMatch: string | undefined
  onBack: () => void | undefined
  km_map: KhmerWordsMap | undefined
  canGoBack: boolean | undefined
  colorMode: ColorizationMode
  setColorMode: (c: ColorizationMode) => void
}

const DetailViewImpl = React.forwardRef<HTMLDivElement, DetailViewProps>(
  ({ word, mode, onNavigate, fontSize, onBack, km_map, canGoBack, colorMode, setColorMode }, ref) => {
    const { data, loading, isFav, toggleFav } = useWordData(word, mode)
    const { isGoogleSpeaking, handleNativeSpeak, handleGoogleSpeak } = useTtsHandlers(data, mode)

    // 2. UI State
    const [khmerFont, setKhmerFont] = useState<string>('')

    const handleColorChange = useCallback(
      (keys: SharedSelection) => {
        const selectedKey = Array.from(keys)[0]

        if (!selectedKey) return
        if (typeof selectedKey !== 'string') throw new Error(`not string ${keys}`)
        setColorMode(stringToColorizationModeOrThrow(selectedKey))
      },
      [setColorMode],
    )

    const handleFontChange = useCallback((keys: SharedSelection) => {
      const selectedVal = Array.from(keys)[0]

      if (!selectedVal) return
      if (typeof selectedVal !== 'string') throw new Error(`not string ${keys}`)
      setKhmerFont(selectedVal)
    }, [])

    // 4. Memoized Values & Styles
    const cardStyle = useMemo(
      () => ({
        fontSize: `${fontSize}px`,
        lineHeight: 1.6,
        fontFamily: khmerFont || undefined,
      }),
      [fontSize, khmerFont],
    )

    const colorSelection = useMemo(() => new Set([colorMode]), [colorMode])
    const fontSelection = useMemo(() => new Set([khmerFont]), [khmerFont])

    const displayWordHtml = useMemo(() => {
      if (!data) return undefined

      return { __html: data.word_display ?? data.word }
    }, [data])

    // 6. Loading / Empty States
    if (loading) {
      return (
        <div className="h-full flex items-center justify-center">
          <Spinner color="primary" size="lg" />
        </div>
      )
    }

    if (!data) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-default-400 gap-4">
          <p>Word not found.</p>
          {onBack && (
            <Button color="primary" variant="light" onPress={onBack}>
              Go Back
            </Button>
          )}
        </div>
      )
    }

    return (
      <Card ref={ref} className="h-full w-full border-none rounded-none bg-background shadow-none" style={cardStyle}>
        <DetailViewHeader
          canGoBack={canGoBack}
          colorMode={colorMode}
          colorSelection={colorSelection}
          displayWordHtml={displayWordHtml}
          fontSelection={fontSelection}
          handleColorChange={handleColorChange}
          handleFontChange={handleFontChange}
          handleGoogleSpeak={handleGoogleSpeak}
          handleNativeSpeak={handleNativeSpeak}
          isFav={isFav}
          isGoogleSpeaking={isGoogleSpeaking}
          khmerFont={khmerFont}
          km_map={km_map}
          mode={mode}
          phonetic={data.phonetic}
          toggleFav={toggleFav}
          onBack={onBack}
        />

        {/* BODY */}
        <ScrollShadow className="flex-1">
          <CardBody className="p-6 gap-6">
            <DetailSections
              colorMode={colorMode}
              desc={data.desc}
              desc_en_only={data.desc_en_only}
              en_km_com={data.en_km_com}
              from_chuon_nath={data.from_chuon_nath}
              from_chuon_nath_translated={data.from_chuon_nath_translated}
              from_csv_noun_forms={data.from_csv_noun_forms}
              from_csv_pronunciations={data.from_csv_pronunciations}
              from_csv_raw_html={data.from_csv_raw_html}
              from_csv_variants={data.from_csv_variants}
              from_russian_wiki={data.from_russian_wiki}
              km_map={km_map}
              mode={mode}
              wiktionary={data.wiktionary}
              onNavigate={onNavigate}
            />
          </CardBody>
          <div className="h-[calc(1rem+env(safe-area-inset-bottom))]" />
        </ScrollShadow>
      </Card>
    )
  },
)

DetailViewImpl.displayName = 'DetailView'

export const DetailView = React.memo(DetailViewImpl) as typeof DetailViewImpl
