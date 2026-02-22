import { useCallback, memo, useMemo } from 'react'
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
import { sanitizeTextForAnalyzer } from '../../utils/sanitizeTextForAnalyzer'
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
import { makeKhmerAnalyzerUrl } from '../../utils/url-navigation'
import { Set_toNonEmptySet_orUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import { generateTextSegments, yieldUniqueKhmerWords } from '../../utils/text-processing/text'
import { useKhmerDefinitions } from '../../hooks/useKhmerDefinitions'
import { String_toNonEmptyString_orUndefined_afterTrim } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

interface DetailViewFoundProps {
  word: NonEmptyStringTrimmed
  data: WordDetailEnOrRuOrKm
  mode: DictionaryLanguage

  // Logic Props
  isFav: boolean
  toggleFav: () => void

  // Appearance / Nav
  backButton_goBack: (() => void) | undefined
}

const SelectionMenuBodyLocalWrapper = memo(function SelectionMenuBodyLocalWrapper({
  selectedText,
  mode,
  handleOpenKhmerAnalyzer,
  handleOpenSearch,
}: {
  selectedText: NonEmptyStringTrimmed
  mode: DictionaryLanguage
  handleOpenKhmerAnalyzer: (text: NonEmptyStringTrimmed) => void
  handleOpenSearch: (text: NonEmptyStringTrimmed) => void
}) {
  const onClosePopupAndKhmerAnalyzerModal = useCallback(
    () => handleOpenKhmerAnalyzer(selectedText),
    [handleOpenKhmerAnalyzer, selectedText],
  )
  const onClosePopupAndOpenSearch = useCallback(() => handleOpenSearch(selectedText), [handleOpenSearch, selectedText])

  return (
    <SelectionMenuBody
      currentMode={mode}
      selectedText={selectedText}
      onClosePopupAndKhmerAnalyzerModal={onClosePopupAndKhmerAnalyzerModal}
      onClosePopupAndOpenSearch={onClosePopupAndOpenSearch}
    />
  )
})

SelectionMenuBodyLocalWrapper.displayName = 'SelectionMenuBodyLocalWrapper'

const DetailViewFoundComponent = ({
  word,
  data,
  mode,
  isFav,
  toggleFav,
  backButton_goBack,
}: DetailViewFoundProps) => {
  // 1. Logic
  const { LL } = useI18nContext()
  const toast = useAppToast()
  const [, setLocation] = useLocation()

  const onNavigate = useCallback(
    (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => setLocation(`~/${mode}/${encodeURIComponent(word)}`),
    [setLocation],
  )

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
    khmerWordsHidingMode,
    nonKhmerWordsHidingMode,
    khmerFontName,
    setKhmerFontName,
    maybeColorMode,
    setMaybeColorMode,
    toggleKhmerLinks,
    setKhmerWordsHidingMode,
    setNonKhmerWordsHidingMode,
    khmerFontFamily,
    isShowShortDetailAboutKhmerWordEnabled,
    toggleShowShortDetailAboutKhmerWord,
  } = useSettings()

  const { km_map } = useDictionary()
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
      setLocation(makeKhmerAnalyzerUrl(sanitizeTextForAnalyzer(selectedText)))
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

  const automaticRussianPronunciation_km_map_value = useMemo(() => {
    return mode === 'km' ? km_map.get(word as TypedContainsKhmer) : undefined
  }, [km_map, word, mode])

  const uniqueKhmerWordsInDetails = useMemo(() => {
    if (!isShowShortDetailAboutKhmerWordEnabled) return undefined

    const words = new Set<TypedKhmerWord>()
    const allHtml = [
      data.desc,
      data.en_km_com,
      data.from_csv_raw_html,
      data.from_chuon_nath,
      data.from_chuon_nath_translated,
      data.from_russian_wiki,
      data.gorgoniev,
      data.wiktionary,
      ...(data.from_csv_variants ?? []),
      ...(data.from_csv_noun_forms ?? []),
    ] as (string | undefined)[]

    allHtml.forEach(html => {
      if (!html) return
      const trimmedHtml = String_toNonEmptyString_orUndefined_afterTrim(html)

      if (!trimmedHtml) return
      const text = trimmedHtml.replace(/<[^>]*>/g, ' ') // Strip HTML tags basic way to get text
      const segments = generateTextSegments(text as NonEmptyStringTrimmed, maybeColorMode, km_map, false)

      for (const w of yieldUniqueKhmerWords(segments)) {
        words.add(w)
      }
    })

    return Set_toNonEmptySet_orUndefined(words)
  }, [data, isShowShortDetailAboutKhmerWordEnabled, km_map, maybeColorMode])

  const shortDefinitionsResult = useKhmerDefinitions(uniqueKhmerWordsInDetails)
  const shortDefinitions = shortDefinitionsResult.t === 'success' ? shortDefinitionsResult.definitions : undefined

  // 4. Scaling Style (REMOVED: scaling is now handled via App.css variables)

  return (
    <Card className="flex flex-col h-full w-full border-none rounded-none bg-background shadow-none">
      <DetailViewHeader
        backButton_goBack={backButton_goBack}
        isFav={isFav}
        isKhmerLinksEnabled={isKhmerLinksEnabled}
        isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
        khmerFontFamily={khmerFontFamily}
        khmerFontName={khmerFontName}
        khmerWordsHidingMode={khmerWordsHidingMode}
        maybeColorMode={maybeColorMode}
        nonKhmerWordsHidingMode={nonKhmerWordsHidingMode}
        phonetic={data.phonetic}
        setKhmerFontName={setKhmerFontName}
        setKhmerWordsHidingMode={setKhmerWordsHidingMode}
        setMaybeColorMode={setMaybeColorMode}
        setNonKhmerWordsHidingMode={setNonKhmerWordsHidingMode}
        toggleFav={toggleFav}
        toggleKhmerLinks={toggleKhmerLinks}
        toggleShowShortDetailAboutKhmerWord={toggleShowShortDetailAboutKhmerWord}
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
                  excludeWord={mode === 'km' ? (word as TypedKhmerWord) : undefined}
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
                  isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
                  khmerWordsHidingMode={khmerWordsHidingMode}
                  km_map={km_map}
                  maybeColorMode={maybeColorMode}
                  mode={mode}
                  nonKhmerWordsHidingMode={nonKhmerWordsHidingMode}
                  shortDefinitions={shortDefinitions}
                  wiktionary={data.wiktionary}
                />
                {automaticRussianPronunciation_km_map_value && (
                  <AutomaticRussianPronunciation
                    isKhmerPronunciationHidingEnabled={false}
                    isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
                    khmerText={word as TypedContainsKhmer}
                    khmerWordsHidingMode={khmerWordsHidingMode}
                    km_map_value={automaticRussianPronunciation_km_map_value}
                    nonKhmerWordsHidingMode={nonKhmerWordsHidingMode}
                    shortDefinitions={shortDefinitions}
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
