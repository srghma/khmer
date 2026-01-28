import { nonEmptyString_afterTrim, type NonEmptyStringTrimmed } from './non-empty-string-trimmed'
import { type Except, Except_error, Except_isOk, Except_ok } from './types.js'
import { Window } from 'happy-dom'
import PQueue from 'p-queue'
import type { NonEmptySet } from './non-empty-set.js'
import type { TypedKhmerWord } from './khmer-word.js'
import type { WiktionaryCache } from './wiktionary-cache-db.js'

// -- Types --

type FetchResult = { t: 'ok'; html: NonEmptyStringTrimmed } | { t: '404' } | { t: '429' }

// -- Configuration Constants --

const MAX_RETRIES_PER_WORD = 10
const BACKOFF_MULTIPLIER = 2 // Aggressive backoff
const INITIAL_COOLDOWN = 30000
const STANDARD_DELAY = 1000

// -- Fetch Logic --

const fetchWiktionaryHtml = async (
  ruOrEn: 'en' | 'ru',
  word: NonEmptyStringTrimmed,
): Promise<Except<string, FetchResult>> => {
  try {
    const url = `https://${ruOrEn}.wiktionary.org/wiki/${encodeURIComponent(word)}`
    const response = await fetch(url)

    if (response.status === 429) {
      return Except_ok({ t: '429' })
    }

    if (response.status === 404) {
      return Except_ok({ t: '404' })
    }

    if (!response.ok) {
      return Except_error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    // const dom = new JSDOM(html)
    const window = new Window({ settings: { disableCSSFileLoading: true, disableComputedStyleRendering: true } })
    const doc = window.document
    doc.body.innerHTML = html

    const bodyContent = doc.getElementById('bodyContent')

    if (!bodyContent) return Except_error('No #bodyContent element found in HTML')

    const innerHTML = nonEmptyString_afterTrim(bodyContent.innerHTML)
    if (!innerHTML) return Except_error('innerHTML not non-empty-string')

    return Except_ok({ t: 'ok', html: innerHTML })
  } catch (e) {
    return Except_error(`Network/Parse Error: ${String(e)}`)
  }
}

// -- Queue Processor --

const SetOfString_toArraySorted = <T extends string>(s: Set<T>) => {
  // Sort words by length (smallest first)
  return Array.from(s).sort((a, b) => a.length - b.length)
}

export const processQueue = async <Mode extends 'en' | 'ru'>(
  wordsToFetch: NonEmptySet<TypedKhmerWord>,
  ruOrEn: Mode,
  cache: WiktionaryCache<Mode>,
): Promise<void> => {
  // Initialize Queue
  const queue = new PQueue({ concurrency: 5 })

  // State Management
  let currentCooldown = INITIAL_COOLDOWN
  let rateLimitPausedPromise: Promise<void> | null = null

  // Stats
  let processedCount = 0
  const stats = {
    cached: 0,
    fetched: 0,
    notFound: 0,
    failed: 0,
    errors: new Map<string, string[]>(),
  }

  const logError = (word: string, msg: string) => {
    const list = stats.errors.get(msg) ?? []
    list.push(word)
    stats.errors.set(msg, list)
  }

  // -- The Core Task Function --
  // We define this separately so we can recursively re-add it to the queue
  const addWordToQueue = (word: NonEmptyStringTrimmed, attempt = 1) => {
    queue.add(
      async () => {
        // 1. Global Pause Check (Mutex)
        // If another task triggered the pause, we wait here before even trying.
        if (rateLimitPausedPromise) {
          await rateLimitPausedPromise
        }

        // 2. Standard throttling delay
        // Even in sequential mode, we want a small gap between requests
        const jitter = Math.random() * 200
        await new Promise(r => setTimeout(r, STANDARD_DELAY + jitter))

        processedCount++ // Note: this counts attempts/executions, not unique words
        console.log(
          `[Fetch] [${processedCount} ops/${wordsToFetch.size}] ${word} (Attempt ${attempt}, Concurrency: ${queue.concurrency})`,
        )

        const result = await fetchWiktionaryHtml(ruOrEn, word)

        // -- HANDLE NETWORK/PARSE ERROR --
        if (!Except_isOk(result)) {
          console.warn(`[Fail] ${word}: ${result.error}`)
          logError(word, result.error)
          stats.failed++
          return
        }

        const val = result.v

        // -- HANDLE 429 (TOO MANY REQUESTS) --
        if (val.t === '429') {
          // If max retries reached, give up
          if (attempt >= MAX_RETRIES_PER_WORD) {
            console.error(`[Abort] ${word}: Max retries reached (429)`)
            logError(word, 'Max Retries (429)')
            stats.failed++
            return
          }

          // Trigger Global Cooldown logic if not already active
          if (!rateLimitPausedPromise) {
            console.warn(`[429] Limit Hit! Pausing queue for ${currentCooldown / 1000}s...`)
            console.warn(`[429] Switching to SEQUENTIAL mode (1 by 1).`)

            queue.pause()
            queue.concurrency = 1 // <--- Force one-by-one

            rateLimitPausedPromise = new Promise<void>(resolve => {
              setTimeout(() => {
                console.log('[429] Cooldown finished. Resuming queue strictly sequentially...')

                // Increase cooldown for next time just in case
                currentCooldown = Math.ceil(currentCooldown * BACKOFF_MULTIPLIER)

                rateLimitPausedPromise = null
                queue.start()
                resolve()
              }, currentCooldown)
            })
          }

          // IMPORTANT: Wait for the cooldown to finish
          await rateLimitPausedPromise

          // RE-QUEUE the task
          // We do not 'continue' a loop here. We exit and add back to queue.
          // This ensures this task waits for its turn in the new `concurrency: 1` line.
          // priority: 1 puts it at the front of the line (optional).
          addWordToQueue(word, attempt + 1)
          return
        }

        // -- HANDLE SUCCESS or 404 --

        // If we were in sequential mode, and this request succeeded,
        // we can assume the rate limit has lifted.
        if (queue.concurrency === 1) {
          console.log(`[Recovered] Request for '${word}' succeeded. Resuming PARALLEL mode (5).`)
          queue.concurrency = 5 // <--- Restore concurrency
          currentCooldown = INITIAL_COOLDOWN // Reset cooldown duration
        }

        if (val.t === 'ok') {
          await cache.addSuccess(word, val.html)
          stats.fetched++
        } else if (val.t === '404') {
          console.log(`[404] ${word}`)
          await cache.add404(word)
          stats.notFound++
        }
      },
      {
        // High priority for retries ensures we clear the "problem" words
        // before processing new ones, keeping the sequence logical.
        priority: attempt > 1 ? 1 : 0,
      },
    )
  }

  // -- Initial Queue Population --

  console.log('------------------------------------------------')
  console.log(`Queue started.`)
  console.log(`Words to fetch: ${wordsToFetch.size}`)
  console.log('------------------------------------------------')

  for (const word of SetOfString_toArraySorted(wordsToFetch)) addWordToQueue(word)
  await queue.onIdle()

  // -- Reporting --
  console.log('------------------------------------------------')
  console.log(`Queue finished.`)
  console.log(`Cached:      ${stats.cached}`)
  console.log(`Fetched:     ${stats.fetched}`)
  console.log(`404s:        ${stats.notFound}`)
  console.log(`Failed:      ${stats.failed}`)
  console.log('------------------------------------------------')
}
