// --- Imports ---
// Adjust these paths to where you locally installed/cloned Translateer
import PagePool from 'translateer/src/pagepool.ts'
import { type Page, pagePool } from 'translateer/src/pagepool.ts'
import { parsePage } from 'translateer/src/parser.ts'

import { delay } from './delay'
import { nonEmptyString_afterTrim, type NonEmptyStringTrimmed } from './non-empty-string-trimmed'
import { pMapWithConcurrency1AndOption } from './async'
import { Option_none, Option_some } from './types'

export type LanguageCode = 'en' | 'km'

// --- Configuration ---

const CONCURRENCY_LIMIT = 1 // Should match PagePool size

// --- Pool Management ---

/**
 * Lazy initializes the Puppeteer Page Pool.
 * Uses a singleton pattern to reuse the browser instance across calls.
 */
async function getOrInitPool(): Promise<PagePool> {
  if (pagePool) return pagePool
  console.log('[Translateer] Initializing Page Pool...')
  await new PagePool(CONCURRENCY_LIMIT).init()
  return pagePool
}

/**
 * Helper to cleanup browser on process exit
 */
process.on('exit', () => {
  if (pagePool) {
    // Fire and forget close
    pagePool.close().catch(console.error)
  }
})

/**
 * Acquires a page from the pool.
 * Since Translateer's getPage() returns undefined immediately if empty,
 * we spin-wait until a page becomes available.
 */
async function acquirePage(pool: PagePool): Promise<Page> {
  let page = pool.getPage()
  while (!page) {
    await delay(50) // Wait 50ms before retrying
    page = pool.getPage()
  }
  return page
}

// --- Main Function ---

export async function translateBulk({
  listOfWordsToTranslate,
  fromLanguage,
  toLanguage,
  onSuccess,
}: {
  listOfWordsToTranslate: NonEmptyStringTrimmed[]
  fromLanguage: LanguageCode
  toLanguage: LanguageCode
  onSuccess?: (original: NonEmptyStringTrimmed, translation: NonEmptyStringTrimmed) => void
}): Promise<{ original: NonEmptyStringTrimmed; translation: NonEmptyStringTrimmed }[]> {
  console.log('translateBulk: listOfWordsToTranslate.length', listOfWordsToTranslate.length)
  // 1. Ensure Pool is ready
  const pool = await getOrInitPool()
  const page: Page = await acquirePage(pool)

  try {
    // 2. Process concurrently based on pool size
    const results: {
      original: NonEmptyStringTrimmed
      translation: NonEmptyStringTrimmed
    }[] = await pMapWithConcurrency1AndOption(
      listOfWordsToTranslate,
      async (word: NonEmptyStringTrimmed, signal?: AbortSignal) => {
        if (signal?.aborted) return Option_none

        await delay(500)

        if (signal?.aborted) return Option_none

        try {
          // b. Execute Translation via Puppeteer
          // parsePage now accepts signal and returns undefined if aborted
          const output = await parsePage(page, {
            text: word,
            from: fromLanguage,
            to: toLanguage,
            lite: true,
          })

          // If output is undefined, it means operation was aborted
          if (!output) {
            return Option_none
          }

          const translatedText = output.result
          const translationTrimmed = nonEmptyString_afterTrim(translatedText)

          // c. Validate, Notify, and Return
          if (onSuccess) onSuccess(word, translationTrimmed)

          return Option_some({
            original: word,
            translation: translationTrimmed,
          } as const)
        } catch (error) {
          if (signal?.aborted) return Option_none

          console.warn(`[translateBulk] Error translating "${word}":`, error instanceof Error ? error.message : error)
          return Option_none
        }
      },
      {
        useProgressBar: true,
        onNone: 'stop',
        retryTimes: 2,
        timeoutMs: 10000,
      },
    )
    return results
  } finally {
    pool.releasePage(page)
    console.log('trying to close')
    await pagePool.close()
    console.log('trying to close success')
  }
}
