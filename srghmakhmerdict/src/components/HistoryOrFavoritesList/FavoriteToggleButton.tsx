import { memo, useCallback, type MouseEventHandler } from 'react'
import { Button } from '@heroui/button'
import { FaStar, FaRegStar } from 'react-icons/fa'
import { useFavorites } from '../../providers/FavoritesProvider'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../../types'
import { useIsFavorite } from '../../hooks/useIsFavorite'

const stopPropagation: MouseEventHandler =
  // | PressEventHandler
  e => e.stopPropagation()

export const FavoriteToggleButton = memo(
  ({ word, mode }: { word: NonEmptyStringTrimmed; mode: DictionaryLanguage }) => {
    const { toggleFavorite } = useFavorites()
    const isFav = useIsFavorite(word, mode)

    // We already moved toast logic to provider
    const toggleFav = useCallback(async () => {
      try {
        await toggleFavorite(word, mode)
      } catch (e) {
        // Toast is handled in provider
      }
    }, [toggleFavorite, word, mode])

    return (
      <Button
        isIconOnly
        aria-label="Toggle Favorite"
        radius="full"
        size="sm"
        variant="light"
        onClick={stopPropagation}
        // onPointerDown={stopPropagation}
        // onPointerUp={stopPropagation}
        onPress={toggleFav}
        // onPressStart={stopPropagation}
      >
        {isFav ? <FaStar className="text-warning text-lg" /> : <FaRegStar className="text-default-400 text-lg" />}
      </Button>
    )
  },
)

FavoriteToggleButton.displayName = 'FavoriteToggleButton'
