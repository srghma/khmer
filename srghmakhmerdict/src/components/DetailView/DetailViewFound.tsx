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
import { useLocation } from 'wouter'
import { detectModeFromText } from '../../utils/detectModeFromText'
import type { DictionaryLanguage } from '../../types'
import type { WordDetailEnOrRuOrKm } from '../../db/dict/index'
import { useAppMainView } from '../../hooks/useAppMainView'
import { useKhmerAnalyzer } from '../../providers/KhmerAnalyzerProvider'
import { useDictionary } from '../../providers/DictionaryProvider'

interface DetailViewFoundProps {
  word: NonEmptyStringTrimmed
  data: WordDetailEnOrRuOrKm
  mode: DictionaryLanguage
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void

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
  onNavigate,
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
  const { km_map } = useDictionary()
  const [, setLocation] = useLocation()
  const currentView = useAppMainView()
  const { openKhmerAnalyzer } = useKhmerAnalyzer()

  const currentNavigationStackItem =
    currentView.type === 'history' || currentView.type === 'favorites' || currentView.type === 'dashboard'
      ? currentView.word
        ? { word: currentView.word, mode: currentView.mode }
        : undefined
      : undefined

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
      openKhmerAnalyzer(selectedText, mode)
    },
    [openKhmerAnalyzer, mode],
  )

  const handleOpenSearch = useCallback(
    (selectedText: NonEmptyStringTrimmed) => {
      if (!currentNavigationStackItem) return
      if (!selectedText) return
      const targetMode = detectModeFromText(selectedText) ?? currentNavigationStackItem.mode

      setLocation(`/${targetMode}/${encodeURIComponent(selectedText)}`)
      window.getSelection()?.removeAllRanges()
    },
    [setLocation, currentNavigationStackItem],
  )

  const renderPopupContent = useCallback(
    (selectedText: NonEmptyStringTrimmed) => {
      if (!currentNavigationStackItem) return null

      return (
        <SelectionMenuBody
          currentMode={currentNavigationStackItem.mode}
          selectedText={selectedText}
          onClosePopupAndKhmerAnalyzerModal={() => handleOpenKhmerAnalyzer(selectedText)}
          onClosePopupAndOpenSearch={() => handleOpenSearch(selectedText)}
        />
      )
    },
    [currentNavigationStackItem, km_map, handleOpenKhmerAnalyzer, handleOpenSearch],
  )

  return (
    <Card className="flex flex-col h-full w-full border-none rounded-none bg-background shadow-none">
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
              gorgoniev={data.gorgoniev}
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
