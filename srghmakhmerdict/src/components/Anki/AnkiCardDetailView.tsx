import React, { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react'
import { Card, CardBody } from '@heroui/card'
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
import { detectModeFromText } from '../../utils/detectModeFromText'
import { SelectionMenuBody } from '../SelectionContextMenu/SelectionMenuBody'
import { KHMER_FONT_FAMILY } from '../../utils/text-processing/utils'
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
import { useI18nContext } from '../../i18n/i18n-react-custom'

const SelectionMenuBodyLocalWrapper = React.memo(
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

export const AnkiCardDetailView = React.memo(
  ({
    word,
    data,
    mode,
    isRevealed,
    isKhmerWordsHidingEnabled: isKhmerWordsHidingEnabled_prop,
    isNonKhmerWordsHidingEnabled: isNonKhmerWordsHidingEnabled_prop,
    ankiGameMode,
    userAnswer,
    setUserAnswer,
    onReveal,
  }: {
    word: NonEmptyStringTrimmed
    data: WordDetailEnOrRuOrKm
    mode: DictionaryLanguage
    isRevealed: boolean
    isKhmerWordsHidingEnabled: boolean
    isNonKhmerWordsHidingEnabled: boolean
    ankiGameMode: AnkiGameMode
    userAnswer: string
    setUserAnswer: Dispatch<SetStateAction<string>>
    onReveal: () => void
  }) => {
    const { LL } = useI18nContext()
    // 1. Logic
    const { km_map } = useDictionary()
    const { isAutoFocusAnswerEnabled, setIsAutoFocusAnswerEnabled } = useAnkiSettings()
    const {
      isKhmerLinksEnabled,
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
    const [, setLocation] = useLocation()

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

    // 2. Styling
    const detailsStyle = useMemo(
      () => ({
        fontSize: `${fontSize_details}px`,
        fontFamily: KHMER_FONT_FAMILY[khmerFontName],
      }),
      [fontSize_details, khmerFontName],
    )

    // 3. Selection / Popup Handlers

    // For Anki, "Open Search" means close Anki and navigate in main app
    const handleOpenSearch = useCallback(
      (selectedText: NonEmptyStringTrimmed) => {
        // 1. Navigate in Main App (Push Detail View on top of Anki)
        const targetMode = detectModeFromText(selectedText) ?? mode

        setLocation(`~/${targetMode}/${encodeURIComponent(selectedText)}`)

        window.getSelection()?.removeAllRanges()
      },
      [setLocation, mode],
    )

    const handleOpenKhmerAnalyzer = useCallback(
      (selectedText: NonEmptyStringTrimmed) => {
        window.getSelection()?.removeAllRanges()
        setLocation(`~/khmer_analyzer/${encodeURIComponent(selectedText)}`)
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

    const handlePassOnNavigate = useMemo(
      () => (isKhmerLinksEnabled ? handleOpenSearch : undefined),
      [isKhmerLinksEnabled, handleOpenSearch],
    )

    const guessField = expectedTarget.t
    const guessLabel = useMemo(() => LL.ANKI.YOUR_GUESS({ field: guessField }), [LL, guessField])

    const answerPlaceholder = useMemo(() => LL.ANKI.ANSWER_PLACEHOLDER({ field: guessField }), [LL, guessField])

    const content = useMemo(
      () => (
        <>
          {isRevealed && userAnswer_ && (
            <div className="px-6 py-3 border-b border-divider bg-default-50/50">
              <div className="text-[10px] uppercase font-black tracking-widest text-default-400 mb-1">{guessLabel}</div>
              <KhmerDiff inDictExpected={expectedTarget.v} userProvider={userAnswer_} />
            </div>
          )}

          <CardBody className="p-6 pt-4 gap-6" style={detailsStyle}>
            {!isRevealed && (
              <div className="flex justify-center mb-2">
                <Input
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus={isAutoFocusAnswerEnabled}
                  className="m font-khmer"
                  placeholder={answerPlaceholder}
                  size="sm"
                  value={userAnswer}
                  variant="underlined"
                  onKeyDown={handleKeyDown}
                  onValueChange={setUserAnswer}
                />
              </div>
            )}
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
              isKhmerLinksEnabled_ifTrue_passOnNavigate={isRevealed ? handlePassOnNavigate : undefined}
              isKhmerPronunciationHidingEnabled={isKhmerWordsHidingEnabled_prop}
              isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled_prop}
              isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled_prop}
              km_map={km_map}
              maybeColorMode={maybeColorMode}
              mode={mode}
              wiktionary={data.wiktionary}
            />
          </CardBody>
        </>
      ),
      [
        isRevealed,
        userAnswer_,
        guessLabel,
        expectedTarget,
        detailsStyle,
        isAutoFocusAnswerEnabled,
        answerPlaceholder,
        userAnswer,
        handleKeyDown,
        setUserAnswer,
        data,
        handlePassOnNavigate,
        isKhmerWordsHidingEnabled_prop,
        isNonKhmerWordsHidingEnabled_prop,
        km_map,
        maybeColorMode,
        mode,
      ],
    )

    return (
      <Card className="flex flex-col h-full w-full border-none rounded-none bg-background shadow-none">
        {isRevealed ? (
          <DetailViewHeader
            backButton_desktopOnlyStyles_showButton={false}
            backButton_goBack={onBack}
            isAutoFocusAnswerEnabled={isAutoFocusAnswerEnabled}
            isKhmerLinksEnabled={isKhmerLinksEnabled}
            isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled_prop}
            isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled_prop}
            khmerFontFamily={khmerFontFamily}
            khmerFontName={khmerFontName}
            maybeColorMode={maybeColorMode}
            phonetic={data.phonetic}
            setKhmerFontName={setKhmerFontName}
            setMaybeColorMode={setMaybeColorMode}
            toggleAutoFocusAnswer={toggleAutoFocusAnswer}
            toggleKhmerLinks={toggleKhmerLinks}
            toggleKhmerWordsHiding={toggleKhmerWordsHiding}
            toggleNonKhmerWordsHiding={toggleNonKhmerWordsHiding}
            type="anki_game_back"
            word_displayHtml={data.word_display ?? word}
            word_or_sentence={word}
            word_or_sentence__language={mode}
          />
        ) : (
          <DetailViewHeader
            backButton_desktopOnlyStyles_showButton={false}
            backButton_goBack={onBack}
            header={headerFront}
            isAutoFocusAnswerEnabled={isAutoFocusAnswerEnabled}
            isKhmerLinksEnabled={false}
            khmerFontName={khmerFontName}
            maybeColorMode={maybeColorMode}
            setKhmerFontName={setKhmerFontName}
            setMaybeColorMode={setMaybeColorMode}
            toggleAutoFocusAnswer={toggleAutoFocusAnswer}
            toggleKhmerLinks={toggleKhmerLinks}
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
          {isRevealed ? (
            <ReactSelectionPopup popupContent={renderPopupContent}>{content}</ReactSelectionPopup>
          ) : (
            content
          )}
        </ScrollShadow>
      </Card>
    )
  },
)

AnkiCardDetailView.displayName = 'AnkiCardDetailView'
