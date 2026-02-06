import React, { Suspense } from 'react'
import { Modal } from '@heroui/modal'

import type { DictionaryLanguage } from '../../types'
import type { KhmerWordsMap } from '../../db/dict'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'

import lazyWithPreload from 'react-lazy-with-preload'
import { usePreloadOnIdle } from '../../utils/lazyWithPreload'

const KhmerAnalyzerContent = lazyWithPreload(() =>
  import('./KhmerAnalyzerContent').then(module => ({
    default: module.KhmerAnalyzerContent,
  })),
)

interface KhmerAnalyzerModalProps {
  textAndOpen: NonEmptyStringTrimmed | undefined
  currentMode: DictionaryLanguage
  maybeColorMode: MaybeColorizationMode
  km_map: KhmerWordsMap | undefined
  onClose: () => void
}

// FIX: Force height to 100vh to ignore virtual viewport resizing (keyboard)
// Use !important to override inline styles injected by React Aria
const modalClassNames = {
  base: '!h-[100vh] !max-h-[100vh] !my-0 !rounded-none border-none shadow-none pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]',
  wrapper: 'items-start !justify-start', // Anchor to top
  closeButton:
    'top-[calc(1rem+env(safe-area-inset-top))] right-5 z-50 bg-default-100/50 hover:bg-default-200/50 backdrop-blur-md',
}

const KhmerAnalyzerModalImpl: React.FC<KhmerAnalyzerModalProps> = ({
  textAndOpen,
  onClose,
  currentMode,
  maybeColorMode,
  km_map,
}) => {
  usePreloadOnIdle([KhmerAnalyzerContent])

  return (
    <Modal
      classNames={modalClassNames}
      isDismissable={false}
      isKeyboardDismissDisabled={false}
      isOpen={!!textAndOpen}
      placement="top" // Important: Align to top so keyboard overlaps bottom, rather than centering and squishing
      scrollBehavior="inside"
      size="full"
      onClose={onClose}
    >
      {textAndOpen && (
        <Suspense fallback={null}>
          <KhmerAnalyzerContent
            currentMode={currentMode}
            km_map={km_map}
            maybeColorMode={maybeColorMode}
            text={textAndOpen}
          />
        </Suspense>
      )}
    </Modal>
  )
}

export const KhmerAnalyzerModal = React.memo(KhmerAnalyzerModalImpl)
