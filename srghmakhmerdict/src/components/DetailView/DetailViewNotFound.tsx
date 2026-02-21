import { useMemo, useState } from 'react'
import { Card } from '@heroui/card'
import { ScrollShadow } from '@heroui/scroll-shadow'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

import { useKhmerAnalysis } from '../KhmerAnalyzerModal/useKhmerAnalysis'

import type { DictionaryLanguage } from '../../types'

import { useSettings } from '../../providers/SettingsProvider'
import { DetailViewHeader } from './DetailViewHeader'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { GoogleTranslateTextarea } from '../GoogleTranslateTextarea/GoogleTranslateTextarea'
import { KhmerAnalysisResults } from '../KhmerAnalyzerView'
import { truncateString } from '../../utils/truncateString'
import { useI18nContext } from '../../i18n/i18n-react-custom'
import { useDebounce } from 'use-debounce'

interface DetailViewNotFoundProps {
  word: NonEmptyStringTrimmed
  mode: DictionaryLanguage
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  backButton_goBack: (() => void) | undefined
}

export const DetailViewNotFound = ({ word, mode, onNavigate, backButton_goBack }: DetailViewNotFoundProps) => {
  const { LL } = useI18nContext()
  const [analyzedText, setAnalyzedText] = useState<string>(word)
  const analyzedText_nonEmptyTrimmed = useMemo(
    () => String_toNonEmptyString_orUndefined_afterTrim(analyzedText),
    [analyzedText],
  )
  const [debouncedText] = useDebounce(analyzedText_nonEmptyTrimmed, 500)
  // 1. Analyze the unknown text

  const {
    isKhmerLinksEnabled,
    toggleKhmerLinks,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    // toggleKhmerWordsHiding,
    khmerFontName,
    setKhmerFontName,
    maybeColorMode,
    khmerAnalyzerEnabledSegmenters,
    isShowShortDetailAboutKhmerWordEnabled,
    toggleShowShortDetailAboutKhmerWord,
  } = useSettings()

  const res = useKhmerAnalysis(debouncedText, mode, khmerAnalyzerEnabledSegmenters)
  // // 2. Styling
  // const cardStyle = useMemo(
  //   () => ({
  //     fontSize: `${scaling_ui}px`,
  //     fontFamily: khmerFontFamily,
  //   }),
  //   [scaling_ui, khmerFontFamily],
  // )

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
          {LL.DETAIL.NOT_FOUND({ word: w })}
        </button>
        <p className="text-default-500 text-tiny">{LL.DETAIL.ANALYSIS_HINT()}</p>
      </>
    )
  }, [word, LL])

  return (
    <Card className="h-full md:px-1 bg-background">
      <DetailViewHeader
        backButton_goBack={backButton_goBack}
        header={wordNotFound}
        isKhmerLinksEnabled={isKhmerLinksEnabled}
        // isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
        // toggleKhmerWordsHiding={toggleKhmerWordsHiding}
        isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
        khmerFontName={khmerFontName}
        setKhmerFontName={setKhmerFontName}
        toggleKhmerLinks={toggleKhmerLinks}
        toggleShowShortDetailAboutKhmerWord={toggleShowShortDetailAboutKhmerWord}
        type="sentence_analyzer"
        word_or_sentence={word}
        word_or_sentence__language={res.t !== 'empty_text' ? res.analyzedText_language : 'km'}
      />

      <ScrollShadow className="flex-1 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <GoogleTranslateTextarea
          defaultTargetLang="en"
          labelPlacement="outside"
          maxRows={10}
          maybeColorMode={maybeColorMode}
          minRows={2}
          placeholder={LL.DETAIL.PLACEHOLDER()}
          value_toShowInBottom={res.t !== 'empty_text' ? res.analyzedText : undefined}
          value_toShowInTextArea={analyzedText}
          variant="faded"
          onValueChange={setAnalyzedText}
        />

        <KhmerAnalysisResults
          isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
          isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
          isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
          res={res}
          onKhmerWordClick={handleKhmerWordClick}
        />
      </ScrollShadow>
    </Card>
  )
}
