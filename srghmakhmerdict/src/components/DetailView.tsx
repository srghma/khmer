import React, { useState, useCallback, useRef, useMemo } from 'react'
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
import { SelectionContextMenu } from './SelectionContextMenu'
import { useWordData, useTtsHandlers } from '../hooks/useDetailViewLogic'
import { colorizeHtml, colorizeHtml_allowUndefined, type ColorizationMode } from '../utils/text-processing'
import type { KhmerWordsMap } from '../db/dict'
import { EnKmHtmlRenderer } from './EnKmHtmlRenderer'
import { detectModeFromText } from '../utils/rendererUtils'
import { DetailViewHeader } from './DetailViewHeader'

interface DetailViewProps {
  word: NonEmptyStringTrimmed
  mode: DictionaryLanguage
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  fontSize: number
  highlightMatch?: string
  onBack?: () => void
  km_map: KhmerWordsMap | undefined
  canGoBack?: boolean
}

// --- SUB-COMPONENTS ---
// ... (SectionTitle, RenderHtml, HtmlListItem, CsvListRendererHtml, CsvListRendererText remain UNCHANGED) ...
const SectionTitle = React.memo(({ children }: { children: React.ReactNode }) => (
  <div className="text-[0.7em] uppercase tracking-wider font-bold text-default-400 mb-[0.75em] border-b border-divider pb-1">
    {children}
  </div>
))

SectionTitle.displayName = 'SectionTitle'

