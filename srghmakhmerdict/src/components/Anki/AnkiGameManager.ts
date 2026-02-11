import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import type { FavoriteItem } from '../../db/favorite/item'
import { FavoriteItem_isDueToday, hasFavorites_sortByDue_todayIsTop, mkFourButtons, type FourButtons } from './utils'
import {
  Array_toNonEmptyArray_orThrow,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { ValidNonNegativeInt } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toNumber'

// --- Pure State Data Types ---

export type AnkiGameState_NoMore_Nothing<T> = {
  t: 'no_more_due_cards_today__nothing_selected'
  allFavorites_filteredByLanguageAndSortedByDue: NonEmptyArray<T>
}

export type AnkiGameState_NoMore_Selected_Front<T> = {
  t: 'no_more_due_cards_today__selected__front'
  allFavorites_filteredByLanguageAndSortedByDue: NonEmptyArray<T>
  allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex: ValidNonNegativeInt
  currentItem: T
  fourButtons: FourButtons
}

export type AnkiGameState_NoMore_Selected_Back<T> = {
  t: 'no_more_due_cards_today__selected__back'
  allFavorites_filteredByLanguageAndSortedByDue: NonEmptyArray<T>
  allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex: ValidNonNegativeInt
  currentItem: T
  fourButtons: FourButtons
}

export type AnkiGameState_Have_Selected_Front<T> = {
  t: 'have_due_cards_today__selected__front'
  allFavorites_filteredByLanguageAndSortedByDue: NonEmptyArray<T>
  nOfCardsDueToday: ValidNonNegativeInt
  allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex: ValidNonNegativeInt
  currentItem: T
  fourButtons: FourButtons
}

export type AnkiGameState_Have_Selected_Back<T> = {
  t: 'have_due_cards_today__selected__back'
  allFavorites_filteredByLanguageAndSortedByDue: NonEmptyArray<T>
  nOfCardsDueToday: ValidNonNegativeInt
  allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex: ValidNonNegativeInt
  currentItem: T
  fourButtons: FourButtons
}

export type AnkiGameState<T> =
  | AnkiGameState_NoMore_Nothing<T>
  | AnkiGameState_NoMore_Selected_Front<T>
  | AnkiGameState_NoMore_Selected_Back<T>
  | AnkiGameState_Have_Selected_Front<T>
  | AnkiGameState_Have_Selected_Back<T>

// --- Helper Functions ---

/**
 * Counts items that are due <= now.
 * Assumes items are sorted ASC by due date (Past -> Future).
 * "Due Today" items are at the start of the array.
 */
function getDueTodayCount<T>(
  items: NonEmptyArray<T>,
  now: number,
  getCard: (item: T) => FavoriteItem,
): ValidNonNegativeInt {
  // Find the first item that is NOT due (due > now).
  // Everything before it is due.
  const firstFutureIndex = items.findIndex(item => !FavoriteItem_isDueToday(getCard(item), now))

  if (firstFutureIndex === -1) {
    // All items are due
    return items.length as ValidNonNegativeInt
  }

  // The index itself represents the count of items before it (0-indexed)
  return firstFutureIndex as ValidNonNegativeInt
}

function validateIndex<T>(items: NonEmptyArray<T>, index: number): ValidNonNegativeInt {
  if (index < 0 || index >= items.length) throw new Error(`Invalid index ${index} for items length ${items.length}`)

  return index as ValidNonNegativeInt
}

// --- Transitions ---

export function init<T>(rawItems: NonEmptyArray<T>, now: number, getCard: (item: T) => FavoriteItem): AnkiGameState<T> {
  const sorted = hasFavorites_sortByDue_todayIsTop(rawItems, getCard)
  const nOfCardsDueToday = getDueTodayCount(sorted, now, getCard)

  if (nOfCardsDueToday > 0) {
    // Auto-select first due card (index 0 because sorted asc)
    const index = 0 as ValidNonNegativeInt
    const currentItem = assertIsDefinedAndReturn(sorted[index])

    return {
      t: 'have_due_cards_today__selected__front',
      allFavorites_filteredByLanguageAndSortedByDue: sorted,
      nOfCardsDueToday,
      allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex: index,
      currentItem,
      fourButtons: mkFourButtons(currentItem, now, getCard),
    }
  } else {
    // No due cards, auto-select first future card if exists? Or nothing selected?
    // "nothing_selected" is a valid state.
    // However, if the user wants to review cards ahead of time, they select manually.
    return {
      t: 'no_more_due_cards_today__nothing_selected',
      allFavorites_filteredByLanguageAndSortedByDue: sorted,
    }
  }
}

// 1. NoMore_Nothing -> selectCard
export function no_more_due_cards_today__nothing_selected__selectCard<T>(
  state: AnkiGameState_NoMore_Nothing<T>,
  index: number,
  now: number,
  getCard: (item: T) => FavoriteItem,
): AnkiGameState_NoMore_Selected_Front<T> {
  const validIndex = validateIndex(state.allFavorites_filteredByLanguageAndSortedByDue, index)
  const currentItem = assertIsDefinedAndReturn(state.allFavorites_filteredByLanguageAndSortedByDue[validIndex])

  return {
    t: 'no_more_due_cards_today__selected__front',
    allFavorites_filteredByLanguageAndSortedByDue: state.allFavorites_filteredByLanguageAndSortedByDue,
    allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex: validIndex,
    currentItem,
    fourButtons: mkFourButtons(currentItem, now, getCard),
  }
}

// 2. NoMore_Selected_Front -> reveal
export function no_more_due_cards_today__selected__front__reveal<T>(
  state: AnkiGameState_NoMore_Selected_Front<T>,
): AnkiGameState_NoMore_Selected_Back<T> {
  return {
    t: 'no_more_due_cards_today__selected__back',
    allFavorites_filteredByLanguageAndSortedByDue: state.allFavorites_filteredByLanguageAndSortedByDue,
    allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex:
      state.allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex,
    currentItem: state.currentItem,
    fourButtons: state.fourButtons,
  }
}

// 2. NoMore_Selected_Front -> selectOtherCard
export function no_more_due_cards_today__selected__front__selectOtherCard<T>(
  state: AnkiGameState_NoMore_Selected_Front<T>,
  index: number,
  now: number,
  getCard: (item: T) => FavoriteItem,
): AnkiGameState_NoMore_Selected_Front<T> {
  const validIndex = validateIndex(state.allFavorites_filteredByLanguageAndSortedByDue, index)
  const currentItem = assertIsDefinedAndReturn(state.allFavorites_filteredByLanguageAndSortedByDue[validIndex])

  return {
    ...state,
    allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex: validIndex,
    currentItem,
    fourButtons: mkFourButtons(currentItem, now, getCard),
  }
}

// 2. NoMore_Selected_Front -> tick
export function no_more_due_cards_today__selected__front__tick<T>(
  state: AnkiGameState_NoMore_Selected_Front<T>,
  now: number,
  getCard: (item: T) => FavoriteItem,
): AnkiGameState_NoMore_Selected_Front<T> {
  return {
    ...state,
    fourButtons: mkFourButtons(state.currentItem, now, getCard),
  }
}

// 3. NoMore_Selected_Back -> selectOtherCard
export function no_more_due_cards_today__selected__back__selectOtherCard<T>(
  state: AnkiGameState_NoMore_Selected_Back<T>,
  index: number,
  now: number,
  getCard: (item: T) => FavoriteItem,
): AnkiGameState_NoMore_Selected_Front<T> {
  const validIndex = validateIndex(state.allFavorites_filteredByLanguageAndSortedByDue, index)
  const currentItem = assertIsDefinedAndReturn(state.allFavorites_filteredByLanguageAndSortedByDue[validIndex])

  return {
    t: 'no_more_due_cards_today__selected__front',
    allFavorites_filteredByLanguageAndSortedByDue: state.allFavorites_filteredByLanguageAndSortedByDue,
    allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex: validIndex,
    currentItem,
    fourButtons: mkFourButtons(currentItem, now, getCard),
  }
}

// 3. NoMore_Selected_Back -> rate (Pure Transition)
export function no_more_due_cards_today__selected__back__rate<T>(
  state: AnkiGameState_NoMore_Selected_Back<T>,
  newCard: FavoriteItem,
  setItemCard: (item: T, newCard: FavoriteItem) => T,
  now: number,
  getCard: (item: T) => FavoriteItem,
): AnkiGameState<T> {
  // Update the current item with the new card data
  const updatedItem = setItemCard(state.currentItem, newCard)

  // Replace in list and re-sort
  // Note: Since we are in "No More Due", this item was likely reviewed early.
  // It will likely be pushed further into the future.
  const currentIndex = state.allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex
  const newItems: Array<T> = [...state.allFavorites_filteredByLanguageAndSortedByDue]

  newItems[currentIndex] = updatedItem

  // Re-init to handle sorting and next selection logic
  return init(Array_toNonEmptyArray_orThrow(newItems), now, getCard)
}

// 4. Have_Selected_Front -> reveal
export function have_due_cards_today__selected__front__reveal<T>(
  state: AnkiGameState_Have_Selected_Front<T>,
): AnkiGameState_Have_Selected_Back<T> {
  return {
    t: 'have_due_cards_today__selected__back',
    allFavorites_filteredByLanguageAndSortedByDue: state.allFavorites_filteredByLanguageAndSortedByDue,
    nOfCardsDueToday: state.nOfCardsDueToday,
    allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex:
      state.allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex,
    currentItem: state.currentItem,
    fourButtons: state.fourButtons,
  }
}

// 4. Have_Selected_Front -> selectOtherCard
export function have_due_cards_today__selected__front__selectOtherCard<T>(
  state: AnkiGameState_Have_Selected_Front<T>,
  index: number,
  now: number,
  getCard: (item: T) => FavoriteItem,
): AnkiGameState_Have_Selected_Front<T> {
  const validIndex = validateIndex(state.allFavorites_filteredByLanguageAndSortedByDue, index)
  const currentItem = assertIsDefinedAndReturn(state.allFavorites_filteredByLanguageAndSortedByDue[validIndex])

  return {
    ...state,
    allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex: validIndex,
    currentItem,
    fourButtons: mkFourButtons(currentItem, now, getCard),
  }
}

// 4. Have_Selected_Front -> tick
export function have_due_cards_today__selected__front__tick<T>(
  state: AnkiGameState_Have_Selected_Front<T>,
  now: number,
  getCard: (item: T) => FavoriteItem,
): AnkiGameState_Have_Selected_Front<T> {
  return {
    ...state,
    fourButtons: mkFourButtons(state.currentItem, now, getCard),
  }
}

// 5. Have_Selected_Back -> selectOtherCard
export function have_due_cards_today__selected__back__selectOtherCard<T>(
  state: AnkiGameState_Have_Selected_Back<T>,
  index: number,
  now: number,
  getCard: (item: T) => FavoriteItem,
): AnkiGameState_Have_Selected_Front<T> {
  const validIndex = validateIndex(state.allFavorites_filteredByLanguageAndSortedByDue, index)
  const currentItem = assertIsDefinedAndReturn(state.allFavorites_filteredByLanguageAndSortedByDue[validIndex])

  return {
    t: 'have_due_cards_today__selected__front',
    allFavorites_filteredByLanguageAndSortedByDue: state.allFavorites_filteredByLanguageAndSortedByDue,
    nOfCardsDueToday: state.nOfCardsDueToday,
    allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex: validIndex,
    currentItem,
    fourButtons: mkFourButtons(currentItem, now, getCard),
  }
}

// 5. Have_Selected_Back -> rate (Pure Transition)
export function have_due_cards_today__selected__back__rate<T>(
  state: AnkiGameState_Have_Selected_Back<T>,
  newCard: FavoriteItem,
  setItemCard: (item: T, newCard: FavoriteItem) => T,
  now: number,
  getCard: (item: T) => FavoriteItem,
): AnkiGameState<T> {
  // Update item
  const updatedItem = setItemCard(state.currentItem, newCard)

  // Replace in list
  const currentIndex = state.allFavorites_filteredByLanguageAndSortedByDue_selectedCardIndex
  const newItems = [...state.allFavorites_filteredByLanguageAndSortedByDue]

  newItems[currentIndex] = updatedItem

  // Re-init handles sorting and picking the next due card (which should be different now that this one is future due)
  return init(Array_toNonEmptyArray_orThrow(newItems), now, getCard)
}
