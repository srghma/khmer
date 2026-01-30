import React, { useMemo, useState } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/modal'
import { Textarea } from '@heroui/input'

import { KhmerAnalyzer } from '../KhmerAnalyzer'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { GoogleTranslate } from '../GoogleTranslate'
import { detectModeFromText } from '../../utils/rendererUtils'
import type { DictionaryLanguage } from '../../types'
import type { KhmerWordsMap } from '../../db/dict'
import { colorizeHtml, type ColorizationMode } from '../../utils/text-processing'

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
  const analyzedText_ = useMemo(() => String_toNonEmptyString_orUndefined_afterTrim(analyzedText), [analyzedText])

  const __html_colorizedHtml = useMemo(() => {
    if (!analyzedText_) return undefined

    return { __html: colorizeHtml(analyzedText_, colorMode, km_map) }
  }, [analyzedText_, colorMode, km_map])

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

        <ModalBody className="py-6">
          {colorMode !== 'none' && analyzedText_ && (
            <div className="flex flex-col gap-2">
              <span className="text-small text-default-500">Segmentation Preview</span>
              <div
                dangerouslySetInnerHTML={__html_colorizedHtml}
                className="rounded-medium bg-default-50 px-3 py-2 text-medium font-khmer leading-relaxed"
              />
            </div>
          )}
          <GoogleTranslate defaultTarget={defaultTarget} text={analyzedText} />
          <KhmerAnalyzer text={analyzedText} />
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export const KhmerAnalyzerModal = React.memo(KhmerAnalyzerModalImpl)
