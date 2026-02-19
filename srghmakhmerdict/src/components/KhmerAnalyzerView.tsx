import React, { useCallback, memo, useEffect, useRef, useState } from 'react'
import { Button } from '@heroui/button'
import { HiArrowLeft } from 'react-icons/hi2'
import { useLocation } from 'wouter'
import { safeBack } from '../utils/safeBack'
import { GoogleTranslateTextarea } from './GoogleTranslateTextarea/GoogleTranslateTextarea'
import { useSettings } from '../providers/SettingsProvider'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { TextSegment } from '../utils/text-processing/text'
import type { TextSegmentEnhanced } from '../utils/text-processing/text-enhanced'
import { Alert } from '@heroui/alert'
import { Spinner } from '@heroui/react'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { KhmerAnalyzer } from './KhmerAnalyzer'
import { SegmentationPreview } from './KhmerAnalyzerModal/SegmentationPreview'
import { useKhmerAnalysis, type KhmerAnalysisResult } from './KhmerAnalyzerModal/useKhmerAnalysis'
import { useDebounce } from 'use-debounce'
import { useI18nContext } from '../i18n/i18n-react-custom'
import { getUrlSearchParam, KHMER_ANALYZER_PARAM_TEXT, makeKhmerAnalyzerUrl } from '../utils/url-navigation'

interface HeaderTogglerOfSegmenterProps {
  title: string
  initiallySelected: 'dict' | 'intl'
  segmentsDict: NonEmptyArray<TextSegment | TextSegmentEnhanced>
  segmentsIntl: NonEmptyArray<TextSegment | TextSegmentEnhanced>
  children: (data: NonEmptyArray<TextSegment | TextSegmentEnhanced>) => React.ReactNode
}

export function HeaderTogglerOfSegmenter({
  title,
  segmentsDict,
  segmentsIntl,
  initiallySelected,
  children,
}: HeaderTogglerOfSegmenterProps) {
  const { LL } = useI18nContext()
  const [selected, setSelected] = useState(initiallySelected)
  const isDict = selected === 'dict'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h4 className="text-small font-bold uppercase text-default-500 tracking-wider">{title}</h4>
        <button
          className="text-tiny bg-default-100 hover:bg-default-200 px-2 py-0.5 rounded-full border border-default-300 transition-colors text-primary font-medium"
          type="button"
          onClick={() => setSelected(isDict ? 'intl' : 'dict')}
        >
          {isDict ? LL.ANALYZER.USING_APP_DICT() : LL.ANALYZER.USING_INTL_SEGMENTER()}
        </button>
      </div>
      {children(isDict ? segmentsDict : segmentsIntl)}
    </div>
  )
}

interface KhmerAnalysisResultsProps {
  res: KhmerAnalysisResult
  onKhmerWordClick: ((word: TypedKhmerWord) => void) | undefined
}

export const KhmerAnalysisResults: React.FC<KhmerAnalysisResultsProps> = ({ res, onKhmerWordClick }) => {
  const { LL } = useI18nContext()

  if (res.t === 'empty_text') {
    return <div className="py-10 text-center text-default-400 italic">{LL.ANALYZER.EMPTY_TEXT()}</div>
  }

  if (res.t === 'non_empty_text_without_at_least_one_khmer_char') {
    return (
      <Alert color="warning" variant="flat">
        {LL.ANALYZER.NO_KHMER_CHAR()}
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {res.t === 'non_empty_text_with_at_least_one_khmer_char__defs_are_loading' && (
        <div className="flex items-center gap-3 text-small text-primary animate-pulse">
          <Spinner size="sm" /> <span>{LL.ANALYZER.FETCHING_DEFS()}</span>
        </div>
      )}

      {res.t === 'non_empty_text_with_at_least_one_khmer_char__defs_request_errored' && (
        <Alert color="danger" title={LL.ANALYZER.DEFS_FETCH_FAILED()} variant="flat">
          {res.e || LL.ANALYZER.DEFS_FETCH_ERROR()}
        </Alert>
      )}

      <HeaderTogglerOfSegmenter
        initiallySelected="dict"
        segmentsDict={res.segmentsDict}
        segmentsIntl={res.segmentsIntl}
        title={LL.ANALYZER.SEGMENTATION()}
      >
        {segments => (
          <SegmentationPreview maybeColorMode="dictionary" segments={segments} onKhmerWordClick={onKhmerWordClick} />
        )}
      </HeaderTogglerOfSegmenter>

      <HeaderTogglerOfSegmenter
        initiallySelected="intl"
        segmentsDict={res.segmentsDict}
        segmentsIntl={res.segmentsIntl}
        title={LL.ANALYZER.CHARACTER_ANALYSIS()}
      >
        {segments => <KhmerAnalyzer segments={segments} />}
      </HeaderTogglerOfSegmenter>
    </div>
  )
}

interface KhmerAnalyzerViewProps {
  initialText?: NonEmptyStringTrimmed
}

// NOTE: initialText prop is effectively ignored in favor of the URL query param,
// maintaining the pattern from the previous implementation but cleaner.
export const KhmerAnalyzerView: React.FC<KhmerAnalyzerViewProps> = memo(({ initialText: _ignored }) => {
  const { LL } = useI18nContext()
  const [, setLocation] = useLocation()
  const { maybeColorMode, filters } = useSettings()

  const [text, setText] = useState<string>(() => getUrlSearchParam(KHMER_ANALYZER_PARAM_TEXT) ?? '')
  const [debouncedText] = useDebounce(text, 500)
  const isFirstRender = useRef(true)

  // Sync URL when debounced text changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const targetUrl = makeKhmerAnalyzerUrl(debouncedText)
    setLocation(targetUrl, { replace: true })
  }, [debouncedText, setLocation])

  // Sync state when URL changes (Back/Forward)
  useEffect(() => {
    const handlePopState = () => {
      const urlText = getUrlSearchParam(KHMER_ANALYZER_PARAM_TEXT) ?? ''
      if (urlText !== text) {
        setText(urlText)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [text])

  const handleBack = useCallback(() => {
    safeBack(setLocation)
  }, [setLocation])

  const handleNavigate = useCallback(
    (word: NonEmptyStringTrimmed) => {
      setLocation(`~/km/${encodeURIComponent(word)}`)
    },
    [setLocation],
  )

  const res = useKhmerAnalysis(text, filters.km.mode === 'all' ? 'km' : 'km')

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in slide-in-from-right duration-200">
      <div className="flex shrink-0 items-center p-6 pb-4 bg-content1/50 backdrop-blur-md z-10 sticky top-0 border-b border-divider pt-[calc(1rem+env(safe-area-inset-top))]">
        <Button isIconOnly className="mr-3 text-default-500 -ml-2" variant="light" onPress={handleBack}>
          <HiArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">{LL.ANALYZER.TITLE()}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <GoogleTranslateTextarea
            defaultTargetLang="en"
            labelPlacement="outside"
            maxRows={10}
            maybeColorMode={maybeColorMode}
            minRows={3}
            placeholder={LL.ANALYZER.PLACEHOLDER()}
            value_toShowInBottom={res.t !== 'empty_text' ? res.analyzedText : undefined}
            value_toShowInTextArea={text}
            variant="faded"
            onValueChange={setText}
          />

          <KhmerAnalysisResults res={res} onKhmerWordClick={handleNavigate} />
        </div>
      </div>
    </div>
  )
})

KhmerAnalyzerView.displayName = 'KhmerAnalyzerView'
