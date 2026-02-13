import { createDeck, Grade } from 'femto-fsrs'
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
import {
  INTERVAL_MS_AGAIN,
  INTERVAL_MS_HARD,
  INTERVAL_MS_GOOD_NEW,
  getOneDayInMs,
} from './constants'
// import { formatDistance } from 'date-fns/formatDistance'

// Initialize the FSRS algorithm
export const deck = createDeck()

export function FavoriteItem_isDueToday(item: FavoriteItem, now_milliseconds: number): boolean {
  return item.due <= now_milliseconds
}

/**
 * CORE LOGIC: Determines the next interval (in ms) and the next FSRS state.
 * This is the source of truth for both UI and DB.
 */
export function calculateNextStep(
  item: Pick<FavoriteItem, 'stability' | 'difficulty' | 'last_review'>,
  grade: Grade,
  now: number,
) {
  const isNew = item.last_review === null

  // 1. Calculate FSRS parameters (D, S)
  let nextCard
  if (isNew) {
    nextCard = deck.newCard(grade)
  } else {
    const daysSinceReview = (now - item.last_review) / getOneDayInMs
    nextCard = deck.gradeCard({ D: item.difficulty, S: item.stability }, daysSinceReview, grade)
  }

  // 2. Determine the Interval (Duration until next review)
  let intervalMs: number

  // --- MANUAL OVERRIDES (Simulating Learning Steps) ---
  if (grade === Grade.AGAIN) {
    intervalMs = INTERVAL_MS_AGAIN
  } else if (grade === Grade.HARD) {
    intervalMs = INTERVAL_MS_HARD
  } else if (isNew && grade === Grade.GOOD) {
    // FIX: This was the missing logic in the DB updater
    intervalMs = INTERVAL_MS_GOOD_NEW
  } else {
    // Standard FSRS behavior (Days * MS)
    intervalMs = nextCard.I * getOneDayInMs
  }

  return {
    nextCard,
    intervalMs,
  }
}

/**
 * Calculates the hypothetical interval (in days) for each rating button.
 * Used for UI display (e.g., "Good: 4d").
 */
export function getPreviewIntervals(item: FavoriteItem, now: number): NonEmptyRecord<Grade, NOfDays> {
  const calculate = (grade: Grade): NOfDays => {
    const { intervalMs } = calculateNextStep(item, grade, now)
    // Convert back to "Days" float for the NOfDays type
    return numberToNOfDays_orThrow_mk(intervalMs / getOneDayInMs)
  }

  return {
    [Grade.AGAIN]: calculate(Grade.AGAIN),
    [Grade.HARD]: calculate(Grade.HARD),
    [Grade.GOOD]: calculate(Grade.GOOD),
    [Grade.EASY]: calculate(Grade.EASY),
  } as NonEmptyRecord<Grade, NOfDays>
}

export type ButtonData = {
  intervalDays: NOfDays
  label: string
}

export type FourButtons = NonEmptyRecord<Grade, ButtonData>

/**
 * Format interval like KoalaCards: "Very Soon", "X minutes", "X hours", "X days", "X months"
 */
function KoalaCards_formatInterval(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / (60 * 1000))

  if (minutes < 5) {
    return 'Very Soon'
  }

  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? '' : 's'}`
  }

  if (minutes < 24 * 60) {
    const hours = Math.floor(minutes / 60)

    return `${hours} hr${hours === 1 ? '' : 's'}`
  }

  if (minutes < 30 * 24 * 60) {
    const days = Math.floor(minutes / (24 * 60))

    return `${days} day${days === 1 ? '' : 's'}`
  }

  const months = Math.floor(minutes / (30 * 24 * 60))

  return `${months} mo${months === 1 ? '' : 's'}`
}

export function mkFourButtons<T>(item: T, now: number, getCard: (item: T) => FavoriteItem): FourButtons {
  const intervals = getPreviewIntervals(getCard(item), now)

  const map = (grade: Grade): ButtonData => {
    const days = intervals[grade]

    return {
      intervalDays: days,
      // label: formatDistance(now + days * getOneDayInMs, now, { addSuffix: true }),
      label: KoalaCards_formatInterval(days * getOneDayInMs),
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

/**
 * Pure function: Calculates the next state of a card based on the grade and current time.
 * This determines the "optimistic" data without touching the database.
 */
export const reviewCard_calculateReviewUpdates = (
  item: Pick<FavoriteItem, 'stability' | 'difficulty' | 'last_review'>,
  grade: Grade,
  now: number,
): Pick<FavoriteItem, 'stability' | 'difficulty' | 'last_review' | 'due'> => {
  // Use the shared logic
  const { nextCard, intervalMs } = calculateNextStep(item, grade, now)

  return {
    stability: nextCard.S,
    difficulty: nextCard.D,
    last_review: now,
    due: now + intervalMs, // Ensure we add to 'now'
  }
}
