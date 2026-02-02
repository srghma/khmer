import { useMemo } from 'react'
import { Modal, ModalContent, ModalHeader } from '@heroui/modal'

import { Spinner } from '@heroui/spinner'
import { type KhmerWordsMap } from '../db/dict'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { getBestDefinitionHtml } from '../utils/WordDetailKm_WithoutKhmerAndHtml'
import { useAnki } from './Anki/useAnki'
import { AnkiList } from './Anki/AnkiList'
import { AnkiButtons } from './Anki/AnkiButtons'
import { AnkiContent } from './Anki/AnkiContent'
import type { NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'

// --- Main Modal Component ---

const modalClassNames = {
  body: 'p-0',
  base: 'max-w-[95vw] h-[90vh] max-h-[900px]',
}

const KhmerAnkiView = ({ items }: { items: NonEmptySet<TypedContainsKhmer> }) => {
  const { state, handleRate, handleSelect, setIsRevealed, nextIntervals } = useAnki(items)

  // 1. Derived Definition (Only when ready)
  const currentDefinitionHtml = useMemo(() => {
    if (state.t !== 'ready') return undefined
    const { definitions, selectedWord } = state

    if (!definitions) return undefined

    const d = definitions[selectedWord]

    if (!d) return undefined

    return getBestDefinitionHtml(d)
  }, [state])

  // 2. Loading / Idle State
  if (state.t !== 'ready') {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4">
        <Spinner size="lg" />
        <p className="text-default-500">Preparing deck...</p>
      </div>
    )
  }

  // 3. Ready State Destructuring
  const { cards, definitions, selectedWord, isRevealed } = state

  return (
    <div className="flex flex-row h-full overflow-hidden">
      <AnkiList cards={cards} definitions={definitions} selectedWord={selectedWord} onSelect={handleSelect} />

      <div className="flex-1 flex flex-col relative bg-content1">
        <ModalHeader className="flex flex-col gap-1 border-b border-divider">
          Khmer Anki Mode
          <span className="text-tiny font-normal text-default-400">Read the definition and guess the Khmer word.</span>
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
  )
}

// --- Modal Wrapper Component ---

export const KhmerAnkiModal = ({
  isOpen,
  onClose,
  items,
}: {
  isOpen: boolean
  onClose: () => void
  items: NonEmptySet<TypedContainsKhmer>
  km_map: KhmerWordsMap
}) => {
  if (!isOpen) return null

  return (
    <Modal backdrop="blur" classNames={modalClassNames} isOpen={isOpen} scrollBehavior="inside" onClose={onClose}>
      <ModalContent>
        <KhmerAnkiView items={items} />
      </ModalContent>
    </Modal>
  )
}
