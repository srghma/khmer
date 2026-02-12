import { Grade } from 'femto-fsrs'
import { deck, getOneDayInMs } from '../../db/favorite/anki'
import {
  numberToNOfDays_orThrow_mk,
  type NOfDays,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/n-of-days'
import type { FavoriteItem } from '../../db/favorite/item'
import { DICTIONARY_LANGUAGES, type DictionaryLanguage } from '../../types'
import { ascNumber } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/sort'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import {
  Array_groupByKeys_toNonEmptyArrays,
  Array_toNonEmptyArray_orThrow,
  Array_toNonEmptyArray_orUndefined,
  NonEmptyArray_collectToSet,
  NonEmptyArray_sortBy_immutable,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { type NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import {
  Record_toNonEmptyRecord_unsafe,
  type NonEmptyRecord,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { formatDistance } from 'date-fns/formatDistance'

export function FavoriteItem_isDueToday(item: FavoriteItem, now_milliseconds: number): boolean {
  return item.due <= now_milliseconds
}

/**
 * Calculates the hypothetical interval (in days) for each rating button.
 * Used for UI display (e.g., "Good: 4d").
 */
function calculate_isNew(grade: Grade): NOfDays {
  return numberToNOfDays_orThrow_mk(deck.newCard(grade).I)
}

/**
 * Logic for cards with an existing review history.
 */
function calculate_isNotNew(
  grade: Grade,
  item_last_review: number,
  item_difficulty: number,
  item_stability: number,
  now_milliseconds: number,
): NOfDays {
  const daysSinceReview = (now_milliseconds - item_last_review) / getOneDayInMs

  return numberToNOfDays_orThrow_mk(deck.gradeCard({ D: item_difficulty, S: item_stability }, daysSinceReview, grade).I)
}

/**
 * Calculates the hypothetical interval (in days) for each rating button.
 * Used for UI display (e.g., "Good: 4d").
 */
export function getPreviewIntervals(item: FavoriteItem, now_milliseconds: number): NonEmptyRecord<Grade, NOfDays> {
  const isNew = item.last_review === null

  const calculate = (grade: Grade): NOfDays => {
    return isNew
      ? calculate_isNew(grade)
      : calculate_isNotNew(grade, item.last_review, item.difficulty, item.stability, now_milliseconds)
  }

  const output: Record<Grade, NOfDays> = {
    [Grade.AGAIN]: calculate(Grade.AGAIN),
    [Grade.HARD]: calculate(Grade.HARD),
    [Grade.GOOD]: calculate(Grade.GOOD),
    [Grade.EASY]: calculate(Grade.EASY),
  }

  return output as NonEmptyRecord<Grade, NOfDays>
}

export type ButtonData = {
  intervalDays: NOfDays
  label: string
}

export type FourButtons = NonEmptyRecord<Grade, ButtonData>

export function mkFourButtons<T>(item: T, now: number, getCard: (item: T) => FavoriteItem): FourButtons {
  const intervals = getPreviewIntervals(getCard(item), now)

  const map = (grade: Grade): ButtonData => {
    const days = intervals[grade]
    const targetTimestamp = now + days * getOneDayInMs

    return {
      intervalDays: days,
      label: formatDistance(targetTimestamp, now, { addSuffix: true }),
    }
  }

  return {
    [Grade.AGAIN]: map(Grade.AGAIN),
    [Grade.HARD]: map(Grade.HARD),
    [Grade.GOOD]: map(Grade.GOOD),
    [Grade.EASY]: map(Grade.EASY),
  } as FourButtons
}

/**
 * Filters the favorites map to find due cards for a specific language.
 * Sorts by 'due' date (overdue first).
 */
export function allFavorites_filterByLanguage(
  allFavorites: NonEmptyArray<FavoriteItem>,
  language: DictionaryLanguage,
): NonEmptyArray<FavoriteItem> | undefined {
  return Array_toNonEmptyArray_orUndefined(allFavorites.filter(x => x.language === language))
}

export function allFavorites_split_sorted(
  allFavorites: NonEmptyArray<FavoriteItem>,
): NonEmptyRecord<DictionaryLanguage, NonEmptyArray<FavoriteItem> | undefined> {
  // 1. Group by language
  const grouped = Array_groupByKeys_toNonEmptyArrays(allFavorites, DICTIONARY_LANGUAGES, item => item.language)

  // 2. Sort each group by due date
  for (const lang of DICTIONARY_LANGUAGES) {
    const group = grouped[lang]

    if (group) grouped[lang] = hasFavorites_sortByDue_todayIsTop(group, x => x)
  }

  return Record_toNonEmptyRecord_unsafe(grouped)
}

export function hasFavorites_sortByDue_todayIsTop<T>(
  items: NonEmptyArray<T>,
  getCard: (item: T) => FavoriteItem,
): NonEmptyArray<T> {
  return NonEmptyArray_sortBy_immutable(items, a => getCard(a).due, ascNumber)
}

/**
 * Zips the due queue with their corresponding descriptions.
 * Throws if a description is missing for any card in the queue.
 */
export function zipQueueWithDescriptions<T>(
  queue: NonEmptyArray<FavoriteItem>,
  descriptions: NonEmptyRecord<NonEmptyStringTrimmed, T>,
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
export function getWords(queue: NonEmptyArray<FavoriteItem>): NonEmptySet<NonEmptyStringTrimmed> {
  return NonEmptyArray_collectToSet(queue, x => x.word)
}
