import { Grade } from 'femto-fsrs'
import { deck, getOneDayInMs } from '../../db/favorite_anki'
import {
  numberToNOfDays_orThrow_mk,
  type NOfDays,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/n-of-days'
import type { FavoriteItem } from '../../db/favorite/favorite-item'
import type { DictionaryLanguage } from '../../types'
import { descNumber, sortBy_mutating } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/sort'

export type NextIntervals = {
  [Grade.AGAIN]: NOfDays
  [Grade.HARD]: NOfDays
  [Grade.GOOD]: NOfDays
  [Grade.EASY]: NOfDays
}

/**
 * Calculates the hypothetical interval (in days) for each rating button.
 * Used for UI display (e.g., "Good: 4d").
 */
export function getPreviewIntervals(item: FavoriteItem): NextIntervals {
  const now = Date.now()
  const isNew = item.last_review === null

  const calculate = (grade: Grade): NOfDays => {
    if (isNew) {
      return numberToNOfDays_orThrow_mk(deck.newCard(grade).I)
    } else {
      const daysSinceReview = (now - item.last_review) / getOneDayInMs

      return numberToNOfDays_orThrow_mk(
        deck.gradeCard({ D: item.difficulty, S: item.stability }, daysSinceReview, grade).I,
      )
    }
  }

  return {
    [Grade.AGAIN]: calculate(Grade.AGAIN),
    [Grade.HARD]: calculate(Grade.HARD),
    [Grade.GOOD]: calculate(Grade.GOOD),
    [Grade.EASY]: calculate(Grade.EASY),
  }
}

/**
 * Filters the favorites map to find due cards for a specific language.
 * Sorts by 'due' date (overdue first).
 */
export function getDueCards(allFavorites: FavoriteItem[], language: DictionaryLanguage): FavoriteItem[] {
  if (allFavorites.length <= 0) return allFavorites

  return sortBy_mutating(
    allFavorites.filter(x => x.language === language),
    a => a.due,
    descNumber,
  )
}
