import React from 'react'
import { useDictionary } from '../../providers/DictionaryProvider'
import { useAnkiSettings } from './useAnkiSettings'
import { useAnkiGame } from './useAnkiGame'
import { AnkiDeckView } from './AnkiDeckView'
import { Spinner } from '@heroui/spinner'
import { AnkiHeader } from './AnkiHeader'
import { AnkiList } from './AnkiList'
import type { AnkiDirection } from './types'

// Re-implementing the structure to match the Sidebar/View layout as requested earlier,
// or keeping it simple inside the ModalContent depending on how "App-like" it should be.
// Since you asked for "componenets for anki... 2 parts list on left... details on right",
// I will implement a responsive split view here.

export const AnkiModalContent = React.memo(() => {
  const { km_map } = useDictionary()

  const {
    language,
    setLanguage,
    direction_en,
    setDirection_en,
    direction_ru,
    setDirection_ru,
    direction_km,
    setDirection_km,
  } = useAnkiSettings()

  // Helper getters/setters for current direction based on language
  const currentDirection = language === 'en' ? direction_en : language === 'ru' ? direction_ru : direction_km

  const setDirection = (d: AnkiDirection) => {
    if (language === 'en') setDirection_en(d)
    else if (language === 'ru') setDirection_ru(d)
    else setDirection_km(d)
  }

  // Hook handles the queue logic
  const state = useAnkiGame(language)

  // Layout Logic
  // Mobile: If Reviewing, hide list. If Done/Loading, show list placeholder?
  // Actually Anki usually is mode-based.
  // Let's implement the Split View.

  const renderContent = () => {
    if (state.t === 'loading') {
      return (
        <div className="h-full flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      )
    }
    if (state.t === 'empty') {
      return (
        <div className="h-full flex flex-col items-center justify-center text-default-400 p-8 text-center bg-content1">
          <p className="text-xl font-bold mb-2">🎉 All Caught Up!</p>
          <p>No more {language.toUpperCase()} cards due right now.</p>
        </div>
      )
    }

    return <AnkiDeckView direction={currentDirection} km_map={km_map} language={language} state={state} />
  }

  return (
    <div className="flex h-full w-full bg-background">
      {/* Sidebar / List View */}
      <div className="flex flex-col w-full md:w-[350px] border-r border-divider bg-background shrink-0">
        <AnkiHeader
          activeDict={language}
          count={state.t === 'review' ? state.remainingCount : 0}
          direction={currentDirection}
          onDictChange={setLanguage}
          onDirectionChange={setDirection}
        />

        {/* List of Due Cards */}
        {/* We always show the list if we have data, logic handled below */}
        <div className="flex-1 overflow-y-auto bg-content1 border-t border-divider">
          {state.t === 'review' ? (
            <AnkiList
              items={state.queue}
              selectedWord={state.currentCard.word}
              onSelect={() => { }} // No-op for now as we enforce queue order
              mode={currentDirection}
            />
          ) : (
            <div className="p-4 text-center text-default-400 text-sm">
              {state.t === 'loading' ? 'Loading...' : 'No cards due'}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel / Reviewer */}
      <div className="flex-1 relative bg-background">{renderContent()}</div>
    </div>
  )
})

AnkiModalContent.displayName = 'AnkiModalContent'
