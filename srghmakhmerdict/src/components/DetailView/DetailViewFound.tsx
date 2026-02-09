import { useCallback, useMemo } from 'react'
import { Card, CardBody } from '@heroui/card'
import { ScrollShadow } from '@heroui/scroll-shadow'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

import { DetailViewHeader } from './DetailViewHeader'
import { DetailSections } from './DetailSections'
import { ReactSelectionPopup } from '../react-selection-popup/ReactSelectionPopup'
import { SelectionMenuBody } from '../SelectionContextMenu/SelectionMenuBody'
import { useSettings } from '../../providers/SettingsProvider'
import { KHMER_FONT_FAMILY } from '../../utils/text-processing/utils'
import { useNavigation } from '../../providers/NavigationProvider'
import { detectModeFromText } from '../../utils/detectModeFromText'
import type { DictionaryLanguage } from '../../types'
import type { KhmerWordsMap, WordDetailEnOrRuOrKm } from '../../db/dict'

interface DetailViewFoundProps {
  word: NonEmptyStringTrimmed
  data: WordDetailEnOrRuOrKm
  mode: DictionaryLanguage
  km_map: KhmerWordsMap
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  setKhmerAnalyzerModalText_setToOpen: (v: NonEmptyStringTrimmed) => void

  // Logic Props
  isFav: boolean
  toggleFav: () => void

  // Appearance / Nav
  backButton_goBack: (() => void) | undefined
  backButton_desktopOnlyStyles_showButton: boolean
}

export const DetailViewFound = ({
  word,
  data,
  mode,
  km_map,
  onNavigate,
  setKhmerAnalyzerModalText_setToOpen,
  isFav,
  toggleFav,
  backButton_goBack,
  backButton_desktopOnlyStyles_showButton,
}: DetailViewFoundProps) => {
  // 1. Logic
  const {
    isKhmerLinksEnabled,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    fontSize_details,
    khmerFontName,
    setKhmerFontName,
    maybeColorMode,
    setMaybeColorMode,
    toggleKhmerLinks,
    toggleKhmerWordsHiding,
    toggleNonKhmerWordsHiding,
    khmerFontFamily,
  } = useSettings()
  const { navigateTo, currentHistoryItem } = useNavigation()

  // // 2. Styling
  // const uiStyle = useMemo(
  //   () => ({
  //     fontSize: `${fontSize_ui}px`,
  //     fontFamily: KHMER_FONT_FAMILY[khmerFontName],
  //   }),
  //   [fontSize_ui, khmerFontName],
  // )

  // 2. Styling
  const detailsStyle = useMemo(
    () => ({
      fontSize: `${fontSize_details}px`,
      fontFamily: KHMER_FONT_FAMILY[khmerFontName],
    }),
    [fontSize_details, khmerFontName],
  )

  // 3. Selection / Popup Handlers
  const handleOpenKhmerAnalyzer = useCallback(
    (selectedText: NonEmptyStringTrimmed) => {
      window.getSelection()?.removeAllRanges()
      setKhmerAnalyzerModalText_setToOpen(selectedText)
    },
    [setKhmerAnalyzerModalText_setToOpen],
  )

  const handleOpenSearch = useCallback(
    (selectedText: NonEmptyStringTrimmed) => {
      if (!currentHistoryItem) return
      if (!selectedText) return
      const targetMode = detectModeFromText(selectedText) ?? currentHistoryItem.mode

      navigateTo(selectedText, targetMode)
      window.getSelection()?.removeAllRanges()
    },
    [navigateTo, currentHistoryItem],
  )

  const renderPopupContent = useCallback(
    (selectedText: NonEmptyStringTrimmed) => {
      if (!currentHistoryItem || !km_map) return null

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

  return (
    <Card className="h-full w-full border-none rounded-none bg-background shadow-none">
      <DetailViewHeader
        backButton_desktopOnlyStyles_showButton={backButton_desktopOnlyStyles_showButton}
        backButton_goBack={backButton_goBack}
        isFav={isFav}
        isKhmerLinksEnabled={isKhmerLinksEnabled}
        isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
        isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
        khmerFontFamily={khmerFontFamily}
        khmerFontName={khmerFontName}
        maybeColorMode={maybeColorMode}
        phonetic={data.phonetic}
        setKhmerFontName={setKhmerFontName}
        setMaybeColorMode={setMaybeColorMode}
        toggleFav={toggleFav}
        toggleKhmerLinks={toggleKhmerLinks}
        toggleKhmerWordsHiding={toggleKhmerWordsHiding}
        toggleNonKhmerWordsHiding={toggleNonKhmerWordsHiding}
        type="known_word"
        word_displayHtml={data.word_display ?? word}
        word_or_sentence={word}
        word_or_sentence__language={mode}
      />

      <ScrollShadow className="flex-1 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <ReactSelectionPopup popupContent={renderPopupContent}>
          <CardBody className="p-6 gap-6" style={detailsStyle}>
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
              isKhmerLinksEnabled_ifTrue_passOnNavigate={isKhmerLinksEnabled ? onNavigate : undefined}
              isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
              isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
              km_map={km_map}
              maybeColorMode={maybeColorMode}
              mode={mode}
              wiktionary={data.wiktionary}
            />
          </CardBody>
        </ReactSelectionPopup>
      </ScrollShadow>
    </Card>
  )
}
