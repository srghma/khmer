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
// import { formatDistance } from 'date-fns/formatDistance'

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

  const graded = deck.gradeCard({ D: item_difficulty, S: item_stability }, daysSinceReview, grade)

  return numberToNOfDays_orThrow_mk(graded.I)
}

// 1 minute in days
const AGAIN_INTERVAL_DAYS = 1 / (24 * 60)
// 3 minutes in days
const HARD_INTERVAL_DAYS = 3 / (24 * 60)
// 10 minutes in days
const GOOD_INTERVAL_DAYS = 10 / (24 * 60)

/**
 * Calculates the hypothetical interval (in days) for each rating button.
 * Used for UI display (e.g., "Good: 4d").
 */
export function getPreviewIntervals(item: FavoriteItem, now_milliseconds: number): NonEmptyRecord<Grade, NOfDays> {
  const isNew = item.last_review === null

  const calculate = (grade: Grade): NOfDays => {
    // Traditional Anki: Has a "learning mode" where failed cards (Again) are reshown in minutes (1m, 10m, etc.) during the same session
    if (grade === Grade.AGAIN) return numberToNOfDays_orThrow_mk(AGAIN_INTERVAL_DAYS)
    if (grade === Grade.HARD) return numberToNOfDays_orThrow_mk(HARD_INTERVAL_DAYS)

    if (isNew) {
      // by logic of anki, if card is being reviewed first time (I see it and click on 1 of 4 buttons first time) AND I click on GOOD then I should see it today 1 more time
      if (grade === Grade.GOOD) return numberToNOfDays_orThrow_mk(GOOD_INTERVAL_DAYS)

      return calculate_isNew(grade)
    }

    return calculate_isNotNew(grade, item.last_review, item.difficulty, item.stability, now_milliseconds)
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

export const getOneDayInMs = 24 * 60 * 60 * 1000

// Initialize the FSRS algorithm
export const deck = createDeck()

/**
 * Pure function: Calculates the next state of a card based on the grade and current time.
 * This determines the "optimistic" data without touching the database.
 */
export const reviewCard_calculateReviewUpdates = (
  item: Pick<FavoriteItem, 'stability' | 'difficulty' | 'last_review'>,
  grade: Grade,
  now: number,
): Pick<FavoriteItem, 'stability' | 'difficulty' | 'last_review' | 'due'> => {
  const isNew = item.last_review === null

  // Calculate next FSRS parameters
  const nextCard = (() => {
    if (isNew) {
      // Branch A: New Card
      return deck.newCard(grade)
    } else {
      // Branch B: Existing Card
      const daysSinceReview = (now - item.last_review) / getOneDayInMs

      return deck.gradeCard({ D: item.difficulty, S: item.stability }, daysSinceReview, grade)
    }
  })()

  // Calculate next due date
  // For Again (1) and Hard (2), we want short learning steps (1 min, 3 min)
  // regardless of FSRS calc for now.
  let nextDue: number

  if (grade === Grade.AGAIN) {
    nextDue = now + 1 * 60 * 1000 // 1 minute
  } else if (grade === Grade.HARD) {
    nextDue = now + 3 * 60 * 1000 // 3 minutes
  } else {
    nextDue = now + nextCard.I * getOneDayInMs
  }

  return {
    stability: nextCard.S,
    difficulty: nextCard.D,
    last_review: now,
    due: nextDue,
  }
}
