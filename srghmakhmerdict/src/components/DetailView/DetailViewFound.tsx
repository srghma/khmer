import { useCallback, memo } from 'react'
import { Card, CardBody } from '@heroui/card'
import { ScrollShadow } from '@heroui/scroll-shadow'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

import { DetailViewHeader } from './DetailViewHeader'
import { DetailSections } from './DetailSections'
import { ReactSelectionPopup } from '../react-selection-popup/ReactSelectionPopup'
import { SelectionMenuBody } from '../SelectionContextMenu/SelectionMenuBody'
import { useSettings } from '../../providers/SettingsProvider'
import { useLocation } from 'wouter'
import { detectModeFromText } from '../../utils/detectModeFromText'
import type { DictionaryLanguage } from '../../types'
import type { WordDetailEnOrRuOrKm } from '../../db/dict/index'
import { useAppMainView } from '../../hooks/useAppMainView'
import { useDictionary } from '../../providers/DictionaryProvider'
import { useI18nContext } from '../../i18n/i18n-react-custom'
import { useAppToast } from '../../providers/ToastProvider'
import { useAutoReadTts } from '../../hooks/useAutoReadTts'
import { AutomaticRussianPronunciation } from './AutomaticRussianPronunciation'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'

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
}

const SelectionMenuBodyLocalWrapper = memo(
  ({
    selectedText,
    mode,
    handleOpenKhmerAnalyzer,
    handleOpenSearch,
  }: {
    selectedText: NonEmptyStringTrimmed
    mode: DictionaryLanguage
    handleOpenKhmerAnalyzer: (text: NonEmptyStringTrimmed) => void
    handleOpenSearch: (text: NonEmptyStringTrimmed) => void
  }) => {
    const onClosePopupAndKhmerAnalyzerModal = useCallback(
      () => handleOpenKhmerAnalyzer(selectedText),
      [handleOpenKhmerAnalyzer, selectedText],
    )
    const onClosePopupAndOpenSearch = useCallback(
      () => handleOpenSearch(selectedText),
      [handleOpenSearch, selectedText],
    )

    return (
      <SelectionMenuBody
        currentMode={mode}
        selectedText={selectedText}
        onClosePopupAndKhmerAnalyzerModal={onClosePopupAndKhmerAnalyzerModal}
        onClosePopupAndOpenSearch={onClosePopupAndOpenSearch}
      />
    )
  },
)

SelectionMenuBodyLocalWrapper.displayName = 'SelectionMenuBodyLocalWrapper'

const DetailViewFoundComponent = ({
  word,
  data,
  mode,
  onNavigate,
  isFav,
  toggleFav,
  backButton_goBack,
}: DetailViewFoundProps) => {
  // 1. Logic
  const { LL } = useI18nContext()
  const toast = useAppToast()

  const handleNavigate = useCallback(
    (navWord: NonEmptyStringTrimmed, navMode: DictionaryLanguage) => {
      if (navWord === word && navMode === mode) {
        toast.success(LL.COMMON.ALREADY_OPENED(), navWord)
      } else {
        onNavigate(navWord, navMode)
      }
    },
    [word, mode, onNavigate, toast, LL],
  )

  const {
    isKhmerLinksEnabled,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
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

  useAutoReadTts(word, mode)

  const currentNavigationStackItem =
    currentView.type === 'history' || currentView.type === 'favorites' || currentView.type === 'dashboard'
      ? currentView.word
        ? { word: currentView.word, mode: currentView.mode }
        : undefined
      : undefined

  // 2. Styling (REMOVED: scaling and font are now handled via App.css variables)

  // 3. Selection / Popup Handlers
  const handleOpenKhmerAnalyzer = useCallback(
    (selectedText: NonEmptyStringTrimmed) => {
      window.getSelection()?.removeAllRanges()
      setLocation(`/khmer_analyzer/${encodeURIComponent(selectedText)}`)
    },
    [setLocation],
  )

  const handleOpenSearch = useCallback(
    (selectedText: NonEmptyStringTrimmed) => {
      if (!currentNavigationStackItem) return
      if (!selectedText) return
      const targetMode = detectModeFromText(selectedText) ?? currentNavigationStackItem.mode

      handleNavigate(selectedText, targetMode)
      window.getSelection()?.removeAllRanges()
    },
    [handleNavigate, currentNavigationStackItem, mode],
  )

  const renderPopupContent = useCallback(
    (selectedText: NonEmptyStringTrimmed) => {
      if (!currentNavigationStackItem) return null

      return (
        <SelectionMenuBodyLocalWrapper
          handleOpenKhmerAnalyzer={handleOpenKhmerAnalyzer}
          handleOpenSearch={handleOpenSearch}
          mode={currentNavigationStackItem.mode}
          selectedText={selectedText}
        />
      )
    },
    [currentNavigationStackItem, handleOpenKhmerAnalyzer, handleOpenSearch],
  )

  const automaticRussianPronunciation_onClick = useCallback(
    (w: TypedKhmerWord) => handleNavigate(w, 'km'),
    [handleNavigate],
  )

  // 4. Scaling Style (REMOVED: scaling is now handled via App.css variables)

  return (
    <Card className="flex flex-col h-full w-full border-none rounded-none bg-background shadow-none">
      <DetailViewHeader
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

      <div className="flex-1 overflow-hidden w-full relative">
        <div className="flex flex-col h-full w-full">
          <ScrollShadow className="flex-1 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <ReactSelectionPopup popupContent={renderPopupContent}>
              <CardBody className="p-6 gap-6">
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
                  isKhmerLinksEnabled_ifTrue_passOnNavigate={isKhmerLinksEnabled ? handleNavigate : undefined}
                  isKhmerPronunciationHidingEnabled={false}
                  isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
                  isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
                  km_map={km_map}
                  maybeColorMode={maybeColorMode}
                  mode={mode}
                  wiktionary={data.wiktionary}
                />
                {mode === 'km' && (
                  <AutomaticRussianPronunciation
                    isKhmerPronunciationHidingEnabled={false}
                    isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
                    isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
                    khmerText={word as TypedContainsKhmer}
                    onWordClick={automaticRussianPronunciation_onClick}
                  />
                )}
              </CardBody>
            </ReactSelectionPopup>
          </ScrollShadow>
        </div>
      </div>
    </Card>
  )
}

export const DetailViewFound = memo(DetailViewFoundComponent)

DetailViewFound.displayName = 'DetailViewFound'
