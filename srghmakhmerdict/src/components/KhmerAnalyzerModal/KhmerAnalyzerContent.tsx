import React, { useState, type ReactNode } from 'react'
import { ModalContent, ModalHeader, ModalBody } from '@heroui/modal'
import { GoogleTranslateTextarea } from '../GoogleTranslateTextarea/GoogleTranslateTextarea'

import type { DictionaryLanguage } from '../../types'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'

import { useKhmerAnalysis, type KhmerAnalysisResult } from './useKhmerAnalysis'
import { SegmentationPreview } from './SegmentationPreview'
import { KhmerAnalyzer } from '../KhmerAnalyzer'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { TextSegment } from '../../utils/text-processing/text'
import type { TextSegmentEnhanced } from '../../utils/text-processing/text-enhanced'
import { Alert } from '@heroui/alert'
import { Spinner } from '@heroui/react'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'

interface KhmerAnalyzerContentProps {
  text: NonEmptyStringTrimmed
  currentMode: DictionaryLanguage
  maybeColorMode: MaybeColorizationMode
  onNavigate: (word: NonEmptyStringTrimmed) => void
}

interface HeaderTogglerOfSegmenterProps {
  title: string
  initiallySelected: 'dict' | 'intl'
  segmentsDict: NonEmptyArray<TextSegment | TextSegmentEnhanced>
  segmentsIntl: NonEmptyArray<TextSegment | TextSegmentEnhanced>
  children: (data: NonEmptyArray<TextSegment | TextSegmentEnhanced>) => ReactNode
}

export function HeaderTogglerOfSegmenter({
  title,
  segmentsDict,
  segmentsIntl,
  initiallySelected,
  children,
}: HeaderTogglerOfSegmenterProps) {
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
          using {isDict ? 'app dictionary' : 'intl segmenter'}
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
  // 1. Handling Empty or No Khmer States
  if (res.t === 'empty_text') {
    return <div className="py-10 text-center text-default-400 italic">Enter some text to start analysis</div>
  }

  if (res.t === 'non_empty_text_without_at_least_one_khmer_char') {
    return (
      <Alert color="warning" variant="flat">
        No Khmer characters detected in the provided text.
      </Alert>
    )
  }

  // 2. Handling Khmer Analysis States (Loading / Error / Success)
  return (
    <div className="flex flex-col gap-2">
      {/* Loading Indicator */}
      {res.t === 'non_empty_text_with_at_least_one_khmer_char__defs_are_loading' && (
        <div className="flex items-center gap-3 text-small text-primary animate-pulse">
          <Spinner size="sm" /> <span>Fetching word definitions...</span>
        </div>
      )}

      {/* Error Indicator */}
      {res.t === 'non_empty_text_with_at_least_one_khmer_char__defs_request_errored' && (
        <Alert color="danger" title="Definition Fetch Failed" variant="flat">
          {res.e || 'An unknown error occurred while fetching definitions.'}
        </Alert>
      )}

      {/* Word Segmentation Section */}
      <HeaderTogglerOfSegmenter
        initiallySelected="dict"
        segmentsDict={res.segmentsDict}
        segmentsIntl={res.segmentsIntl}
        title="Word Segmentation"
      >
        {segments => (
          <SegmentationPreview maybeColorMode="dictionary" segments={segments} onKhmerWordClick={onKhmerWordClick} />
        )}
      </HeaderTogglerOfSegmenter>

      {/* Character Analysis Section */}
      <HeaderTogglerOfSegmenter
        initiallySelected="intl"
        segmentsDict={res.segmentsDict}
        segmentsIntl={res.segmentsIntl}
        title="Character Analysis"
      >
        {segments => <KhmerAnalyzer segments={segments} />}
      </HeaderTogglerOfSegmenter>
    </div>
  )
}

export const KhmerAnalyzerContent: React.FC<KhmerAnalyzerContentProps> = ({
  text: initialText,
  currentMode,
  maybeColorMode,
  onNavigate,
}) => {
  const [analyzedText, setAnalyzedText] = useState<string>(initialText)

  // Logic is now isolated inside the content
  const res = useKhmerAnalysis(analyzedText, currentMode)

  return (
    <ModalContent>
      <ModalHeader className="flex flex-col gap-3 pb-4">
        <h2 className="text-xl font-semibold">Khmer Analyzer</h2>
      </ModalHeader>

      <ModalBody className="py-6 gap-8 overflow-y-auto">
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

        <KhmerAnalysisResults res={res} onKhmerWordClick={onNavigate} />
      </ModalBody>
    </ModalContent>
  )
}
