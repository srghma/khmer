import React from 'react'
import { ModalContent, ModalHeader, ModalBody } from '@heroui/modal'
import { GoogleTranslateTextarea } from '../GoogleTranslateTextarea/GoogleTranslateTextarea'

import type { DictionaryLanguage } from '../../types'
import type { KhmerWordsMap } from '../../db/dict'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'

import { useKhmerAnalysis } from './useKhmerAnalysis'
import { SegmentationPreview } from './SegmentationPreview'
import { KhmerAnalyzer } from '../KhmerAnalyzer'

interface KhmerAnalyzerContentProps {
  text: NonEmptyStringTrimmed
  currentMode: DictionaryLanguage
  maybeColorMode: MaybeColorizationMode
  km_map: KhmerWordsMap
  onNavigate: (word: NonEmptyStringTrimmed) => void
}

const textAreaClassNames = {
  input: 'text-medium font-khmer leading-relaxed',
  inputWrapper: 'bg-default-100 hover:bg-default-200',
}

export const KhmerAnalyzerContent: React.FC<KhmerAnalyzerContentProps> = ({
  text: initialText,
  currentMode,
  maybeColorMode,
  km_map,
  onNavigate,
}) => {
  // Logic is now isolated inside the content
  const { analyzedText, setAnalyzedText, analyzedTextKhmer, segmentsDict, segmentsIntl } = useKhmerAnalysis(
    initialText,
    currentMode,
    km_map,
  )

  return (
    <ModalContent>
      <ModalHeader className="flex flex-col gap-3 pb-4">
        <h2 className="text-xl font-semibold">Khmer Analyzer</h2>

        {/* REPLACED Textarea with GoogleTranslateTextarea */}
        <GoogleTranslateTextarea
          classNames={textAreaClassNames}
          defaultTargetLang="en"
          km_map={km_map}
          labelPlacement="outside"
          maxRows={10} // Increased slightly to accommodate translation text growth
          maybeColorMode={maybeColorMode}
          minRows={2}
          placeholder="Enter text to analyze..."
          value={analyzedText}
          variant="faded"
          onValueChange={setAnalyzedText}
        />
      </ModalHeader>

      <ModalBody className="py-6 gap-6">
        {analyzedTextKhmer && km_map && segmentsDict && (
          <SegmentationPreview
            km_map={km_map}
            label="Segmentation (Dictionary Lookup)"
            maybeColorMode="dictionary"
            segments={segmentsDict}
            onKhmerWordClick={onNavigate}
          />
        )}

        {segmentsIntl && <KhmerAnalyzer segments={segmentsIntl} />}
      </ModalBody>
    </ModalContent>
  )
}
