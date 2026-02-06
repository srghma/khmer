import React, { useCallback, useMemo } from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

import { Button } from '@heroui/button'
import { Card, CardBody } from '@heroui/card'
import { ScrollShadow } from '@heroui/scroll-shadow'
import { Spinner } from '@heroui/spinner'

import { type DictionaryLanguage } from '../types'
import { useWordData, useTtsHandlers } from '../hooks/useDetailViewLogic'
import { KHMER_FONT_FAMILY, type KhmerFontName, type MaybeColorizationMode } from '../utils/text-processing/utils'
import type { KhmerWordsMap } from '../db/dict'
import { DetailViewHeader } from './DetailViewHeader'
import { DetailSections } from './DetailView/DetailSections'
import { useWordDisplay } from './DetailView/useWordDisplay'
import useLocalStorageState from 'ahooks/lib/useLocalStorageState'
import { ReactSelectionPopup } from './react-selection-popup/ReactSelectionPopup'
import { SelectionMenuBody } from './SelectionContextMenu/SelectionMenuBody'
import { useNavigation } from '../providers/NavigationProvider'
import { detectModeFromText } from '../utils/rendererUtils'

interface DetailViewProps {
  word: NonEmptyStringTrimmed
  mode: DictionaryLanguage
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  fontSize: number
  highlightMatch: NonEmptyStringTrimmed | undefined
  onBack: () => void | undefined
  km_map: KhmerWordsMap | undefined
  canGoBack: boolean | undefined
  maybeColorMode: MaybeColorizationMode
  setMaybeColorMode: (c: MaybeColorizationMode) => void
  setKhmerAnalyzerModalText_setToOpen: (v: NonEmptyStringTrimmed | undefined) => void
}

const DetailViewImpl = ({
  word,
  mode,
  onNavigate,
  fontSize,
  onBack,
  km_map,
  canGoBack,
  maybeColorMode,
  setMaybeColorMode,
  setKhmerAnalyzerModalText_setToOpen,
}: DetailViewProps) => {
  // 1. Data Logic
  const { data, loading, isFav, toggleFav } = useWordData(word, mode)
  const { isGoogleSpeaking, handleNativeSpeak, handleGoogleSpeak } = useTtsHandlers(data, mode)

  // 2. Appearance Logic (Font, Color, Styles)
  const [khmerFontName, setKhmerFontName] = useLocalStorageState<KhmerFontName>('Default')

  // 3. Display Logic
  const displayWordHtml = useWordDisplay(data)

  const cardStyle = useMemo(
    () => ({
      fontSize: `${fontSize}px`,
      fontFamily: KHMER_FONT_FAMILY[khmerFontName],
    }),
    [fontSize, khmerFontName],
  )

  const handleOpenKhmerAnalyzer = useCallback(
    (selectedText: NonEmptyStringTrimmed) => {
      window.getSelection()?.removeAllRanges()
      setKhmerAnalyzerModalText_setToOpen(selectedText)
    },
    [setKhmerAnalyzerModalText_setToOpen],
  )

  const { navigateTo, currentHistoryItem } = useNavigation()

  const handleOpenSearch = useCallback(
    (selectedText: NonEmptyStringTrimmed) => {
      if (!currentHistoryItem) return
      if (!selectedText) return
      const targetMode = detectModeFromText(selectedText, currentHistoryItem.mode)

      navigateTo(selectedText, targetMode)

      window.getSelection()?.removeAllRanges()
    },
    [navigateTo, currentHistoryItem],
  )

  const renderPopupContent = useCallback(
    (selectedText: NonEmptyStringTrimmed) => {
      if (!currentHistoryItem) return null // Type safety

      return (
        <SelectionMenuBody
          currentMode={currentHistoryItem.mode}
          km_map={km_map}
          selectedText={selectedText}
          onClosePopupAndKhmerAnalyzerModal={() => handleOpenKhmerAnalyzer(selectedText)}
          onClosePopupAndOpenSearch={() => handleOpenSearch(selectedText)}
        />
      )
    },
    [currentHistoryItem, km_map, handleOpenKhmerAnalyzer, handleOpenSearch],
  )

  // 4. Loading / Empty States
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

  // 5. Render
  return (
    <Card className={`h-full w-full border-none rounded-none bg-background shadow-none`} style={cardStyle}>
      <DetailViewHeader
        canGoBack={canGoBack}
        displayWordHtml={displayWordHtml}
        handleGoogleSpeak={handleGoogleSpeak}
        handleNativeSpeak={handleNativeSpeak}
        isFav={isFav}
        isGoogleSpeaking={isGoogleSpeaking}
        khmerFontName={khmerFontName}
        km_map={km_map}
        maybeColorMode={maybeColorMode}
        mode={mode}
        phonetic={data.phonetic}
        setKhmerFontName={setKhmerFontName}
        setMaybeColorMode={setMaybeColorMode}
        toggleFav={toggleFav}
        onBack={onBack}
      />

      {/* BODY */}
      <ScrollShadow className="flex-1 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <CardBody className="p-6 gap-6 your-khmer-text-class">
          <ReactSelectionPopup popupContent={renderPopupContent}>
            <DetailSections
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
              maybeColorMode={maybeColorMode}
              mode={mode}
              wiktionary={data.wiktionary}
              onNavigate={onNavigate}
            />
          </ReactSelectionPopup>
        </CardBody>
      </ScrollShadow>
    </Card>
  )
}

DetailViewImpl.displayName = 'DetailView'

export const DetailView = React.memo(DetailViewImpl) as typeof DetailViewImpl
