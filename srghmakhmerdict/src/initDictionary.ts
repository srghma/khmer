import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import * as DictDb from './db/dict'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'

export type DictData = {
  en: NonEmptyArray<NonEmptyStringTrimmed>
  km_map: DictDb.KhmerWordsMap
  ru: NonEmptyArray<NonEmptyStringTrimmed>
}

async function load3(): Promise<DictData> {
  // console.log('📚 Fetching words...')
  const [enWords, km_map, ruWords] = await Promise.all([DictDb.getEnWords(), DictDb.getKmWords(), DictDb.getRuWords()])

  // console.log('km_map', km_map)

  // console.log('🎉 Dictionary data initialized successfully!')

  return {
    en: enWords,
    km_map: km_map,
    ru: ruWords,
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
        const isReady = await invoke<boolean>('is_db_ready')

        // console.log('🔍 DB ready check:', isReady)

        if (isReady) {
          cleanup()
          resolve()
        }
      } catch (e) {
        // console.warn('⚠️ Could not check DB status:', e)
        // Continue waiting for event
      }
    }

    setupListeners()
  })
}
