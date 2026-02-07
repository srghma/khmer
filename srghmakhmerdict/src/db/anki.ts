import { invoke } from '@tauri-apps/api/core'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { State, type Card as FSRSCard } from '@squeakyrobot/fsrs'
import { parseStringOrNumberToValidDateOrThrow } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/toValidDate'

// --- Types ---

// The raw format returned by Rust (using timestamps for dates)
interface AnkiCardRow {
  word: TypedContainsKhmer
  due: number // timestamp
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: State
  last_review: number | null // timestamp
}

export type AnkiMap = Record<TypedContainsKhmer, FSRSCard>

// --- API ---

/**
 * Loads all Anki cards from the SQLite database.
 */
export const loadCards = async (): Promise<AnkiMap> => {
  const rawMap = await invoke<Record<TypedContainsKhmer, AnkiCardRow>>('get_all_anki_cards')
  const parsedMap: AnkiMap = {} as AnkiMap

  for (const [word, row] of Object.entries(rawMap)) {
    // Cast the word to TypedContainsKhmer (caller assumes it's valid if in this DB)
    parsedMap[word as TypedContainsKhmer] = {
      due: parseStringOrNumberToValidDateOrThrow(row.due),
      stability: row.stability,
      difficulty: row.difficulty,
      elapsed_days: row.elapsed_days,
      scheduled_days: row.scheduled_days,
      reps: row.reps,
      lapses: row.lapses,
      state: row.state,
      last_review: row.last_review ? parseStringOrNumberToValidDateOrThrow(row.last_review) : null,
    }
  }

  return parsedMap
}

/**
 * Saves (Upserts) Anki cards to the SQLite database.
 */
export const saveCards = async (cards: AnkiMap): Promise<void> => {
  const rawMap: Record<TypedContainsKhmer, AnkiCardRow> = {}

  for (const [word, card] of Object.entries(cards)) {
    rawMap[word as TypedContainsKhmer] = {
      word: word as TypedContainsKhmer,
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
}
