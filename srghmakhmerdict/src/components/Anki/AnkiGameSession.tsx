import React from 'react'
import { Spinner } from '@heroui/spinner'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { FavoriteItem } from '../../db/favorite/item'
import type { DictionaryLanguage } from '../../types'
import { useAnkiGameManager } from './useAnkiGameManager'
import type { AnkiDirection } from './types'
import { AnkiGameSession_Content } from './AnkiGameSession_Content'
import type { LanguageToShortDefinitionSum } from '../../db/dict/types'

export interface AnkiGameSessionProps<T> {
  language: DictionaryLanguage
  direction: AnkiDirection
  items: NonEmptyArray<T>
  getCard: (item: T) => FavoriteItem
  getDescription: ((item: T) => LanguageToShortDefinitionSum) | undefined
  setItemCard: (item: T, newCard: FavoriteItem) => T
  renderFront: (item: T) => React.ReactNode
  renderBack: (item: T) => React.ReactNode
}

const loading = (
  <div className="flex h-full items-center justify-center">
    <Spinner size="lg" />
  </div>
)

export function AnkiGameSession<T>({
  language,
  // km_map,
  direction,
  items,
  getCard,
  getDescription,
  setItemCard,
  renderFront,
  renderBack,
}: AnkiGameSessionProps<T>) {
  const gameState = useAnkiGameManager(items, getCard, setItemCard)

  if (gameState.t === 'loading') return loading

  return (
    <AnkiGameSession_Content
      direction={direction}
      gameState={gameState}
      getCard={getCard}
      getDescription={getDescription}
      items={items}
      language={language}
      renderBack={renderBack}
      renderFront={renderFront}
    />
  )
}
