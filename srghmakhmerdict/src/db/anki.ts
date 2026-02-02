import { invoke } from '@tauri-apps/api/core'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { State, type Card as FSRSCard } from '@squeakyrobot/fsrs'

// --- Types ---

// The raw format returned by Rust (using timestamps for dates)
interface AnkiCardRow {
  word: string
  due: number // timestamp
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: number
  last_review: number | null // timestamp
}

export type AnkiMap = Record<TypedContainsKhmer, FSRSCard>

// --- API ---

/**
 * Loads all Anki cards from the SQLite database.
 */
export const loadCards = async (): Promise<AnkiMap> => {
  try {
    const rawMap = await invoke<Record<string, AnkiCardRow>>('get_all_anki_cards')
    const parsedMap: AnkiMap = {} as AnkiMap

    for (const [word, row] of Object.entries(rawMap)) {
      // Cast the word to TypedContainsKhmer (caller assumes it's valid if in this DB)
      const typedWord = word as TypedContainsKhmer

      parsedMap[typedWord] = {
        due: new Date(row.due),
        stability: row.stability,
        difficulty: row.difficulty,
        elapsed_days: row.elapsed_days,
        scheduled_days: row.scheduled_days,
        reps: row.reps,
        lapses: row.lapses,
        state: row.state as State,
        last_review: row.last_review ? new Date(row.last_review) : null,
      }
    }

    return parsedMap
  } catch (e) {
    console.error('Failed to load Anki state from DB', e)

    return {} as AnkiMap
  }
}

/**
 * Saves (Upserts) Anki cards to the SQLite database.
 */
export const saveCards = async (cards: AnkiMap): Promise<void> => {
  try {
    // Convert Date objects back to timestamps for Rust/SQLite
    const rawMap: Record<string, AnkiCardRow> = {}

    for (const [word, card] of Object.entries(cards)) {
      rawMap[word] = {
        word: word,
        due: card.due.getTime(),
        stability: card.stability,
        difficulty: card.difficulty,
        elapsed_days: card.elapsed_days,
        scheduled_days: card.scheduled_days,
        reps: card.reps,
        lapses: card.lapses,
        state: card.state,
        last_review: card.last_review ? card.last_review.getTime() : null,
      }
    }

    await invoke('save_anki_cards', { cards: rawMap })
  } catch (e) {
    console.error('Failed to save Anki state to DB', e)
  }
}
