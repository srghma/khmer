import React, { useCallback, useMemo } from 'react'
import { Card, CardBody } from '@heroui/card'
import { ScrollShadow } from '@heroui/scroll-shadow'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

import { DetailViewHeader } from '../DetailView/DetailViewHeader'
import { DetailSections } from '../DetailView/DetailSections'
import { ReactSelectionPopup } from '../react-selection-popup/ReactSelectionPopup'
import { SelectionMenuBody } from '../SelectionContextMenu/SelectionMenuBody'
import { useSettings } from '../../providers/SettingsProvider'
import { KHMER_FONT_FAMILY } from '../../utils/text-processing/utils'
import { useNavigation } from '../../providers/NavigationProvider'
import { detectModeFromText } from '../../utils/detectModeFromText'
import type { DictionaryLanguage } from '../../types'
import type { KhmerWordsMap, WordDetailEnOrRuOrKm } from '../../db/dict/index'

export const AnkiCardDetailView = React.memo(
  ({
    word,
    data,
    mode,
    km_map,
    onExit,
    onBack,
  }: {
    word: NonEmptyStringTrimmed
    data: WordDetailEnOrRuOrKm
    mode: DictionaryLanguage
    km_map: KhmerWordsMap
    onExit: () => void
    onBack: () => void
  }) => {
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

    const { navigateTo } = useNavigation()

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
        // 1. Close Anki Modal
        onExit()

        // 2. Navigate in Main App
        const targetMode = detectModeFromText(selectedText) ?? mode

        navigateTo(selectedText, targetMode)

        window.getSelection()?.removeAllRanges()
      },
      [onExit, navigateTo, mode],
    )

    // For Anki, we don't have a "Khmer Analyzer Modal" that sits on top of Anki easily?
    // Or we can simple open the analyzer modal.
    // `App.tsx` has `khmerAnalyzerModalText_setToOpen`.
    // If we want to open it, we need to set that state in App.tsx.
    // But `AnkiGame` is inside `App.tsx`.
    // We can pass `setKhmerAnalyzerModalText_setToOpen` to `AnkiGame` -> ... -> `AnkiCardDetailView`.
    // Or, for simplicity now, we can just treat "Analyzer" same as Search if Analyzer is not strictly required inside Anki modal.
    // BUT the user said: "clicking on open search onClosePopupAndOpenSearch should close anki modal and open definition in main app"
    // The user didn't explicitly say about Analyzer.
    // However, `SelectionMenuBody` demands `onClosePopupAndKhmerAnalyzerModal`.
    // If undefined, the button won't show.

    // Let's pass `undefined` for `onClosePopupAndKhmerAnalyzerModal` for now to keep it simple,
    // OR we can implement it if `App.tsx` passes the setter.
    // Given `App.tsx` structure, we can pass `setKhmerAnalyzerModalText_setToOpen`.
    // Use `useNavigation` context? No, it's state in App.

    // Wait, `RightPanel` receives `setKhmerAnalyzerModalText_setToOpen`.
    // I should probably threading it down if I want the Analyzer button.
    // For now, I will leave it undefined (button hidden) to avoid excessive prop drilling unless requested.
    // The user request was specific about "open search".

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

    return (
      <Card className="flex flex-col h-full w-full border-none rounded-none bg-background shadow-none">
        <DetailViewHeader
          backButton_desktopOnlyStyles_showButton={true} // Always show back button in Anki header? Or only mobile?
          // In AnkiPlayArea mobile header was: <div className="flex md:hidden ...">
          // But now we are replacing that with this Header.
          // In Desktop Anki, do we want a back button?
          // `AnkiPlayArea` `onBack` clears selection.
          // Yes, we probably want to go back to list.
          // `backButton_desktopOnlyStyles_showButton` means "show even on desktop"?
          // DetailView header usually shows back button only on mobile if sidebar is present.
          // In Anki, "Back" means "Clear Selection".
          // Let's say yes, show it.
          backButton_goBack={onBack}
          isKhmerLinksEnabled={isKhmerLinksEnabled}
          isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
          isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
          khmerFontFamily={khmerFontFamily}
          khmerFontName={khmerFontName}
          maybeColorMode={maybeColorMode}
          phonetic={data.phonetic}
          setKhmerFontName={setKhmerFontName}
          setMaybeColorMode={setMaybeColorMode}
          toggleKhmerLinks={toggleKhmerLinks}
          toggleKhmerWordsHiding={toggleKhmerWordsHiding}
          toggleNonKhmerWordsHiding={toggleNonKhmerWordsHiding}
          type="anki_game"
          word_displayHtml={data.word_display ?? word}
          word_or_sentence={word}
          word_or_sentence__language={mode}
        />

        <ScrollShadow className="flex-1 pb-8">
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
                isKhmerLinksEnabled_ifTrue_passOnNavigate={isKhmerLinksEnabled ? w => handleOpenSearch(w) : undefined}
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
  },
)

AnkiCardDetailView.displayName = 'AnkiCardDetailView'
