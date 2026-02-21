import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import * as DictDb from './db/dict'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import {
  Set_toNonEmptySet_orThrow,
  type NonEmptySet,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { Set_getUsingNormalizer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/sets-get-set-using-normalizer'
import { Map_getOriginalKeyUsingNormalizer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/map-get-set-using-normalizer'
import { normalizeKhmerDiactricsInsensitive } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/normalizeKhmerDiactricsInsensitive'
import {
  strToKhmerWord_remove_nonKhmerOnBothEnds_orThrow,
  strToKhmerWordOrUndefined,
  type TypedKhmerWord,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'

export type DictData = {
  en: NonEmptySet<NonEmptyStringTrimmed>
  km_map: DictDb.KhmerWordsMap
  ru: NonEmptySet<NonEmptyStringTrimmed>
}

export type WordLanguageTuple =
  | [NonEmptyStringTrimmed, 'en']
  | [NonEmptyStringTrimmed, 'ru']
  | [TypedContainsKhmer, 'km']

function DictData_isWordInEitherOf3Dictionaries_en_or_ru_or_km(
  dictData: DictData,
  word: NonEmptyStringTrimmed,
): WordLanguageTuple | undefined {
  if (dictData.en.has(word)) return [word, 'en']
  if (dictData.ru.has(word)) return [word, 'ru']
  if (dictData.km_map.has(word as TypedContainsKhmer)) return [word as TypedContainsKhmer, 'km']

  return undefined
}

export function DictData_isWordInEitherOf3Dictionaries_caseInsensitive(
  dictData: DictData,
  word: NonEmptyStringTrimmed,
): WordLanguageTuple | undefined {
  const wordL =
    DictData_isWordInEitherOf3Dictionaries_en_or_ru_or_km(dictData, word) ||
    DictData_isWordInEitherOf3Dictionaries_en_or_ru_or_km(dictData, word.toLowerCase() as NonEmptyStringTrimmed) ||
    DictData_isWordInEitherOf3Dictionaries_en_or_ru_or_km(dictData, word.toUpperCase() as NonEmptyStringTrimmed)

  if (wordL) return wordL

  return (
    (() => {
      const enW = Set_getUsingNormalizer(
        dictData.en,
        word,
        (w: NonEmptyStringTrimmed) => w.toLowerCase() as NonEmptyStringTrimmed,
      )

      if (enW) return [enW, 'en']

      return undefined
    })() ||
    (() => {
      const ruW = Set_getUsingNormalizer(
        dictData.ru,
        word,
        (w: NonEmptyStringTrimmed) => w.toLowerCase() as NonEmptyStringTrimmed,
      )

      if (ruW) return [ruW, 'ru']

      return undefined
    })() ||
    (() => {
      const wordKhmerWord: TypedKhmerWord | undefined = strToKhmerWordOrUndefined(word)

      if (!wordKhmerWord) return undefined
      const kmW = Map_getOriginalKeyUsingNormalizer(dictData.km_map, wordKhmerWord, (w: TypedContainsKhmer) =>
        normalizeKhmerDiactricsInsensitive(strToKhmerWord_remove_nonKhmerOnBothEnds_orThrow(w)),
      )

      if (kmW) return [kmW, 'km']

      return undefined
    })()
  )
}

async function load3(): Promise<DictData> {
  // console.log('📚 Fetching words...')
  const [enWords, km_map, ruWords] = await Promise.all([DictDb.getEnWords(), DictDb.getKmWords(), DictDb.getRuWords()])

  // console.log('km_map', km_map)

  // Start populating transliterations in the background after app is idle
  // console.log('🎉 Dictionary data initialized successfully!')

  return {
    en: Set_toNonEmptySet_orThrow(new Set(enWords)),
    km_map: km_map,
    ru: Set_toNonEmptySet_orThrow(new Set(ruWords)),
  }
}

export async function initializeDictionaryData(): Promise<() => Promise<DictData>> {
  await waitForDatabase()
  const promise = load3()

  return () => promise
}

/**
 * Wait for the database to be ready by listening to events
 */
async function waitForDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    let unlistenSuccess: (() => void) | null = null
    let unlistenError: (() => void) | null = null

    const cleanup = () => {
      unlistenSuccess?.()
      unlistenError?.()
    }

    // Set up listeners
    const setupListeners = async () => {
      // Listen for success
      unlistenSuccess = await listen('db-initialized', () => {
        // console.log('✅ DB Initialized Event Received')
        cleanup()
        resolve()
      })

      // Listen for errors
      unlistenError = await listen<string>('db-error', evt => {
        // console.error('❌ Database Error:', evt.payload)
        cleanup()
        reject(new Error(`Database error: ${evt.payload}`))
      })

      // Check if DB is already ready
      try {
        const { is_ready, error } = await invoke<{ is_ready: boolean; error: string | null }>('get_db_status')

        // console.log('🔍 DB ready check:', { is_ready, error })

        if (is_ready) {
          cleanup()
          resolve()
        } else if (error) {
          cleanup()
          reject(new Error(`Database error: ${error}`))
        }
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.warn('⚠️ Could not check DB status:', e)
        // Continue waiting for event
      }
    }

    setupListeners()
  })
}
