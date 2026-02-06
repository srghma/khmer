import React, { Suspense, useEffect } from 'react'
import { Modal, ModalContent } from '@heroui/modal'
import { Skeleton } from '@heroui/skeleton'
import { type KhmerWordsMap } from '../../db/dict'

import lazyWithPreload from 'react-lazy-with-preload'
import { usePreloadOnIdle } from '../../utils/lazyWithPreload'

// Lazy load content
const KhmerComplexTableContent = lazyWithPreload(() =>
  import('./KhmerComplexTableContent').then(module => ({
    default: module.KhmerComplexTableContent,
  })),
)

// --- Skeleton Component ---
const KhmerComplexTableSkeleton = () => (
  <>
    <div className="flex gap-4 items-center justify-between p-6 border-b border-divider">
      <div className="flex gap-4 items-center">
        <Skeleton className="w-64 h-8 rounded-lg" />
        <div className="flex gap-4 border-l border-divider pl-4">
          <Skeleton className="w-24 h-5 rounded-md" />
          <Skeleton className="w-24 h-5 rounded-md" />
        </div>
      </div>
    </div>
    <div className="p-6 bg-default-50 h-full overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 15 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg bg-content1 border-2 border-default-200" />
        ))}
      </div>
    </div>
  </>
)

// --- Main Modal Wrapper ---

interface KhmerComplexTableModalProps {
  isOpen: boolean
  onClose: () => void
  wordsMap: KhmerWordsMap
}

const modalClassNames = {
  body: 'p-0 overflow-hidden',
  base: 'bg-background text-foreground',
  header: 'border-b border-divider',
}

export const KhmerComplexTableModal: React.FC<KhmerComplexTableModalProps> = ({ isOpen, onClose, wordsMap }) => {
  usePreloadOnIdle([KhmerComplexTableContent])

  // Handle Android Back Button
  useEffect(() => {
    if (isOpen) {
      // Push a state so that popping it closes the modal
      window.history.pushState({ modalOpen: 'khmerTable' }, '')

      const handlePopState = (_event: PopStateEvent) => {
        // If we popped back, close the modal
        onClose()
      }

      window.addEventListener('popstate', handlePopState)

      return () => {
        window.removeEventListener('popstate', handlePopState)
        // Cleanup: If the modal is closed via UI (not back button), we might need to back up history
        // to avoid "forward" stack issues, but usually in single-page apps,
        // explicit close usually implies just returning to previous view state.
        // However, if we closed via onClose (X button), the state remains in history unless we go back.
        // Simple strategy: Just ensure we clean up the listener.
        // Advanced strategy: If `history.state` matches ours, `history.back()` manually.
      }
    }
  }, [isOpen, onClose])

  return (
    <Modal classNames={modalClassNames} isOpen={isOpen} scrollBehavior="inside" size="full" onClose={onClose}>
      <ModalContent>
        {isOpen && (
          <Suspense fallback={<KhmerComplexTableSkeleton />}>
            <KhmerComplexTableContent wordsMap={wordsMap} />
          </Suspense>
        )}
      </ModalContent>
    </Modal>
  )
}
