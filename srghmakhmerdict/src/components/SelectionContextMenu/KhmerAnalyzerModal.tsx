import React, { useMemo, useState } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/modal'
import { Textarea } from '@heroui/input'
import { ErrorMessage } from '@heroui/react'

import { KhmerAnalyzer } from '../KhmerAnalyzer'
import { GoogleTranslate } from '../GoogleTranslate'
import { detectModeFromText } from '../../utils/rendererUtils'
import type { DictionaryLanguage } from '../../types'
import type { KhmerWordsMap } from '../../db/dict'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { SegmentationPreview } from './SegmentationPreview'
import { strToContainsKhmerOrUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import type { ColorizationMode } from '../../utils/text-processing/utils'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'

// New Hooks and Types
import { useMaybeGenerateTextSegments } from '../../hooks/useMaybeGenerateTextSegments'
import { useKhmerDefinitions } from '../../hooks/useKhmerDefinitions'
import { segmentsToUniqueKhmerWords, type TextSegment } from '../../utils/text-processing/text'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import {
  NonEmptySet_union_maybeUndefined_onCollisionIgnore,
  type NonEmptySet,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import { enhanceSegments } from '../../utils/text-processing/text-enhanced'
import { Spinner } from '@heroui/spinner'

interface KhmerAnalyzerModalProps {
  isOpen: boolean
  text: NonEmptyStringTrimmed
  currentMode: DictionaryLanguage
  colorMode: ColorizationMode
  km_map: KhmerWordsMap | undefined
  onClose: () => void
}

const modalClassNames = {
  base: 'max-h-screen',
  wrapper: 'items-start',
}

const DictionaryLanguage_to_DictionaryLanguage: Record<DictionaryLanguage, DictionaryLanguage> = {
  en: 'km',
  km: 'en',
  ru: 'km',
}

const textAreaClassNames = {
  input: 'text-medium font-khmer leading-relaxed',
  inputWrapper: 'bg-default-100 hover:bg-default-200',
}

const KhmerAnalyzerModalImpl: React.FC<KhmerAnalyzerModalProps> = ({
  isOpen,
  text: initialText,
  onClose,
  currentMode,
  colorMode,
  km_map,
}) => {
  const [analyzedText, setAnalyzedText] = useState<string>(initialText)

  const detectedMode = useMemo(() => detectModeFromText(analyzedText, currentMode), [analyzedText, currentMode])
  const defaultTarget = useMemo(() => DictionaryLanguage_to_DictionaryLanguage[detectedMode], [detectedMode])

  const analyzedText_ = useMemo(() => {
    const x = String_toNonEmptyString_orUndefined_afterTrim(analyzedText)

    if (!x) return undefined

    return strToContainsKhmerOrUndefined(x)
  }, [analyzedText])

  // 1. Get basic segments for both modes
  const segmentsIntl: NonEmptyArray<TextSegment> | undefined = useMaybeGenerateTextSegments(
    analyzedText_,
    'segmenter',
    km_map,
  )
  const segmentsDict: NonEmptyArray<TextSegment> | undefined = useMaybeGenerateTextSegments(
    analyzedText_,
    'dictionary',
    km_map,
  )

  const segmentsDictRawKhmerWords: NonEmptySet<TypedKhmerWord> | undefined = useMemo(
    () => (segmentsIntl ? segmentsToUniqueKhmerWords(segmentsIntl) : undefined),
    [segmentsIntl],
  )
  const segmentsIntlRawKhmerWords: NonEmptySet<TypedKhmerWord> | undefined = useMemo(
    () => (segmentsDict ? segmentsToUniqueKhmerWords(segmentsDict) : undefined),
    [segmentsDict],
  )

  // 2. Extract unique Khmer words to fetch definitions
  const uniqueWords: NonEmptySet<TypedKhmerWord> | undefined = useMemo(
    () => NonEmptySet_union_maybeUndefined_onCollisionIgnore(segmentsIntlRawKhmerWords, segmentsDictRawKhmerWords),
    [segmentsIntlRawKhmerWords, segmentsDictRawKhmerWords],
  )

  // 3. Fetch definitions
  const defsResult = useKhmerDefinitions(uniqueWords)

  const segmentsIntlEnhanced = useMemo(
    () =>
      defsResult.t === 'success' && segmentsIntl ? enhanceSegments(segmentsIntl, defsResult.definitions) : undefined,
    [segmentsIntl, defsResult],
  )

  const segmentsDictEnhanced = useMemo(
    () =>
      defsResult.t === 'success' && segmentsDict ? enhanceSegments(segmentsDict, defsResult.definitions) : undefined,
    [segmentsDict, defsResult],
  )

  const segmentsDict_ = segmentsDict ?? segmentsDictEnhanced
  const segmentsIntl_ = segmentsIntl ?? segmentsIntlEnhanced

  return (
    <Modal classNames={modalClassNames} isOpen={isOpen} scrollBehavior="inside" size="full" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-3 pb-4">
          <h2 className="text-xl font-semibold">Khmer Analyzer</h2>
          <Textarea
            classNames={textAreaClassNames}
            labelPlacement="outside"
            maxRows={6}
            minRows={1}
            placeholder="Enter text to analyze..."
            value={analyzedText}
            variant="faded"
            onValueChange={setAnalyzedText}
          />
        </ModalHeader>

        <ModalBody className="py-6 gap-6">
          {defsResult.t === 'loading' && <Spinner color="default" size="sm" />}
          {defsResult.t === 'request_error' && <ErrorMessage>{defsResult.e.message}</ErrorMessage>}

          {analyzedText_ && km_map && segmentsDict_ && (
            <SegmentationPreview
              colorMode="dictionary"
              km_map={km_map}
              label="Segmentation (Dictionary Lookup)"
              segments={segmentsDict_} // Cast to any because it handles both Segment types
            />
          )}

          <GoogleTranslate colorMode={colorMode} defaultTarget={defaultTarget} km_map={km_map} text={analyzedText} />

          {segmentsIntl_ && <KhmerAnalyzer segments={segmentsIntl_} />}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export const KhmerAnalyzerModal = React.memo(KhmerAnalyzerModalImpl)
