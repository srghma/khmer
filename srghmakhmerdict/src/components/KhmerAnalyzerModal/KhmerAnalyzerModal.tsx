import React, { Suspense } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/modal'
import { Skeleton } from '@heroui/skeleton'

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

// --- Skeleton Component ---
const KhmerAnalyzerSkeletonImpl = () => {
  return (
    <ModalContent>
      <ModalHeader className="flex flex-col gap-3 pb-4">
        {/* Title "Khmer Analyzer" */}
        <Skeleton className="rounded-lg w-48 h-7" />

        {/* Textarea Input Mock */}
        <div className="flex flex-col gap-2">
          <Skeleton className="rounded-medium w-full h-32" />
        </div>
      </ModalHeader>

      <ModalBody className="py-6 gap-6">
        {/* Segmentation Preview Mock */}
        <div className="flex flex-col gap-2">
          <Skeleton className="rounded-lg w-64 h-5" />
          <Skeleton className="rounded-medium w-full h-24" />
        </div>

        {/* Khmer Analyzer/Translation Results Mock */}
        <div className="flex flex-col gap-2">
          <Skeleton className="rounded-medium w-full h-64" />
        </div>
      </ModalBody>
    </ModalContent>
  )
}

const KhmerAnalyzerSkeleton = React.memo(KhmerAnalyzerSkeletonImpl)

// --- Main Modal Component ---

interface KhmerAnalyzerModalProps {
  textAndOpen: NonEmptyStringTrimmed | undefined
  currentMode: DictionaryLanguage
  maybeColorMode: MaybeColorizationMode
  km_map: KhmerWordsMap | undefined
  onClose: () => void
  onNavigate: (word: NonEmptyStringTrimmed) => void
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
  onNavigate,
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
        <Suspense fallback={<KhmerAnalyzerSkeleton />}>
          <KhmerAnalyzerContent
            currentMode={currentMode}
            km_map={km_map}
            maybeColorMode={maybeColorMode}
            text={textAndOpen}
            onNavigate={onNavigate}
          />
        </Suspense>
      )}
    </Modal>
  )
}

export const KhmerAnalyzerModal = React.memo(KhmerAnalyzerModalImpl)
