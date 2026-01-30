import React, { useState, useCallback, useMemo } from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import {
  Array_toNonEmptyArray_orThrow,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { Button } from '@heroui/button'
import { Card, CardBody } from '@heroui/card'
import { ScrollShadow } from '@heroui/scroll-shadow'
import { Spinner } from '@heroui/spinner'
import type { SharedSelection } from '@heroui/system'

import { type DictionaryLanguage } from '../types'
import { WiktionaryRenderer } from './WiktionaryRenderer'
import { useWordData, useTtsHandlers } from '../hooks/useDetailViewLogic'
import { stringToColorizationModeOrThrow, type ColorizationMode } from '../utils/text-processing/utils'
import type { KhmerWordsMap } from '../db/dict'
import { EnKmHtmlRenderer } from './EnKmHtmlRenderer'
import { DetailViewHeader } from './DetailViewHeader'
import { colorizeHtml, colorizeHtml_allowUndefined } from '../utils/text-processing/html'

// --- HELPER FUNCTIONS ---

const processArrayColorized = (
  items: NonEmptyArray<NonEmptyStringTrimmed> | undefined,
  colorMode: ColorizationMode,
  km_map: KhmerWordsMap | undefined,
): NonEmptyArray<NonEmptyStringTrimmed> | undefined => {
  if (!items || items.length === 0) return undefined

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
    colorMode: ColorizationMode
    km_map: KhmerWordsMap | undefined
  }) => {
    const processedHtml = useMemo(() => colorizeHtml_allowUndefined(html, colorMode, km_map), [html, colorMode, km_map])

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
    colorMode: ColorizationMode
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

// --- MAIN COMPONENT ---

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
            {data.desc && (
              <div className="mb-1">
                <SectionTitle>Definition</SectionTitle>
                <RenderHtmlColorized colorMode={colorMode} html={data.desc} km_map={km_map} />
              </div>
            )}

            {data.desc_en_only && (
              <div className="mb-6">
                <SectionTitle>English Definition</SectionTitle>
                <RenderHtmlColorized colorMode={colorMode} html={data.desc_en_only} km_map={km_map} />
              </div>
            )}

            {data.en_km_com && (
              <div className="mb-1">
                <SectionTitle>English-Khmer</SectionTitle>
                <EnKmHtmlRenderer colorMode={colorMode} html={data.en_km_com} km_map={km_map} />
              </div>
            )}

            {data.from_csv_raw_html && (
              <div className="mb-1">
                <SectionTitle>English</SectionTitle>
                {data.from_csv_variants && (
                  <div className="mb-2">
                    <CsvListRendererColorized colorMode={colorMode} items={data.from_csv_variants} km_map={km_map} />
                  </div>
                )}
                {data.from_csv_noun_forms && (
                  <>
                    <div className="mt-4 border-b border-divider pb-1 mb-3">
                      <span className="text-[0.7em] uppercase tracking-wider font-bold text-default-400">
                        Noun forms
                      </span>
                    </div>
                    <CsvListRendererColorized colorMode={colorMode} items={data.from_csv_noun_forms} km_map={km_map} />
                  </>
                )}
                {data.from_csv_pronunciations && (
                  <>
                    <div className="mt-4 border-b border-divider pb-1 mb-3">
                      <span className="text-[0.7em] uppercase tracking-wider font-bold text-default-400">
                        Pronunciations
                      </span>
                    </div>
                    <CsvListRendererText items={data.from_csv_pronunciations} />
                  </>
                )}
                <RenderHtml html={data.from_csv_raw_html} />
              </div>
            )}

            {data.wiktionary && (
              <div className="mb-6">
                <SectionTitle>Wiktionary</SectionTitle>
                <WiktionaryRenderer
                  colorMode={colorMode}
                  currentMode={mode}
                  html={data.wiktionary}
                  km_map={km_map}
                  onNavigate={onNavigate}
                />
              </div>
            )}

            {data.from_russian_wiki && (
              <div className="mb-6">
                <SectionTitle>Russian Wiki</SectionTitle>
                <RenderHtmlColorized colorMode={colorMode} html={data.from_russian_wiki} km_map={km_map} />
              </div>
            )}

            {data.from_chuon_nath && (
              <div className="mb-6">
                <SectionTitle>Chuon Nath</SectionTitle>
                <RenderHtmlColorized colorMode={colorMode} html={data.from_chuon_nath} km_map={km_map} />
                {data.from_chuon_nath_translated && (
                  <div className="mt-4 pt-4 border-t border-divider">
                    <RenderHtmlColorized colorMode={colorMode} html={data.from_chuon_nath_translated} km_map={km_map} />
                  </div>
                )}
              </div>
            )}
          </CardBody>
          <div className="h-[calc(1rem+env(safe-area-inset-bottom))]" />
        </ScrollShadow>
      </Card>
    )
  },
)

DetailViewImpl.displayName = 'DetailView'

export const DetailView = React.memo(DetailViewImpl) as typeof DetailViewImpl
