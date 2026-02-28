import { getOneDayInMs } from '../components/Anki/constants'
import type { FavoriteItem } from '../db/favorite/item'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

export type FavoriteStatus = 'none' | 'new' | 'learning' | 'review' | 'relearning'

export const getFavoriteStatus = (
  favorites: readonly FavoriteItem[] | undefined | null,
  word: NonEmptyStringTrimmed,
): FavoriteStatus => {
  if (!favorites) return 'none'
  const item = favorites.find(f => f.word === word)

  if (!item) return 'none'

  // 1. New Card: Never reviewed
  if (item.last_review === null) return 'new'

  const interval = item.due - item.last_review

  // 2. Learning/Relearning: Interval is less than a day (due to manual steps or FSRS scheduling)
  if (interval < getOneDayInMs) {
    // HEURISTIC: In FSRS, stability represents memory strength.
    // If stability has already grown significantly (> 1.2 days),
    // but the card is currently in a short interval, it's likely a lapse (Relearning).
    // Brand new cards typically have stability < 1.0 after the first few learning steps.
    if (item.stability >= 1.2) {
      return 'relearning'
    }

    return 'learning'
  }

  // 3. Review: Graduated to at least 1 day interval

  return 'review'
}
