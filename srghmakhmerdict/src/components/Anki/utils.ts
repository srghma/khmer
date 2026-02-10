import { Grade } from 'femto-fsrs'
import { deck, getOneDayInMs } from '../../db/favorite/anki'
import {
  numberToNOfDays_orThrow_mk,
  type NOfDays,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/n-of-days'
import type { FavoriteItem } from '../../db/favorite/item'
import type { DictionaryLanguage } from '../../types'
import { descNumber, sortBy_mutating } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/sort'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import {
  Array_toNonEmptyArray_orThrow,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import {
  Set_toNonEmptySet_orThrow,
  type NonEmptySet,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'

/**
 * Calculates the hypothetical interval (in days) for each rating button.
 * Used for UI display (e.g., "Good: 4d").
 */
export function getPreviewIntervals(item: FavoriteItem): Record<Grade, NOfDays> {
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
export function allFavorites_filterByLanguageAndSortByDue(allFavorites: readonly FavoriteItem[], language: DictionaryLanguage): readonly FavoriteItem[] {
  if (allFavorites.length <= 0) return allFavorites

  return sortBy_mutating(
    allFavorites.filter(x => x.language === language),
    a => a.due,
    descNumber,
  )
}

/**
 * Zips the due queue with their corresponding descriptions.
 * Throws if a description is missing for any card in the queue.
 */
export function zipQueueWithDescriptions<T>(
  queue: NonEmptyArray<FavoriteItem>,
  descriptions: NonEmptyRecord<string, T>,
): NonEmptyArray<{ card: FavoriteItem; description: T }> {
  return Array_toNonEmptyArray_orThrow(
    queue.map(card => {
      const description = descriptions[card.word]

      return {
        card,
        description: assertIsDefinedAndReturn(
          description,
          () => `Description for ${card.word} not found in zipQueueWithDescriptions`,
        ),
      }
    }),
  )
}

/**
 * Finds words in the queue that are missing from the descriptions record.
 */
export function getWords(
  queue: NonEmptyArray<FavoriteItem>,
): NonEmptySet<NonEmptyStringTrimmed> {
  const wordsToFetch = new Set<NonEmptyStringTrimmed>()

  for (const item of queue) {
    wordsToFetch.add(item.word)
  }

  return Set_toNonEmptySet_orThrow(wordsToFetch)
}
