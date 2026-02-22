import type { WordsHidingMode } from '../../providers/SettingsProvider'
import React, { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react'
import { Card, CardBody } from '@heroui/card'
import { cn } from '@heroui/theme'
import { ScrollShadow } from '@heroui/scroll-shadow'
import type { DictionaryLanguage } from '../../types'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { ShortDefinitionEn, ShortDefinitionKm, ShortDefinitionRu, WordDetailEnOrRuOrKm } from '../../db/dict/index'
import { DetailViewHeader } from '../DetailView/DetailViewHeader'
import { DetailSections } from '../DetailView/DetailSections'
import { useSettings } from '../../providers/SettingsProvider'
import { useLocation } from 'wouter'
import { sanitizeTextForAnalyzer } from '../../utils/sanitizeTextForAnalyzer'
import { SelectionMenuBody } from '../SelectionContextMenu/SelectionMenuBody'
import { ReactSelectionPopup } from '../react-selection-popup/ReactSelectionPopup'
import { type AnkiGameMode } from './types'
import { KhmerDiff } from './KhmerDiff'
import { getBestDefinitionEnOrRuFromKm } from '../../utils/WordDetailKm_WithoutKhmerAndHtml'
import { Input } from '@heroui/input'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { getBestDefinitionKhmerFromEn } from '../../utils/WordDetailEn_OnlyKhmerAndWithoutHtml'
import { getBestDefinitionKhmerFromRu } from '../../utils/WordDetailRu_OnlyKhmerAndWithoutHtml'
import { useDictionary } from '../../providers/DictionaryProvider'
import { useAnkiSettings } from './useAnkiSettings'
import { useShortDefinitionsByExtractingFromHtml } from '../../hooks/useShortDefinitionsByExtractingFromHtml'
import { useI18nContext } from '../../i18n/i18n-react-custom'
import { useAppToast } from '../../providers/ToastProvider'
import { useAutoReadTts } from '../../hooks/useAutoReadTts'
import { AutomaticRussianPronunciation } from '../DetailView/AutomaticRussianPronunciation'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { EditableHtmlField } from './EditableHtmlField'
import { useFavorites } from '../../providers/FavoritesProvider'
import {
  makeKhmerAnalyzerUrl,
  setLocation_enOrKmOrRuWord_ifInDictionary_detectModeFromText,
} from '../../utils/url-navigation'

const SelectionMenuBodyLocalWrapper = React.memo(function SelectionMenuBodyLocalWrapper({
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

export const AnkiCardDetailView = React.memo(function AnkiCardDetailView({
  word,
  data,
  mode,
  isRevealed,
  khmerWordsHidingMode: khmerWordsHidingMode_prop,
  nonKhmerWordsHidingMode: nonKhmerWordsHidingMode_prop,
  ankiGameMode,
  userAnswer,
  setUserAnswer,
  onReveal,
  additional_html_front,
  additional_html_back,
}: {
  word: NonEmptyStringTrimmed
  data: WordDetailEnOrRuOrKm
  mode: DictionaryLanguage
  isRevealed: boolean
  khmerWordsHidingMode: WordsHidingMode
  nonKhmerWordsHidingMode: WordsHidingMode
  ankiGameMode: AnkiGameMode
  userAnswer: string
  setUserAnswer: Dispatch<SetStateAction<string>>
  onReveal: () => void
  additional_html_front: NonEmptyStringTrimmed | undefined
  additional_html_back: NonEmptyStringTrimmed | undefined
}) {
  const { LL } = useI18nContext()
  const { updateFavoriteHtml } = useFavorites()
  // 1. Logic
  const { km_map, en, ru } = useDictionary()
  const { isAutoFocusAnswerEnabled, setIsAutoFocusAnswerEnabled } = useAnkiSettings()
  const {
    isKhmerLinksEnabled,
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
  const [, setLocation] = useLocation()

  useAutoReadTts(isRevealed ? word : undefined, mode)

  const toggleAutoFocusAnswer = useCallback(
    () => setIsAutoFocusAnswerEnabled(prev => !prev),
    [setIsAutoFocusAnswerEnabled],
  )

  const expectedTarget: {
    t: ShortDefinitionEn['source'] | ShortDefinitionRu['source'] | ShortDefinitionKm['source'] | 'Word'
    v: NonEmptyStringTrimmed
  } = useMemo(() => {
    return assertIsDefinedAndReturn(
      {
        'km:GUESSING_KHMER': { t: 'Word' as const, v: word },
        'en:GUESSING_NON_KHMER': { t: 'Word' as const, v: word },
        'ru:GUESSING_NON_KHMER': { t: 'Word' as const, v: word },
        'km:GUESSING_NON_KHMER': getBestDefinitionEnOrRuFromKm(data),
        'en:GUESSING_KHMER': getBestDefinitionKhmerFromEn(data),
        'ru:GUESSING_KHMER': getBestDefinitionKhmerFromRu(data),
      }[ankiGameMode],
    )
  }, [ankiGameMode, word, data])

  // 3. Selection / Popup Handlers

  // For Anki, "Open Search" means close Anki and navigate in main app
  const handleOpenSearch = useCallback(
    (selectedText: NonEmptyStringTrimmed) => {
      // 1. Navigate in Main App (Push Detail View on top of Anki)
      if (
        !setLocation_enOrKmOrRuWord_ifInDictionary_detectModeFromText(
          selectedText,
          km_map,
          en,
          ru,
          toast,
          setLocation,
          LL,
        )
      ) {
        return
      }

      window.getSelection()?.removeAllRanges()
    },
    [setLocation, mode],
  )

  const handleOpenKhmerAnalyzer = useCallback(
    (selectedText: NonEmptyStringTrimmed) => {
      window.getSelection()?.removeAllRanges()
      setLocation(makeKhmerAnalyzerUrl(sanitizeTextForAnalyzer(selectedText)))
    },
    [setLocation],
  )

  const renderPopupContent = useCallback(
    (selectedText: NonEmptyStringTrimmed) => {
      return (
        <SelectionMenuBodyLocalWrapper
          handleOpenKhmerAnalyzer={handleOpenKhmerAnalyzer}
          handleOpenSearch={handleOpenSearch}
          mode={mode}
          selectedText={selectedText}
        />
      )
    },
    [mode, handleOpenKhmerAnalyzer, handleOpenSearch],
  )

  const userAnswer_ = useMemo(() => String_toNonEmptyString_orUndefined_afterTrim(userAnswer), [userAnswer])

  const headerFront: NonEmptyStringTrimmed = useMemo(() => {
    if (ankiGameMode === 'km:GUESSING_NON_KHMER') {
      return LL.ANKI.MODES.TRANSLATE_TO_EN_RU() as unknown as NonEmptyStringTrimmed
    }

    const targetLang = {
      'km:GUESSING_KHMER': LL.ANKI.LANGUAGES.KHMER(),
      'en:GUESSING_KHMER': LL.ANKI.LANGUAGES.KHMER(),
      'ru:GUESSING_KHMER': LL.ANKI.LANGUAGES.KHMER(),
      'en:GUESSING_NON_KHMER': LL.ANKI.LANGUAGES.ENGLISH(),
      'ru:GUESSING_NON_KHMER': LL.ANKI.LANGUAGES.RUSSIAN(),
    }[ankiGameMode]

    return LL.ANKI.MODES.TRANSLATE_TO({ lang: targetLang }) as unknown as NonEmptyStringTrimmed
  }, [ankiGameMode, LL])

  const onBack = useCallback(() => setLocation(`/anki`), [setLocation])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        onReveal()
      }
    },
    [onReveal],
  )

  const toast = useAppToast()

  const handleNavigate = useCallback(
    (navWord: NonEmptyStringTrimmed) => {
      if (navWord === word) {
        toast.success(LL.COMMON.ALREADY_OPENED(), navWord)
      } else {
        handleOpenSearch(navWord)
      }
    },
    [word, handleOpenSearch, toast, LL],
  )

  const handlePassOnNavigate = useMemo(
    () => (isKhmerLinksEnabled ? handleNavigate : undefined),
    [isKhmerLinksEnabled, handleOpenSearch],
  )

  const guessField = expectedTarget.t
  const guessLabel = useMemo(() => LL.ANKI.YOUR_GUESS({ field: guessField }), [LL, guessField])

  const answerPlaceholder = useMemo(() => LL.ANKI.ANSWER_PLACEHOLDER({ field: guessField }), [LL, guessField])

  const shortDefinitions = useShortDefinitionsByExtractingFromHtml(data)

  const automaticRussianPronunciation_km_map_value = useMemo(() => {
    return mode === 'km' ? km_map.get(word as TypedContainsKhmer) : undefined
  }, [km_map, word, mode])

  const handleSaveFront = useCallback(
    async (newHtml: NonEmptyStringTrimmed | undefined) => {
      await updateFavoriteHtml(word, mode, 'additional_html_front', newHtml)
    },
    [word, mode, updateFavoriteHtml],
  )

  const handleSaveBack = useCallback(
    async (newHtml: NonEmptyStringTrimmed | undefined) => {
      await updateFavoriteHtml(word, mode, 'additional_html_back', newHtml)
    },
    [word, mode, updateFavoriteHtml],
  )

  const content = useMemo(
    () => (
      <>
        {/* Back: Revealed State - Show Diff */}
        {isRevealed && userAnswer_ && (
          <div className="px-6 py-3 border-b border-divider bg-default-50/50">
            <div className={cn('uppercase font-black tracking-widest text-default-400 mb-1', 'text-xs')}>
              {guessLabel}
            </div>
            <KhmerDiff inDictExpected={expectedTarget.v} userProvided={userAnswer_} />
          </div>
        )}

        <CardBody className="p-6 pt-0 gap-6">
          {/* Front: Custom HTML + Input Area */}
          {/* NOTE: We only show the Front HTML if !isRevealed OR if it exists, to match Anki logic.
                But for editing purposes, maybe we want it visible in back too?
                Anki usually shows Front on Back as well. Let's show both on Back for context/editing.
            */}

          <div className="flex flex-col gap-4 justify-center">
            {!isRevealed && (
              <Input
                className="mt-2 font-khmer"
                placeholder={answerPlaceholder}
                size="sm"
                value={userAnswer}
                variant="underlined"
                onKeyDown={handleKeyDown}
                onValueChange={setUserAnswer}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus={isAutoFocusAnswerEnabled}
              />
            )}
          </div>

          <EditableHtmlField
            className={isRevealed ? 'bg-default-50/30' : 'bg-primary-50/20 border-primary/20'}
            initialValue={additional_html_front}
            isKhmerPronunciationHidingEnabled={khmerWordsHidingMode_prop !== 'disabled'}
            isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
            khmerWordsHidingMode={isRevealed ? 'disabled' : khmerWordsHidingMode_prop}
            label={LL.ANKI.FIELDS.FRONT_NOTE()}
            nonKhmerWordsHidingMode={isRevealed ? nonKhmerWordsHidingMode_prop : nonKhmerWordsHidingMode_prop}
            shortDefinitions={shortDefinitions}
            onSave={handleSaveFront}
          />

          {/* Back: Custom HTML (Only visible when revealed) */}
          {isRevealed && (
            <EditableHtmlField
              className="bg-default-100/50 border-default-200"
              initialValue={additional_html_back}
              isKhmerPronunciationHidingEnabled={khmerWordsHidingMode_prop !== 'disabled'}
              isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
              khmerWordsHidingMode={khmerWordsHidingMode_prop}
              label={LL.ANKI.FIELDS.BACK_NOTE()}
              nonKhmerWordsHidingMode={nonKhmerWordsHidingMode_prop}
              shortDefinitions={shortDefinitions}
              onSave={handleSaveBack}
            />
          )}

          {/* Dictionary Data Sections */}
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
            isKhmerLinksEnabled_ifTrue_passOnNavigate={isRevealed ? handlePassOnNavigate : undefined}
            isKhmerPronunciationHidingEnabled={khmerWordsHidingMode_prop !== 'disabled'}
            isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
            khmerWordsHidingMode={khmerWordsHidingMode_prop}
            km_map={km_map}
            maybeColorMode={maybeColorMode}
            mode={mode}
            nonKhmerWordsHidingMode={nonKhmerWordsHidingMode_prop}
            shortDefinitions={shortDefinitions}
            wiktionary={data.wiktionary}
          />

          {automaticRussianPronunciation_km_map_value && (
            <AutomaticRussianPronunciation
              isKhmerPronunciationHidingEnabled={khmerWordsHidingMode_prop !== 'disabled'}
              isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
              khmerText={word as TypedContainsKhmer}
              khmerWordsHidingMode={khmerWordsHidingMode_prop}
              km_map_value={automaticRussianPronunciation_km_map_value}
              nonKhmerWordsHidingMode={nonKhmerWordsHidingMode_prop}
              shortDefinitions={shortDefinitions}
              onWordClick={handleOpenSearch}
            />
          )}
        </CardBody>
      </>
    ),
    [
      isRevealed,
      userAnswer_,
      guessLabel,
      expectedTarget,
      additional_html_front,
      handleSaveFront,
      khmerWordsHidingMode_prop,
      nonKhmerWordsHidingMode_prop,
      LL,
      isAutoFocusAnswerEnabled,
      answerPlaceholder,
      userAnswer,
      handleKeyDown,
      setUserAnswer,
      additional_html_back,
      handleSaveBack,
      data,
      handlePassOnNavigate,
      km_map,
      maybeColorMode,
      mode,
      shortDefinitions,
      isShowShortDetailAboutKhmerWordEnabled,
      automaticRussianPronunciation_km_map_value,
      handleOpenSearch,
    ],
  )

  return (
    <Card className="flex flex-col h-full w-full border-none rounded-none bg-background shadow-none">
      {isRevealed ? (
        <DetailViewHeader
          backButton_goBack={onBack}
          isAutoFocusAnswerEnabled={isAutoFocusAnswerEnabled}
          isKhmerLinksEnabled={isKhmerLinksEnabled}
          isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
          khmerFontFamily={khmerFontFamily}
          khmerFontName={khmerFontName}
          khmerWordsHidingMode={khmerWordsHidingMode_prop}
          maybeColorMode={maybeColorMode}
          nonKhmerWordsHidingMode={nonKhmerWordsHidingMode_prop}
          phonetic={data.phonetic}
          setKhmerFontName={setKhmerFontName}
          setKhmerWordsHidingMode={setKhmerWordsHidingMode}
          setMaybeColorMode={setMaybeColorMode}
          setNonKhmerWordsHidingMode={setNonKhmerWordsHidingMode}
          toggleAutoFocusAnswer={toggleAutoFocusAnswer}
          toggleKhmerLinks={toggleKhmerLinks}
          toggleShowShortDetailAboutKhmerWord={toggleShowShortDetailAboutKhmerWord}
          type="anki_game_back"
          word_displayHtml={data.word_display ?? word}
          word_or_sentence={word}
          word_or_sentence__language={mode}
        />
      ) : (
        <DetailViewHeader
          backButton_goBack={onBack}
          header={headerFront}
          isAutoFocusAnswerEnabled={isAutoFocusAnswerEnabled}
          isKhmerLinksEnabled={false}
          isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
          khmerFontName={khmerFontName}
          maybeColorMode={maybeColorMode}
          setKhmerFontName={setKhmerFontName}
          setMaybeColorMode={setMaybeColorMode}
          toggleAutoFocusAnswer={toggleAutoFocusAnswer}
          toggleKhmerLinks={toggleKhmerLinks}
          toggleShowShortDetailAboutKhmerWord={toggleShowShortDetailAboutKhmerWord}
          type={
            ankiGameMode.includes('GUESSING_NON_KHMER')
              ? 'anki_game_front_and_khmer_words_are_shown'
              : 'anki_game_front_and_khmer_words_are_not_shown'
          }
          word_or_sentence={word}
          word_or_sentence__language={mode}
        />
      )}

      <ScrollShadow className="flex-1 pb-8">
        {isRevealed ? <ReactSelectionPopup popupContent={renderPopupContent}>{content}</ReactSelectionPopup> : content}
      </ScrollShadow>
    </Card>
  )
})

AnkiCardDetailView.displayName = 'AnkiCardDetailView'
