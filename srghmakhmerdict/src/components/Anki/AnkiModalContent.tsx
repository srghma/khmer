import { useMemo } from 'react'
import { ModalHeader } from '@heroui/modal'
import { Spinner } from '@heroui/spinner'
import type { NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'

import { getBestDefinitionHtml } from '../../utils/WordDetailKm_WithoutKhmerAndHtml'
import { useAnki, type AnkiState } from './useAnki'
import { AnkiList } from './AnkiList'
import { AnkiButtons } from './AnkiButtons'
import { AnkiContent } from './AnkiContent'
import React from 'react'

// --- Sub-component for Ready State ---

const AnkiModalContentReady = React.memo(({ state }: { state: AnkiState & { t: 'ready' } }) => {
  const { cards, definitions, selectedWord, isRevealed, nextIntervals, handleSelect, handleRate, revealSet } = state

  const currentDefinitionHtml = useMemo(() => {
    if (!definitions) return undefined
    const d = definitions[selectedWord]

    if (!d) return undefined

    return getBestDefinitionHtml(d)
  }, [definitions, selectedWord])

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
          isDisabled={false}
          isRevealed={isRevealed}
          nextIntervals={nextIntervals}
          onRate={handleRate}
          onReveal={revealSet}
        />
      </div>
    </div>
  )
})

AnkiModalContentReady.displayName = 'AnkiModalContentReady'

// --- Main Modal Component ---

export const AnkiModalContent = React.memo(({ items }: { items: NonEmptySet<TypedContainsKhmer> }) => {
  const state = useAnki(items)

  if (state.t !== 'ready') {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4">
        <Spinner size="lg" />
        <p className="text-default-500">Preparing deck...</p>
      </div>
    )
  }

  return <AnkiModalContentReady state={state} />
})

AnkiModalContent.displayName = 'AnkiModalContent'
