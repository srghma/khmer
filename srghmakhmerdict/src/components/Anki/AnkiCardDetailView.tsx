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
import { useLocation } from 'wouter'
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
    const [, setLocation] = useLocation()

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
      [onExit, setLocation, mode],
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

    return (
      <Card className="flex flex-col h-full w-full border-none rounded-none bg-background shadow-none">
        <DetailViewHeader
          backButton_desktopOnlyStyles_showButton={true}
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