const RenderHtml = React.memo(({ html }: { html: string | undefined }) => {
  const containerRef = useRef<HTMLDivElement>(null)
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

const HtmlListItem = React.memo(({ html }: { html: string }) => {
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

const CsvListRendererText = React.memo(({ items }: { items: NonEmptyArray<NonEmptyStringTrimmed> }) => (
  <ul className="list-disc list-inside space-y-1 text-foreground/80 font-khmer">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
))

CsvListRendererText.displayName = 'CsvListRendererText'

// --- MAIN COMPONENT ---

export const DetailView: React.FC<DetailViewProps> = React.memo(
  ({ word, mode, onNavigate, fontSize, onBack, km_map, canGoBack }) => {
    const { data, loading, isFav, toggleFav } = useWordData(word, mode)
    const { isGoogleSpeaking, handleNativeSpeak, handleGoogleSpeak } = useTtsHandlers(data, mode)

    // 2. UI State
    const [colorMode, setColorMode] = useState<ColorizationMode>('segmenter')
    const [khmerFont, setKhmerFont] = useState<string>('') // Default empty (System/CSS default)
    const contentRef = useRef<HTMLDivElement>(null)

    // 3. Selection Search Handler
    const handleSelectionSearch = useCallback(
      (text: string) => {
        const trimmed = text.trim()

        if (!trimmed) return
        const targetMode = detectModeFromText(trimmed, mode)

        onNavigate(trimmed as NonEmptyStringTrimmed, targetMode)
      },
      [onNavigate, mode],
    )

    const handleColorChange = useCallback((keys: SharedSelection) => {
      const selectedKey = Array.from(keys)[0] as ColorizationMode | undefined

      if (selectedKey) setColorMode(selectedKey)
    }, [])

    const handleFontChange = useCallback((keys: SharedSelection) => {
      // HeroUI returns Set<string>
      const selectedVal = Array.from(keys)[0] as string | undefined

      // Allow empty string for default
      if (selectedVal !== undefined) setKhmerFont(selectedVal)
    }, [])

    // 4. Memoized Values & Styles

    // Memoize the card style dependent on fontSize prop AND Selected Font
    const cardStyle = useMemo(
      () => ({
        fontSize: `${fontSize}px`,
        lineHeight: 1.6,
        fontFamily: khmerFont || undefined, // Apply font globally to the card content if desired
      }),
      [fontSize, khmerFont],
    )

    // Memoize the Dropdown selection Sets
    const colorSelection = useMemo(() => new Set([colorMode]), [colorMode])
    const fontSelection = useMemo(() => new Set([khmerFont]), [khmerFont])

    // Memoize display word HTML object
    const displayWordHtml = useMemo(() => {
      if (!data) return undefined

      return { __html: data.word_display ?? data.word }
    }, [data])

    // 5. Colorization Processing ... (Keep exactly as is)
    const processArray = useCallback(
      (items: NonEmptyArray<NonEmptyStringTrimmed> | undefined): NonEmptyArray<NonEmptyStringTrimmed> | undefined => {
        if (!items || items.length === 0) return undefined

        return Array_toNonEmptyArray_orThrow(items.map(item => colorizeHtml(item, colorMode, km_map)))
      },
      [colorMode, km_map],
    )

    const processedDesc = useMemo(
      () => colorizeHtml_allowUndefined(data?.desc, colorMode, km_map),
      [data?.desc, colorMode, km_map],
    )
    const processedDescEnOnly = useMemo(
      () => colorizeHtml_allowUndefined(data?.desc_en_only, colorMode, km_map),
      [data?.desc_en_only, colorMode, km_map],
    )
    const processedEnKmCom = useMemo(
      () => colorizeHtml_allowUndefined(data?.en_km_com, colorMode, km_map),
      [data?.en_km_com, colorMode, km_map],
    )
    const processedRussianWiki = useMemo(
      () => colorizeHtml_allowUndefined(data?.from_russian_wiki, colorMode, km_map),
      [data?.from_russian_wiki, colorMode, km_map],
    )
    const processedWiktionary = useMemo(
      () => colorizeHtml_allowUndefined(data?.wiktionary, colorMode, km_map),
      [data?.wiktionary, colorMode, km_map],
    )
    const processedChuonNath = useMemo(
      () => colorizeHtml_allowUndefined(data?.from_chuon_nath, colorMode, km_map),
      [data?.from_chuon_nath, colorMode, km_map],
    )
    const processedChuonNathTrans = useMemo(
      () => colorizeHtml_allowUndefined(data?.from_chuon_nath_translated, colorMode, km_map),
      [data?.from_chuon_nath_translated, colorMode, km_map],
    )

    const processedCsvVariants = useMemo(
      () => processArray(data?.from_csv_variants),
      [data?.from_csv_variants, processArray],
    )
    const processedCsvNounForms = useMemo(
      () => processArray(data?.from_csv_noun_forms),
      [data?.from_csv_noun_forms, processArray],
    )

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
      <Card
        ref={contentRef}
        className="h-full w-full border-none rounded-none bg-background shadow-none"
        style={cardStyle}
      >
        <SelectionContextMenu
          colorMode={colorMode}
          containerRef={contentRef}
          currentMode={mode}
          km_map={km_map}
          onSearch={handleSelectionSearch}
        />

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
            {processedDesc && (
              <div className="mb-6">
                <SectionTitle>Definition</SectionTitle>
                <RenderHtml html={processedDesc} />
              </div>
            )}

            {processedDescEnOnly && (
              <div className="mb-6">
                <SectionTitle>English Definition</SectionTitle>
                <RenderHtml html={processedDescEnOnly} />
              </div>
            )}

            {processedEnKmCom && (
              <div className="mb-6">
                <SectionTitle>English-Khmer</SectionTitle>
                <EnKmHtmlRenderer colorMode={colorMode} html={processedEnKmCom} km_map={km_map} />
              </div>
            )}

            {data.from_csv_raw_html && (
              <div className="mb-6">
                <SectionTitle>English</SectionTitle>
                {processedCsvVariants && (
                  <div className="mb-2">
                    <CsvListRendererHtml items={processedCsvVariants} />
                  </div>
                )}
                {processedCsvNounForms && (
                  <>
                    <div className="mt-4 border-b border-divider pb-1 mb-3">
                      <span className="text-[0.7em] uppercase tracking-wider font-bold text-default-400">
                        Noun forms
                      </span>
                    </div>
                    <CsvListRendererHtml items={processedCsvNounForms} />
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

            {processedWiktionary && (
              <div className="mb-6">
                <SectionTitle>Wiktionary</SectionTitle>
                <WiktionaryRenderer currentMode={mode} html={processedWiktionary} onNavigate={onNavigate} />
              </div>
            )}

            {processedRussianWiki && (
              <div className="mb-6">
                <SectionTitle>Russian Wiki</SectionTitle>
                <RenderHtml html={processedRussianWiki} />
              </div>
            )}

            {processedChuonNath && (
              <div className="mb-6">
                <SectionTitle>Chuon Nath</SectionTitle>
                <RenderHtml html={processedChuonNath} />
                {processedChuonNathTrans && (
                  <div className="mt-4 pt-4 border-t border-divider">
                    <RenderHtml html={processedChuonNathTrans} />
                  </div>
                )}
              </div>
            )}
          </CardBody>
          <div className="h-10" />
        </ScrollShadow>
      </Card>
    )
  },
)

DetailView.displayName = 'DetailView'
