import React, { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react'
import { Card, CardBody } from '@heroui/card'
import { ScrollShadow } from '@heroui/scroll-shadow'
import type { DictionaryLanguage } from '../../types'
import {
  nonEmptyString_afterTrim,
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { KhmerWordsMap, WordDetailEnOrRuOrKm } from '../../db/dict/index'
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
import { getBestDefinitionHtml } from '../../utils/WordDetailKm_WithoutKhmerAndHtml'
import { Input } from '@heroui/input'

export const AnkiCardDetailView = React.memo(
  ({
    word,
    data,
    mode,
    km_map,
    onBack,
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
    km_map: KhmerWordsMap
    onBack: () => void
    isRevealed: boolean
    isKhmerWordsHidingEnabled: boolean
    isNonKhmerWordsHidingEnabled: boolean
    ankiGameMode: AnkiGameMode
    userAnswer: string
    setUserAnswer: Dispatch<SetStateAction<string>>
    onReveal: () => void
  }) => {
    // 1. Logic
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

    const expectedTarget = useMemo(() => {
      // If we are guessing the word
      if (
        ['km:GUESS_KHMER', 'en:GUESS_NON_KHMER', 'ru:GUESS_NON_KHMER', 'en:GUESS_KHMER', 'ru:GUESS_KHMER'].includes(
          ankiGameMode,
        )
      ) {
        return nonEmptyString_afterTrim(word)
      }
      // If we are guessing the definition (km:GUESS_NON_KHMER)
      if (ankiGameMode === 'km:GUESS_NON_KHMER') {
        const def = getBestDefinitionHtml(data)

        return def ? nonEmptyString_afterTrim(def) : undefined
      }

      return undefined
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

        setLocation(`/${targetMode}/${encodeURIComponent(selectedText)}`)

        window.getSelection()?.removeAllRanges()
      },
      [setLocation, mode],
    )

    const renderPopupContent = useCallback(
      (selectedText: NonEmptyStringTrimmed) => {
        if (!km_map) return null

        return (
          <SelectionMenuBody
            currentMode={mode}
            km_map={km_map}
            selectedText={selectedText}
            onClosePopupAndKhmerAnalyzerModal={undefined}
            onClosePopupAndOpenSearch={() => handleOpenSearch(selectedText)}
          />
        )
      },
      [mode, km_map, handleOpenSearch],
    )

    const userAnswer_ = useMemo(() => String_toNonEmptyString_orUndefined_afterTrim(userAnswer), [userAnswer])

    return (
      <Card className="flex flex-col h-full w-full border-none rounded-none bg-background shadow-none">
        {isRevealed ? (
          <DetailViewHeader
            backButton_desktopOnlyStyles_showButton={true}
            backButton_goBack={onBack}
            isKhmerLinksEnabled={isKhmerLinksEnabled}
            isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled_prop}
            isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled_prop}
            khmerFontFamily={khmerFontFamily}
            khmerFontName={khmerFontName}
            maybeColorMode={maybeColorMode}
            phonetic={data.phonetic}
            setKhmerFontName={setKhmerFontName}
            setMaybeColorMode={setMaybeColorMode}
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
            backButton_desktopOnlyStyles_showButton={true}
            backButton_goBack={undefined}
            header={
              (['km:GUESS_KHMER', 'en:GUESS_NON_KHMER', 'ru:GUESS_NON_KHMER'].includes(ankiGameMode)
                ? 'Translate to Khmer'
                : 'Translate / Define') as NonEmptyStringTrimmed
            }
            isKhmerLinksEnabled={isKhmerLinksEnabled}
            khmerFontName={khmerFontName}
            maybeColorMode={maybeColorMode}
            setKhmerFontName={setKhmerFontName}
            setMaybeColorMode={setMaybeColorMode}
            toggleKhmerLinks={toggleKhmerLinks}
            type="anki_game_front_and_khmer_words_are_shown"
            word_or_sentence={word}
            word_or_sentence__language={mode}
          />
        )}

        {isRevealed && userAnswer_ && expectedTarget && (
          <div className="px-6 py-3 border-b border-divider bg-default-50/50">
            <div className="text-[10px] uppercase font-black tracking-widest text-default-400 mb-1">Your Guess</div>
            <KhmerDiff inDictExpected={expectedTarget} userProvider={userAnswer_} />
          </div>
        )}

        <ScrollShadow className="flex-1 pb-8">
          <ReactSelectionPopup popupContent={renderPopupContent}>
            <CardBody className="p-6 pt-4 gap-6" style={detailsStyle}>
              {!isRevealed && (
                <div className="flex justify-center mb-2">
                  <Input
                    autoFocus
                    className="max-w-[200px] font-khmer"
                    placeholder="Answer..."
                    size="sm"
                    value={userAnswer}
                    variant="underlined"
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
                isKhmerLinksEnabled_ifTrue_passOnNavigate={isKhmerLinksEnabled ? w => handleOpenSearch(w) : undefined}
                isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled_prop}
                isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled_prop}
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
  },
)

AnkiCardDetailView.displayName = 'AnkiCardDetailView'
