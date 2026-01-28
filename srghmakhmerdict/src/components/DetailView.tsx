import React, { useState, useCallback, useRef, useMemo } from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import {
  Array_toNonEmptyArray_orThrow,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { HiArrowLeft } from 'react-icons/hi2'
import { GoStarFill, GoStar } from 'react-icons/go'
import { IoColorPalette } from 'react-icons/io5'
import { Button } from '@heroui/button'
import { Card, CardHeader, CardBody } from '@heroui/card'
import { Chip } from '@heroui/chip'
import { ScrollShadow } from '@heroui/scroll-shadow'
import { Spinner } from '@heroui/spinner'
import { Tooltip } from '@heroui/tooltip'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown'
import type { SharedSelection } from '@heroui/system'

import { type DictionaryLanguage } from '../types'
import { WiktionaryRenderer } from './WiktionaryRenderer'
import { GoogleSpeakerIcon } from './GoogleSpeakerIcon'
import { SelectionContextMenu } from './SelectionContextMenu'
import { NativeSpeakerIcon } from './NativeSpeakerIcon'
import { useWordData, useTtsHandlers } from '../hooks/useDetailViewLogic'
import { colorizeHtml, type ColorizationMode } from '../utils/text-processing'
import type { KhmerWordsMap } from '../db/dict'
import { EnKmHtmlRenderer } from './EnKmHtmlRenderer'

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

// --- STATIC STYLES & CONFIG ---

// Pure static style, moved outside to avoid recreation
const H1_STYLE: React.CSSProperties = { fontSize: '2em', lineHeight: 1.2 }

// --- SUB-COMPONENTS ---

const SectionTitle = React.memo(({ children }: { children: React.ReactNode }) => (
  <div className="text-[0.7em] uppercase tracking-wider font-bold text-default-400 mb-[0.75em] border-b border-divider pb-1">
    {children}
  </div>
))

SectionTitle.displayName = 'SectionTitle'

const RenderHtml = React.memo(({ html }: { html: string | undefined }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Memoize the innerHTML object
  const dangerousHtml = useMemo(() => (html ? { __html: html } : undefined), [html])

  // Handle broken images
  React.useEffect(() => {
    const container = containerRef.current

    if (!container) return

    const handleImageError = (event: Event) => {
      const target = event.target as HTMLElement

      // Check if the event came from an image
      if (target.tagName === 'IMG') {
        // Hide the broken image completely
        target.style.display = 'none'
      }
    }

    // IMPORTANT: 'error' events do not bubble, so we must use the capture phase (true)
    container.addEventListener('error', handleImageError, true)

    return () => {
      container.removeEventListener('error', handleImageError, true)
    }
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

const CsvListRendererHtml = React.memo(({ items }: { items: NonEmptyArray<NonEmptyStringTrimmed> }) => (
  <ul className="list-disc list-inside space-y-1 text-foreground/80 font-khmer">
    {items.map((item, i) => (
      <li dangerouslySetInnerHTML={{ __html: item }} key={i} />
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
    const contentRef = useRef<HTMLDivElement>(null)

    // 3. Selection Search Handler
    const handleSelectionSearch = useCallback(
      (text: string) => {
        const trimmed = text.trim()

        if (!trimmed) return
        const firstChar = trimmed.charAt(0)
        let targetMode: DictionaryLanguage = mode

        if (/\p{Script=Khmer}/u.test(firstChar)) targetMode = 'km'
        else if (/\p{Script=Cyrillic}/u.test(firstChar)) targetMode = 'ru'
        else if (/[a-zA-Z]/.test(firstChar)) targetMode = 'en'

        onNavigate(trimmed as NonEmptyStringTrimmed, targetMode)
      },
      [onNavigate, mode],
    )

    const handleColorChange = useCallback((keys: SharedSelection) => {
      // HeroUI Dropdown returns a Set-like object
      const selectedKey = Array.from(keys)[0] as ColorizationMode | undefined

      if (selectedKey) {
        setColorMode(selectedKey)
      }
    }, [])

    // 4. Memoized Values & Styles

    // Memoize the card style dependent on fontSize prop
    const cardStyle = useMemo(() => ({ fontSize: `${fontSize}px`, lineHeight: 1.6 }), [fontSize])

    // Memoize the Dropdown selection Set
    const colorSelection = useMemo(() => new Set([colorMode]), [colorMode])

    // Memoize display word HTML object
    const displayWordHtml = useMemo(() => {
      if (!data) return undefined

      return { __html: data.word_display ?? data.word }
    }, [data])

    // 5. Colorization Processing

    // Helper to process arrays efficiently
    const processArray = useCallback(
      (items: NonEmptyArray<NonEmptyStringTrimmed> | undefined) => {
        if (!items) return undefined

        return Array_toNonEmptyArray_orThrow(items.map(item => colorizeHtml(item, colorMode, km_map) ?? item))
      },
      [colorMode, km_map],
    )

    const processedDesc = useMemo(() => colorizeHtml(data?.desc, colorMode, km_map), [data?.desc, colorMode, km_map])
    const processedDescEnOnly = useMemo(
      () => colorizeHtml(data?.desc_en_only, colorMode, km_map),
      [data?.desc_en_only, colorMode, km_map],
    )
    const processedEnKmCom = useMemo(
      () => colorizeHtml(data?.en_km_com, colorMode, km_map),
      [data?.en_km_com, colorMode, km_map],
    )
    const processedRussianWiki = useMemo(
      () => colorizeHtml(data?.from_russian_wiki, colorMode, km_map),
      [data?.from_russian_wiki, colorMode, km_map],
    )
    const processedWiktionary = useMemo(
      () => colorizeHtml(data?.wiktionary, colorMode, km_map),
      [data?.wiktionary, colorMode, km_map],
    )
    const processedChuonNath = useMemo(
      () => colorizeHtml(data?.from_chuon_nath, colorMode, km_map),
      [data?.from_chuon_nath, colorMode, km_map],
    )
    const processedChuonNathTrans = useMemo(
      () => colorizeHtml(data?.from_chuon_nath_translated, colorMode, km_map),
      [data?.from_chuon_nath_translated, colorMode, km_map],
    )

    // CSV Array Colorization
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
        <SelectionContextMenu containerRef={contentRef} currentMode={mode} onSearch={handleSelectionSearch} />

        {/* HEADER */}
        <CardHeader className="flex justify-between items-start p-6 pb-4 bg-content1/50 backdrop-blur-md z-10 sticky top-0 border-b border-divider">
          {onBack && (
            <Button
              isIconOnly
              // LOGIC:
              // 1. Mobile: Always show (standard "Close" or "Back" behavior)
              // 2. Desktop: Only show if we have history (canGoBack is true)
              //    If no history (Sidebar selection), hide it via 'md:hidden'
              className={`mr-3 text-default-500 -ml-2 ${canGoBack ? '' : 'md:hidden'}`}
              variant="light"
              onPress={onBack}
            >
              <HiArrowLeft className="w-6 h-6" />
            </Button>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              {displayWordHtml && (
                <h1
                  dangerouslySetInnerHTML={displayWordHtml}
                  className="font-bold text-foreground font-khmer"
                  style={H1_STYLE}
                />
              )}
              {data.phonetic && (
                <Chip className="font-mono" color="secondary" size="sm" variant="flat">
                  /{data.phonetic}/
                </Chip>
              )}
            </div>
            <div className="mt-1 text-tiny font-mono uppercase text-default-400 tracking-widest">{mode} Dictionary</div>
          </div>

          <div className="flex gap-1 shrink-0">
            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  className="text-default-900 data-[hover=true]:bg-default-100"
                  isLoading={!km_map}
                  radius="full"
                  variant="light"
                >
                  <IoColorPalette className={`h-6 w-6 ${colorMode !== 'none' ? 'text-primary' : 'text-default-500'}`} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Colorization Settings"
                selectedKeys={colorSelection}
                selectionMode="single"
                onSelectionChange={handleColorChange}
              >
                <DropdownItem key="segmenter">Using Segmenter</DropdownItem>
                <DropdownItem key="dictionary">Using Dictionary</DropdownItem>
                <DropdownItem key="none">None</DropdownItem>
              </DropdownMenu>
            </Dropdown>

            <Tooltip closeDelay={0} content="Native Speech">
              <Button isIconOnly radius="full" variant="light" onPress={handleNativeSpeak}>
                <NativeSpeakerIcon className="h-6 w-6 text-default-900" />
              </Button>
            </Tooltip>

            <Tooltip closeDelay={0} content="Google Speech">
              <Button isIconOnly isLoading={isGoogleSpeaking} radius="full" variant="light" onPress={handleGoogleSpeak}>
                {!isGoogleSpeaking && <GoogleSpeakerIcon className="h-6 w-6 text-[#4285F4]" />}
              </Button>
            </Tooltip>

            <Tooltip closeDelay={0} content={isFav ? 'Remove Favorite' : 'Add Favorite'}>
              <Button
                isIconOnly
                className={isFav ? 'text-warning' : 'text-default-400'}
                color={isFav ? 'warning' : 'default'}
                radius="full"
                variant="light"
                onPress={toggleFav}
              >
                {isFav ? <GoStarFill className="h-6 w-6" /> : <GoStar className="h-6 w-6" />}
              </Button>
            </Tooltip>
          </div>
        </CardHeader>

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
                <EnKmHtmlRenderer html={processedEnKmCom} />
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
