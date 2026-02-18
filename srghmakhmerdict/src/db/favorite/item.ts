import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../../types'

export interface FavoriteItem {
  readonly word: NonEmptyStringTrimmed
  readonly language: DictionaryLanguage
  readonly timestamp: number // Added date
  // FSRS Data
  readonly stability: number
  readonly difficulty: number
  readonly due: number
  readonly last_review: number | null
  // Stats (Commented out for future use)
  // readonly reps: number
  // readonly lapses: number
  // readonly state: number // 0=New, 1=Learning, 2=Review, 3=Relearning

  readonly additional_html_front: NonEmptyStringTrimmed | null
  readonly additional_html_back: NonEmptyStringTrimmed | null
}

/**
 * Pure constructor for a FavoriteItem.
 * Initializes FSRS values to defaults for a "New" card.
 */
export const FavoriteItem_mk = (
  word: NonEmptyStringTrimmed,
  language: DictionaryLanguage,
  timestamp: number,
  additional_html_front: NonEmptyStringTrimmed | undefined,
  additional_html_back: NonEmptyStringTrimmed | undefined,
): FavoriteItem => ({
  word,
  language,
  timestamp,
  stability: 0,
  difficulty: 0,
  due: timestamp, // Due immediately upon adding
  last_review: null,
  additional_html_front: additional_html_front ?? null,
  additional_html_back: additional_html_back ?? null,
})

export const FavoriteItem_wordLanguageEq = (
  word: NonEmptyStringTrimmed,
  language: DictionaryLanguage,
  item: FavoriteItem,
) => item.word === word && item.language === language

export const favoriteItemArray_containsWordLanguage = (
  allFavorites: readonly FavoriteItem[],
  word: NonEmptyStringTrimmed,
  word_language: DictionaryLanguage,
) => allFavorites.some(f => FavoriteItem_wordLanguageEq(word, word_language, f))

/**
 * Purely removes an item from the array.
 */
export function favoriteItemArray_remove(
  allFavorites: readonly FavoriteItem[],
  word: NonEmptyStringTrimmed,
  word_language: DictionaryLanguage,
): FavoriteItem[] {
  return allFavorites.filter(f => !FavoriteItem_wordLanguageEq(word, word_language, f))
}

/**
 * Purely adds a new item to the array (prepended).
 */
export function favoriteItemArray_add(
  allFavorites: readonly FavoriteItem[],
  word: NonEmptyStringTrimmed,
  word_language: DictionaryLanguage,
  nowTimestamp: () => number,
  additional_html_front: NonEmptyStringTrimmed | undefined,
  additional_html_back: NonEmptyStringTrimmed | undefined,
): FavoriteItem[] {
  return [
    FavoriteItem_mk(word, word_language, nowTimestamp(), additional_html_front, additional_html_back),
    ...allFavorites,
  ]
}
