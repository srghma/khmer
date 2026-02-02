import React from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

import { Button } from '@heroui/button'
import { Card, CardBody } from '@heroui/card'
import { ScrollShadow } from '@heroui/scroll-shadow'
import { Spinner } from '@heroui/spinner'

import { type DictionaryLanguage } from '../types'
import { useWordData, useTtsHandlers } from '../hooks/useDetailViewLogic'
import { type ColorizationMode } from '../utils/text-processing/utils'
import type { KhmerWordsMap } from '../db/dict'
import { DetailViewHeader } from './DetailViewHeader'
import { DetailSections } from './DetailView/DetailSections'
import { useDetailViewAppearance } from './DetailView/useDetailViewAppearance'
import { useWordDisplay } from './DetailView/useWordDisplay'

interface DetailViewProps {
  word: NonEmptyStringTrimmed
  mode: DictionaryLanguage
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  fontSize: number
  highlightMatch: NonEmptyStringTrimmed | undefined
  onBack: () => void | undefined
  km_map: KhmerWordsMap | undefined
  canGoBack: boolean | undefined
  colorMode: ColorizationMode
  setColorMode: (c: ColorizationMode) => void
}

const DetailViewImpl = React.forwardRef<HTMLDivElement, DetailViewProps>(
  ({ word, mode, onNavigate, fontSize, onBack, km_map, canGoBack, colorMode, setColorMode }, ref) => {
    // 1. Data Logic
    const { data, loading, isFav, toggleFav } = useWordData(word, mode)
    const { isGoogleSpeaking, handleNativeSpeak, handleGoogleSpeak } = useTtsHandlers(data, mode)

    // 2. Appearance Logic (Font, Color, Styles)
    const { khmerFont, cardStyle, colorSelection, fontSelection, handleColorChange, handleFontChange } =
      useDetailViewAppearance({ fontSize, colorMode, setColorMode })

    // 3. Display Logic
    const displayWordHtml = useWordDisplay(data)

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
      <Card ref={ref} className="h-full w-full border-none rounded-none bg-background shadow-none" style={cardStyle}>
        <DetailViewHeader
          canGoBack={canGoBack}
          colorMode={colorMode}
          colorSelection={colorSelection}
          displayWordHtml={displayWordHtml}
          fontSelection={fontSelection}
          handleColorChange={handleColorChange}
          handleFontChange={handleFontChange}
          handleGoogleSpeak={handleGoogleSpeak}
          handleNativeSpeak={handleNativeSpeak}
          isFav={isFav}
          isGoogleSpeaking={isGoogleSpeaking}
          khmerFont={khmerFont}
          km_map={km_map}
          mode={mode}
          phonetic={data.phonetic}
          toggleFav={toggleFav}
          onBack={onBack}
        />

        {/* BODY */}
        <ScrollShadow className="flex-1">
          <CardBody className="p-6 gap-6">
            <DetailSections
              colorMode={colorMode}
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
              mode={mode}
              wiktionary={data.wiktionary}
              onNavigate={onNavigate}
            />
          </CardBody>
          <div className="h-[calc(1rem+env(safe-area-inset-bottom))]" />
        </ScrollShadow>
      </Card>
    )
  },
)

DetailViewImpl.displayName = 'DetailView'

export const DetailView = React.memo(DetailViewImpl) as typeof DetailViewImpl
