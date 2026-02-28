import { Grade } from 'femto-fsrs'
import { memo, useCallback, useMemo, useState } from 'react'

import { useFavorites } from '../../../providers/FavoritesProvider'
import type { WordLanguageTuple } from '../../../initDictionary'
import { AnkiRatingButtons } from '../../Anki/AnkiButtons'
import { mkFourButtons } from '../../Anki/utils'

interface AnkiRatingActionProps {
  dictWordInfo: WordLanguageTuple
}

export const AnkiRatingAction = memo<AnkiRatingActionProps>(({ dictWordInfo }) => {
  const { favoritesMap, reviewCard } = useFavorites()
  const [word, language] = dictWordInfo

  const [now] = useState(() => Date.now())

  const favoriteItem = useMemo(() => {
    const item = favoritesMap.get(word)

    if (item?.language === language) {
      return item
    }

    return undefined
  }, [favoritesMap, word, language])

  const onRate = useCallback(
    (grade: Grade) => {
      reviewCard(word, language, grade)
    },
    [reviewCard, word, language],
  )

  const buttons = useMemo(() => {
    if (!favoriteItem) return undefined

    return mkFourButtons(favoriteItem, now, x => x)
  }, [favoriteItem, now])

  if (!favoriteItem || !buttons) return null

  return (
    <div className="p-1 border-t border-default-100 flex flex-col items-center">
      <AnkiRatingButtons buttons={buttons} size="sm" onRate={onRate} />
    </div>
  )
})

AnkiRatingAction.displayName = 'AnkiRatingAction'
