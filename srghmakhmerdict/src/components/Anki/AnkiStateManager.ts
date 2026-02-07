import { FSRS, Rating, type Rating as RatingType, type Card as FSRSCard } from '@squeakyrobot/fsrs'

// --- Types & Interfaces ---
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import {
  NonEmptyRecord_toMap_getOrderFromSet,
  Record_toNonEmptyRecord_orThrow,
  Record_toNonEmptyRecord_unsafe,
  type NonEmptyRecord,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import type { NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import type { NonEmptyMap } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'
import {
  unknownToValidDateOrThrow,
  type ValidDate,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toValidDate'

const storageKey = 'khmer_anki_state_v1'

// --- Factory ---

const fsrs = new FSRS({
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzz: true,
})

// --- Persistence ---

export function localStorage_loadCards(): NonEmptyRecord<TypedContainsKhmer, FSRSCard> | undefined {
  const stored = localStorage.getItem(storageKey)

  return stored ? JSON.parse(stored) : undefined
}

export function localStorage_saveCardsRecord(cards: NonEmptyRecord<TypedContainsKhmer, FSRSCard>): void {
  localStorage.setItem(storageKey, JSON.stringify(cards))
}

export function localStorage_saveCardsMap(cards: NonEmptyMap<TypedContainsKhmer, FSRSCard>): void {
  localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(cards)))
}

export const localStorage_loadOrInitCards = (
  items: NonEmptySet<TypedContainsKhmer>,
): NonEmptyMap<TypedContainsKhmer, FSRSCard> => {
  const fromStorage = localStorage_loadCards()
  let nextCards: NonEmptyRecord<TypedContainsKhmer, FSRSCard>

  if (!fromStorage) {
    // First run ever
    nextCards = syncCards_createInitial(items)
    localStorage_saveCardsRecord(nextCards)
  } else {
    // Merge with storage to ensure new prop items have cards
    const maybeUpdated = syncCards_createEmptyCardIfMissing(items, fromStorage)

    if (maybeUpdated) {
      nextCards = maybeUpdated
      localStorage_saveCardsRecord(nextCards)
    } else {
      nextCards = fromStorage
    }
  }

  return NonEmptyRecord_toMap_getOrderFromSet(items, nextCards)
}

// --- Sync Logic ---

export function syncCards_createInitial(
  items: NonEmptySet<TypedContainsKhmer>,
): NonEmptyRecord<TypedContainsKhmer, FSRSCard> {
  const nextCards: Record<TypedContainsKhmer, FSRSCard> = {}

  for (const word of items) nextCards[word] = fsrs.createEmptyCard()

  return Record_toNonEmptyRecord_orThrow(nextCards)
}

/**
 * Ensures all items have a card. Returns undefined if no changes were needed.
 * Otherwise returns the merged record (existing + new empty cards).
 */
export function syncCards_createEmptyCardIfMissing(
  items: NonEmptySet<TypedContainsKhmer>,
  existingCards: NonEmptyRecord<TypedContainsKhmer, FSRSCard>,
): NonEmptyRecord<TypedContainsKhmer, FSRSCard> | undefined {
  let hasChanges = false
  const nextCards: Record<TypedContainsKhmer, FSRSCard> = { ...existingCards }

  for (const word of items) {
    if (!nextCards[word]) {
      nextCards[word] = fsrs.createEmptyCard()
      hasChanges = true
    }
  }

  if (!hasChanges) return undefined

  return Record_toNonEmptyRecord_orThrow(nextCards)
}

// --- Review Logic ---

export function findNextDue(cards: NonEmptyMap<TypedContainsKhmer, FSRSCard>): [TypedContainsKhmer, FSRSCard] {
  let bestKey!: TypedContainsKhmer
  let bestCard!: FSRSCard
  let bestTime = Infinity

  for (const key in cards) {
    const card: FSRSCard = cards.get(key as TypedContainsKhmer) as FSRSCard
    const time = card.due.getTime()

    if (time < bestTime) {
      bestKey = key as TypedContainsKhmer
      bestCard = card
      bestTime = time
    }
  }

  return [bestKey, bestCard]
}

/**
 * Pure function that calculates the card's new state and determines the next word to study.
 * Returns the updated record and the next word key.
 */
export function transition_reviewCard(
  cards: NonEmptyMap<TypedContainsKhmer, FSRSCard>,
  currentWord: TypedContainsKhmer,
  rating: Rating,
): {
  newCards: NonEmptyMap<TypedContainsKhmer, FSRSCard>
  nextWord: TypedContainsKhmer
} {
  const currentCard = assertIsDefinedAndReturn(cards.get(currentWord))

  // Calculate new card parameters (Immutable)
  const scheduling = fsrs.repeat(currentCard, new Date())
  const updatedCard = scheduling[rating].card

  // Create new Cards Record (Immutable)
  // const newCards = {
  //   ...cards,
  //   [currentWord]: updatedCard,
  // } as NonEmptyRecord<TypedContainsKhmer, FSRSCard>

  const newCards: Map<TypedContainsKhmer, FSRSCard> = new Map(cards)

  newCards.set(currentWord, updatedCard)

  // Determine next word based on the NEW state (e.g. if I rated 'Again', it might still be due)
  const [nextWord] = findNextDue(newCards as unknown as NonEmptyMap<any, any>)

  return {
    newCards: newCards as any,
    nextWord,
  }
}

export function getNextIntervals(card: FSRSCard): NonEmptyRecord<RatingType, ValidDate> {
  const scheduling = fsrs.repeat(card)

  const data: Record<RatingType, ValidDate> = {
    [Rating.Again]: unknownToValidDateOrThrow(scheduling[Rating.Again].card.due),
    [Rating.Hard]: unknownToValidDateOrThrow(scheduling[Rating.Hard].card.due),
    [Rating.Good]: unknownToValidDateOrThrow(scheduling[Rating.Good].card.due),
    [Rating.Easy]: unknownToValidDateOrThrow(scheduling[Rating.Easy].card.due),
  } as Record<RatingType, ValidDate>

  return Record_toNonEmptyRecord_unsafe(data)
}
