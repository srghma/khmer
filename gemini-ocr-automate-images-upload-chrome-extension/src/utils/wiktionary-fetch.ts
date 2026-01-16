import {
  nonEmptyString_afterTrim,
  type NonEmptyStringTrimmed,
} from "./non-empty-string-trimmed"
import { type Except, Except_error, Except_isOk, Except_ok } from "./types.js"
import { JSDOM } from "jsdom"
import type { WiktionaryCache } from "./wiktionary-cache.js"
import PQueue from "p-queue"

// -- Types --

type FetchResult =
  | { t: "ok"; html: NonEmptyStringTrimmed }
  | { t: "404" }
  | { t: "429" }

// -- Configuration Constants --

const MAX_RETRIES_PER_WORD = 10
const BACKOFF_MULTIPLIER = 1.5
const STANDARD_DELAY_BUMP_ON_429 = 1.1 // Increase standard delay by 10% if we hit a wall

// -- Fetch Logic --

const fetchWiktionaryHtml = async (
  word: NonEmptyStringTrimmed,
): Promise<Except<string, FetchResult>> => {
  try {
    const url = `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`
    const response = await fetch(url)

    if (response.status === 429) {
      return Except_ok({ t: "429" })
    }

    if (response.status === 404) {
      return Except_ok({ t: "404" })
    }

    if (!response.ok) {
      return Except_error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const dom = new JSDOM(html)
    const bodyContent = dom.window.document.getElementById("bodyContent")

    if (!bodyContent)
      return Except_error("No #bodyContent element found in HTML")

    const innerHTML = nonEmptyString_afterTrim(bodyContent.innerHTML)
    if (!innerHTML) return Except_error("innerHTML not non-empty-string")

    return Except_ok({ t: "ok", html: innerHTML })
  } catch (e) {
    return Except_error(`Network/Parse Error: ${String(e)}`)
  }
}

// -- Queue Processor --

export const processQueue = async (
  words: Set<NonEmptyStringTrimmed>,
  cache: WiktionaryCache,
): Promise<void> => {
  // Sort words by length (smallest first)
  const sortedWords = Array.from(words).sort((a, b) => a.length - b.length)
  const totalWords = sortedWords.length

  const queue = new PQueue({ concurrency: 5 })

  // State for Rate Limiting
  let currentStandardDelay = 1000 // Start with 1s delay
  let currentCooldown = 30000 // Start with 30s cooldown
  let rateLimitPromise: Promise<void> | null = null

  // Stats
  let progressCounter = 0
  let fetchedCount = 0
  let fetched404Count = 0
  let skippedCount = 0
  const errorGroups = new Map<string, NonEmptyStringTrimmed[]>()

  for (const word of sortedWords) {
    if (cache.has(word)) {
      skippedCount++
      progressCounter++ // Count cached items as processed
      continue
    }

    queue.add(async () => {
      // Capture the index for this task when it starts execution
      progressCounter++
      const myProgressIndex = progressCounter

      let attempts = 0

      // Retry loop for this specific word
      while (attempts < MAX_RETRIES_PER_WORD) {
        attempts++

        try {
          // 1. Wait for any active global cooldown
          if (rateLimitPromise) {
            await rateLimitPromise
          }

          // 2. Standard per-request delay
          // Adding a little random jitter to avoid perfect synchronization
          const jitter = Math.random() * 200
          await new Promise((r) => setTimeout(r, currentStandardDelay + jitter))

          console.log(
            `[Fetch] [${myProgressIndex}/${totalWords}] ${word} (Attempt ${attempts})`,
          )
          const result = await fetchWiktionaryHtml(word)

          if (Except_isOk(result)) {
            const val = result.v

            // -- HANDLE 429 --
            if (val.t === "429") {
              // If we've hit the max retries, we stop this word
              if (attempts >= MAX_RETRIES_PER_WORD) {
                const msg = "Aborted: Too Many Requests (Max Retries Reached)"
                console.error(`[Fail] ${word}: ${msg}`)
                const list = errorGroups.get(msg) ?? []
                list.push(word)
                errorGroups.set(msg, list)
                return // Exit task
              }

              // Logic to trigger global cooldown (Mutex pattern)
              if (!rateLimitPromise) {
                console.warn(
                  `[429] Hit Limit. Pausing queue for ${
                    currentCooldown / 1000
                  }s...`,
                )
                queue.pause()

                // Permanently increase the standard delay for future requests
                // to try and avoid hitting the wall again.
                currentStandardDelay = Math.ceil(
                  currentStandardDelay * STANDARD_DELAY_BUMP_ON_429,
                )

                rateLimitPromise = new Promise<void>((resolve) => {
                  setTimeout(() => {
                    console.log("[429] Resuming queue...")

                    // Increase cooldown for next time if we fail again
                    currentCooldown = Math.ceil(
                      currentCooldown * BACKOFF_MULTIPLIER,
                    )

                    rateLimitPromise = null
                    queue.start()
                    resolve()
                  }, currentCooldown)
                })
              }

              // Wait for the cooldown to finish, then retry loop
              await rateLimitPromise
              continue
            }

            // -- HANDLE OK --
            if (val.t === "ok") {
              await cache.addSuccess(word, val.html)
              fetchedCount++
              return // Success
            }

            // -- HANDLE 404 --
            if (val.t === "404") {
              console.log(`[404] ${word}`)
              await cache.add404(word)
              fetched404Count++
              return // Success (technically)
            }
          } else {
            // -- HANDLE NETWORK/OTHER ERRORS --
            // Don't retry on generic 500s or parse errors, move on
            console.warn(`[Fail] ${word}: ${result.error}`)
            const list = errorGroups.get(result.error) ?? []
            list.push(word)
            errorGroups.set(result.error, list)
            return
          }
        } catch (err) {
          // -- HANDLE CRASHES --
          const msg = `Fatal Task Error: ${String(err)}`
          console.error(`[${msg}] ${word}`)
          const list = errorGroups.get(msg) ?? []
          list.push(word)
          errorGroups.set(msg, list)
          return
        }
      }
    })
  }

  await queue.onIdle()

  // -- Reporting --

  const failedCount = Array.from(errorGroups.values()).reduce(
    (acc, list) => acc + list.length,
    0,
  )
  const computedTotal =
    fetchedCount + fetched404Count + skippedCount + failedCount

  console.log("------------------------------------------------")
  console.log(`Queue finished.`)
  console.log(`Total Input: ${totalWords}`)
  console.log(`----------------`)
  console.log(`Cache hits:  ${skippedCount}`)
  console.log(`Fetched (OK):${fetchedCount}`)
  console.log(`Fetched (404):${fetched404Count}`)
  console.log(`Failed:      ${failedCount}`)
  console.log(`----------------`)

  if (failedCount > 0) {
    console.log("Error Breakdown:")
    for (const [errorMsg, affectedWords] of errorGroups) {
      console.log(`  [${errorMsg}]: ${affectedWords.length}`)
      const preview = affectedWords.slice(0, 5).join(", ")
      const remaining =
        affectedWords.length > 5
          ? `, ...and ${affectedWords.length - 5} more`
          : ""
      console.log(`    -> ${preview}${remaining}`)
    }
    console.log(`----------------`)
  }

  console.log(`Processed:   ${computedTotal} / ${totalWords}`)

  // Suggestion for config
  console.log(`\n[Config Suggestion]`)
  if (currentStandardDelay > 1000) {
    console.log(
      `Network was unstable. Recommended 'Safe Start Delay' for next run: ${currentStandardDelay}ms`,
    )
  } else {
    console.log(`Network was stable. 1000ms delay works fine.`)
  }

  console.log("------------------------------------------------")
}
