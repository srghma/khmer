import { useMemo } from 'react'
import { Modal, ModalContent, ModalHeader } from '@heroui/react'

// --- FSRS Imports ---

// --- Types & Interfaces ---
import { type KhmerWordsMap } from '../db/dict'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { getBestDefinitionHtml } from '../utils/WordDetailKm_WithoutKhmerAndHtml'
import { useAnki } from './Anki/useAnki'
import { AnkiList } from './Anki/AnkiList'
import { AnkiButtons } from './Anki/AnkiButtons'
import { AnkiContent } from './Anki/AnkiContent'

// --- Main Modal Component ---

const modalClassNames = {
  body: 'p-0',
  base: 'max-w-[95vw] h-[90vh] max-h-[900px]',
}

export const KhmerAnkiModal = ({
  isOpen,
  onClose,
  items,
  // km_map,
}: {
  isOpen: boolean
  onClose: () => void
  items: TypedContainsKhmer[]
  km_map: KhmerWordsMap
}) => {
  const { cards, selectedWord, isRevealed, setIsRevealed, handleRate, handleSelect, nextIntervals, definitions } =
    useAnki(items, isOpen)

  const currentDefinitionHtml = useMemo(() => {
    if (!selectedWord) return

    const d = definitions[selectedWord]

    if (!d) return

    return getBestDefinitionHtml(d)
  }, [selectedWord, definitions])

  if (!isOpen) return null

  return (
    <Modal backdrop="blur" classNames={modalClassNames} isOpen={isOpen} scrollBehavior="inside" onClose={onClose}>
      <ModalContent>
        <div className="flex flex-row h-full overflow-hidden">
          <AnkiList
            cards={cards}
            definitions={definitions}
            items={items}
            selectedWord={selectedWord}
            onSelect={handleSelect}
          />

          <div className="flex-1 flex flex-col relative bg-content1">
            <ModalHeader className="flex flex-col gap-1 border-b border-divider">
              Khmer Anki Mode
              <span className="text-tiny font-normal text-default-400">
                Read the definition and guess the Khmer word.
              </span>
            </ModalHeader>

            <AnkiContent definitionHtml={currentDefinitionHtml} isRevealed={isRevealed} word={selectedWord} />

            <AnkiButtons
              isDisabled={!selectedWord}
              isRevealed={isRevealed}
              nextIntervals={nextIntervals}
              onRate={handleRate}
              onReveal={() => setIsRevealed(true)}
            />
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}
