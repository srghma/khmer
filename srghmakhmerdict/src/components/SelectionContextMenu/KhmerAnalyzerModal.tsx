import React, { useMemo, useState } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/modal'
import { Textarea } from '@heroui/input'

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
import { useEnhancedSegments } from '../../hooks/useEnhancedSegments'
import { Array_toNonEmptyArray_orThrow } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { TextSegment } from '../../utils/text-processing/text'
import type { ColorizationMode } from '../../utils/text-processing/utils'

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

  // Use Hook for Segmenter Mode
  const { segments: segmentsIntl, loading: loadingIntl } = useEnhancedSegments(analyzedText_, 'segmenter', km_map)

  // Use Hook for Dictionary Mode
  const { segments: segmentsDict, loading: loadingDict } = useEnhancedSegments(analyzedText_, 'dictionary', km_map)

  // Derive plain segments for the Analyzer (Character Tokenizer)
  // We can use either result, dictionary mode is usually more meaningful for analysis if available
  const segmentsForAnalyzer = useMemo(() => {
    const src = segmentsDict || segmentsIntl

    if (!src) return undefined

    // Map back to simple TextSegment structure for KhmerAnalyzer
    return Array_toNonEmptyArray_orThrow(
      src.map(seg => {
        if (seg.t === 'notKhmer') return seg

        return {
          t: 'khmer',
          words: Array_toNonEmptyArray_orThrow(seg.words.map(w => w.w)),
        } as TextSegment
      }),
    )
  }, [segmentsDict, segmentsIntl])

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
          {analyzedText_ && km_map && (
            <>
              {segmentsIntl && (
                <SegmentationPreview
                  colorMode="segmenter"
                  km_map={km_map}
                  label="Segmentation (International Segmenter)"
                  loading={loadingIntl}
                  segments={segmentsIntl}
                />
              )}

              {segmentsDict && (
                <SegmentationPreview
                  colorMode="dictionary"
                  km_map={km_map}
                  label="Segmentation (Dictionary Lookup)"
                  loading={loadingDict}
                  segments={segmentsDict}
                />
              )}
            </>
          )}

          <GoogleTranslate colorMode={colorMode} defaultTarget={defaultTarget} km_map={km_map} text={analyzedText} />

          {segmentsForAnalyzer && <KhmerAnalyzer segments={segmentsForAnalyzer} />}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export const KhmerAnalyzerModal = React.memo(KhmerAnalyzerModalImpl)
