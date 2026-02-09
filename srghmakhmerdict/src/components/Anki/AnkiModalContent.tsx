import React, { useState } from 'react'
import { ModalHeader } from '@heroui/modal'
import { Button, ButtonGroup } from '@heroui/button'
import { Spinner } from '@heroui/spinner'
import type { DictionaryLanguage } from '../../types'
import type { KhmerWordsMap } from '../../db/dict'
import { useAnkiGame } from './useAnkiGame'
import { AnkiDeckView } from './AnkiDeckView'
import type { AnkiFlowMode } from './types'
import { AnkiPulseProvider } from './AnkiPulseContext'

export type ReviewDirection = 'EN_TO_KM' | 'RU_TO_KM' | 'KM_TO_ALL'

export const AnkiModalContent = React.memo(
  ({
    initialLanguage = 'km',
    initialMode = 'WORD_TO_DESC',
    km_map,
  }: {
    initialLanguage?: DictionaryLanguage
    initialMode?: AnkiFlowMode
    km_map: KhmerWordsMap
  }) => {
    const [language, setLanguage] = useState<DictionaryLanguage>(initialLanguage)
    const [mode, setMode] = useState<AnkiFlowMode>(initialMode)

    const state = useAnkiGame(language)

    return (
      <div className="flex flex-col h-full bg-content1">
        {/* Header Controls */}
        <ModalHeader className="flex flex-col gap-3 border-b border-divider px-4 py-3">
          <div className="flex justify-between items-center w-full">
            <span className="text-large font-bold">Review</span>
            <ButtonGroup size="sm" variant="flat">
              {(['km', 'en', 'ru'] as const).map(l => (
                <Button key={l} color={language === l ? 'primary' : 'default'} onPress={() => setLanguage(l)}>
                  {l.toUpperCase()}
                </Button>
              ))}
            </ButtonGroup>
          </div>
          <div className="flex justify-center w-full">
            <ButtonGroup size="sm" variant="light">
              <Button
                className={mode === 'WORD_TO_DESC' ? 'font-bold bg-default-200' : ''}
                onPress={() => setMode('WORD_TO_DESC')}
              >
                Desc
              </Button>
              <Button
                className={mode === 'DESC_TO_WORD' ? 'font-bold bg-default-200' : ''}
                onPress={() => setMode('DESC_TO_WORD')}
              >
                Word
              </Button>
            </ButtonGroup>
          </div>
        </ModalHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden relative">
          {state.t === 'loading' && (
            <div className="flex flex-col items-center justify-center h-full">
              <Spinner size="lg" />
            </div>
          )}

          {state.t === 'empty' && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <p className="text-xl font-bold">All done!</p>
              <p className="text-default-500">No {language.toUpperCase()} cards due.</p>
            </div>
          )}

          {state.t === 'review' && (
            <AnkiPulseProvider>
              <AnkiDeckView km_map={km_map} language={language} mode={mode} state={state} />
            </AnkiPulseProvider>
          )}
        </div>
      </div>
    )
  },
)
AnkiModalContent.displayName = 'AnkiModalContent'
