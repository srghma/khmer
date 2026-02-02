import { memo, useRef } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal'
import { Button } from '@heroui/button'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

// TanStack Virtual
import { useVirtualizer } from '@tanstack/react-virtual'
import { WordCard } from './WordCard'

export interface DeckData {
  title: NonEmptyStringTrimmed
  words: NonEmptyStringTrimmed[]
}

const modalClassNames = {
  base: 'h-[85vh] flex flex-col',
  body: 'p-0 overflow-hidden flex-1',
}

const modalBodyDivStyle = { contain: 'strict' }

export const WordDeckModal = memo(({ onClose, data }: { onClose: () => void; data: DeckData }) => {
  const parentRef = useRef<HTMLDivElement>(null)

  // Calculate rows for a 2-column layout
  const rowCount = Math.ceil(data.words.length / 2)

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 76, // Height of card (64px) + Gap (12px)
    overscan: 5,
  })

  return (
    <Modal backdrop="blur" classNames={modalClassNames} isOpen={true} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 border-b border-divider shrink-0">
          <div className="flex items-baseline gap-3">
            <span className="font-bold font-khmer text-3xl text-primary">{data.title}</span>
            <span className="text-sm text-default-500">Found in {data.words.length} words</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <div ref={parentRef} className="w-full h-full overflow-y-auto px-4 py-4" style={modalBodyDivStyle}>
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const idx1 = virtualRow.index * 2
                const idx2 = idx1 + 1

                return (
                  <div
                    key={virtualRow.key}
                    className="flex gap-3 pb-3"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      {data.words[idx1] && <WordCard highlight={data.title} word={data.words[idx1]} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {data.words[idx2] && <WordCard highlight={data.title} word={data.words[idx2]} />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="border-t border-divider shrink-0">
          <Button color="danger" variant="light" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
})

WordDeckModal.displayName = 'WordDeckModal'
