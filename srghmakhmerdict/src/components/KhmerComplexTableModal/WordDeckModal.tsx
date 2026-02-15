import { memo, useMemo, useState } from 'react'
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

const WordDeckItem = memo(function WordDeckItem({
  virtualRowSize,
  virtualRowStart,
  dataWords1,
  dataWords2,
  dataTitle,
}: {
  virtualRowSize: number
  virtualRowStart: number
  dataWords1: NonEmptyStringTrimmed | undefined
  dataWords2: NonEmptyStringTrimmed | undefined
  dataTitle: NonEmptyStringTrimmed
}) {
  const style = useMemo(
    () =>
      ({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: `${virtualRowSize}px`,
        transform: `translateY(${virtualRowStart}px)`,
      }) as const,
    [virtualRowSize, virtualRowStart],
  )

  return (
    <div className="flex gap-3 pb-3" id="word-deck-item" style={style}>
      <div className="flex-1 min-w-0">{dataWords1 && <WordCard highlight={dataTitle} word={dataWords1} />}</div>
      <div className="flex-1 min-w-0">{dataWords2 && <WordCard highlight={dataTitle} word={dataWords2} />}</div>
    </div>
  )
})

export const WordDeckModal = memo(({ onClose, data }: { onClose: () => void; data: DeckData }) => {
  // Use state instead of ref to ensure virtualizer updates when modal content mounts
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null)

  // Calculate rows for a 2-column layout
  const rowCount = Math.ceil(data.words.length / 2)

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollElement,
    estimateSize: () => 76, // Height of card (64px) + Gap (12px)
    overscan: 5,
  })

  const divStyle = useMemo(
    () =>
      ({
        height: `${rowVirtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }) as const,
    [rowVirtualizer],
  )

  return (
    <Modal backdrop="blur" classNames={modalClassNames} isOpen={true} size="2xl" onClose={onClose}>
      <ModalContent className="scaling-details">
        <ModalHeader className="flex flex-col gap-1 border-b border-divider shrink-0">
          <div className="flex items-baseline gap-3">
            <span className="font-bold font-khmer text-3xl text-primary">{data.title}</span>
            <span className="text-sm text-default-500">Found in {data.words.length} words</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <div ref={setScrollElement} className="w-full h-full overflow-y-auto px-4 py-4" style={modalBodyDivStyle}>
            <div style={divStyle}>
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const idx1 = virtualRow.index * 2
                const idx2 = idx1 + 1
                const dataWords1 = data.words[idx1]
                const dataWords2 = data.words[idx2]

                return (
                  <WordDeckItem
                    key={virtualRow.key}
                    dataTitle={data.title}
                    dataWords1={dataWords1}
                    dataWords2={dataWords2}
                    virtualRowSize={virtualRow.size}
                    virtualRowStart={virtualRow.start}
                  />
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
