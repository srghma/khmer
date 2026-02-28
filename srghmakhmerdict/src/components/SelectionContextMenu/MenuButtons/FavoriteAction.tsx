import { memo, useCallback, useMemo } from 'react'
import { HiStar, HiOutlineStar } from 'react-icons/hi2'
import { useFavorites } from '../../../providers/FavoritesProvider'
import { MenuButton } from '../MenuButton'
import type { WordLanguageTuple } from '../../../initDictionary'

interface FavoriteActionProps {
  dictWordInfo: WordLanguageTuple
}

export const FavoriteAction = memo<FavoriteActionProps>(({ dictWordInfo }) => {
  const { toggleFavorite, isFavorite } = useFavorites()

  const isFav = useMemo(
    () => (dictWordInfo ? isFavorite(dictWordInfo[0], dictWordInfo[1]) : false),
    [dictWordInfo, isFavorite],
  )
  const onClick = useCallback(() => {
    toggleFavorite(dictWordInfo[0], dictWordInfo[1])
  }, [dictWordInfo, toggleFavorite])

  return (
    <MenuButton
      icon={
        isFav ? <HiStar className="text-xl text-warning" /> : <HiOutlineStar className="text-xl text-default-500" />
      }
      onClick={onClick}
    >
      {isFav ? 'Remove from favorites' : 'Add to favorites'}
    </MenuButton>
  )
})

FavoriteAction.displayName = 'FavoriteAction'
