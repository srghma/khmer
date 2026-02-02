import { FSRS, Rating, type Card as FSRSCard } from '@squeakyrobot/fsrs'

// --- Types & Interfaces ---
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import {
  Record_toNonEmptyRecord_orThrow,
  type NonEmptyRecord,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'

export interface SyncResult {
  cards: NonEmptyRecord<TypedContainsKhmer, FSRSCard>
  hasChanges: boolean
}

const storageKey = 'khmer_anki_state_v1'

export class AnkiStateManager {
  private fsrs: FSRS

  constructor() {
    // Initialize FSRS with default v4.5 parameters
    this.fsrs = new FSRS({
      request_retention: 0.9,
      maximum_interval: 36500,
      enable_fuzz: true,
    })
  }

  public loadCards(): Record<TypedContainsKhmer, FSRSCard> {
    try {
      const stored = localStorage.getItem(storageKey)

      return stored ? JSON.parse(stored) : {}
    } catch (e) {
      console.error('Failed to load Anki state', e)

      return {}
    }
  }

  public saveCards(cards: NonEmptyRecord<TypedContainsKhmer, FSRSCard>): void {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cards))
    } catch (e) {
      console.error('Failed to save Anki state', e)
    }
  }

  public createCard(): FSRSCard {
    return this.fsrs.createEmptyCard()
  }

  /**
   * Ensures every item in the list has a corresponding card.
   * Merges with existing cards loaded from disk.
   */
  public syncCards(
    items: NonEmptyArray<TypedContainsKhmer>,
    existingCards: Record<TypedContainsKhmer, FSRSCard>,
  ): SyncResult {
    let hasChanges = false
    const nextCards = { ...existingCards }

    items.forEach(word => {
      if (!nextCards[word]) {
        nextCards[word] = this.createCard()
        hasChanges = true
      }
    })

    return { cards: Record_toNonEmptyRecord_orThrow(nextCards), hasChanges }
  }

  public findNextDue(
    items: NonEmptyArray<TypedContainsKhmer>,
    cards: NonEmptyRecord<TypedContainsKhmer, FSRSCard>,
  ): TypedContainsKhmer {
    return items.reduce((best, item) => {
      const bestTime = cards[best]?.due.getTime() ?? 0
      const itemTime = cards[item]?.due.getTime() ?? 0

      return itemTime < bestTime ? item : best
    })
  }

  public reviewCard(card: FSRSCard, rating: Rating): FSRSCard {
    const scheduling = this.fsrs.repeat(card, new Date())

    return scheduling[rating].card
  }

  public getNextIntervals(card: FSRSCard): NonEmptyRecord<Rating, Date> {
    const scheduling = this.fsrs.repeat(card, new Date())

    return {
      [Rating.Again]: scheduling[Rating.Again].card.due,
      [Rating.Hard]: scheduling[Rating.Hard].card.due,
      [Rating.Good]: scheduling[Rating.Good].card.due,
      [Rating.Easy]: scheduling[Rating.Easy].card.due,
    } as NonEmptyRecord<Rating, Date>
  }
}
