import { useMemo, useState } from 'react'
import { Card } from '@heroui/card'
import { ScrollShadow } from '@heroui/scroll-shadow'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

import { useKhmerAnalysis } from '../KhmerAnalyzerModal/useKhmerAnalysis'

import type { DictionaryLanguage } from '../../types'

import { useSettings } from '../../providers/SettingsProvider'
import { DetailViewHeader } from './DetailViewHeader'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { GoogleTranslateTextarea } from '../GoogleTranslateTextarea/GoogleTranslateTextarea'
import { KhmerAnalysisResults } from '../KhmerAnalyzerView'
import { truncateString } from '../../utils/truncateString'

interface DetailViewNotFoundProps {
  word: NonEmptyStringTrimmed
  mode: DictionaryLanguage
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  backButton_goBack: (() => void) | undefined
  backButton_desktopOnlyStyles_showButton: boolean
}

export const DetailViewNotFound = ({
  word,
  mode,
  onNavigate,
  backButton_goBack,
  backButton_desktopOnlyStyles_showButton,
}: DetailViewNotFoundProps) => {
  const [analyzedText, setAnalyzedText] = useState<string>(word)
  // 1. Analyze the unknown text
  const res = useKhmerAnalysis(analyzedText, mode)

  const {
    isKhmerLinksEnabled,
    toggleKhmerLinks,
    // isKhmerWordsHidingEnabled,
    // toggleKhmerWordsHiding,
    khmerFontName,
    setKhmerFontName,
    khmerFontFamily,
    fontSize_ui,
    maybeColorMode,
  } = useSettings()

  // 2. Styling
  const cardStyle = useMemo(
    () => ({
      fontSize: `${fontSize_ui}px`,
      fontFamily: khmerFontFamily,
    }),
    [fontSize_ui, khmerFontFamily],
  )

  // 3. Stable click handler
  const handleKhmerWordClick = useMemo(() => {
    if (!isKhmerLinksEnabled) return undefined

    return (w: TypedKhmerWord) => onNavigate(w, mode)
  }, [isKhmerLinksEnabled, onNavigate, mode])

  const wordNotFound = useMemo(() => {
    const w = truncateString(word, 20)

    return (
      <>
        <button className="font-semibold text-md" onClick={() => setAnalyzedText(word)}>
          {w} not found
        </button>
        <p className="text-default-500 text-tiny">
          This text is not in the dictionary. Showing automated analysis below.
        </p>
      </>
    )
  }, [word])

  return (
    <Card className="h-full md:px-1 bg-background" style={cardStyle}>
      <DetailViewHeader
        backButton_desktopOnlyStyles_showButton={backButton_desktopOnlyStyles_showButton}
        backButton_goBack={backButton_goBack}
        header={wordNotFound}
        isKhmerLinksEnabled={isKhmerLinksEnabled}
        // isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
        // toggleKhmerWordsHiding={toggleKhmerWordsHiding}
        khmerFontName={khmerFontName}
        setKhmerFontName={setKhmerFontName}
        toggleKhmerLinks={toggleKhmerLinks}
        type="sentence_analyzer"
        word_or_sentence={word}
        word_or_sentence__language={res.t !== 'empty_text' ? res.analyzedText_language : 'km'}
      />

      <ScrollShadow className="flex-1 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <GoogleTranslateTextarea
          defaultTargetLang="en"
          labelPlacement="outside"
          maxRows={10} // Increased slightly to accommodate translation text growth
          maybeColorMode={maybeColorMode}
          minRows={2}
          placeholder="Enter text to analyze..."
          value_toShowInBottom={res.t !== 'empty_text' ? res.analyzedText : undefined}
          value_toShowInTextArea={analyzedText}
          variant="faded"
          onValueChange={setAnalyzedText}
        />

        <KhmerAnalysisResults res={res} onKhmerWordClick={handleKhmerWordClick} />
      </ScrollShadow>
    </Card>
  )
}
