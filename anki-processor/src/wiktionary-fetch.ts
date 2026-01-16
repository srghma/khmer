import { nonEmptyString_afterTrim, type NonEmptyString } from './utils/non-empty-string.js'
import { type Except, Except_error, Except_isOk, Except_ok } from './utils/types.js'
import { JSDOM } from 'jsdom'
import type { WiktionaryCache } from './wiktionary-cache.js'
import PQueue from 'p-queue'

// Define return type to explicitly handle 404 as a value, not just an error string
type FetchResult = { t: 'ok'; html: NonEmptyString } | { t: '404' }

const fetchWiktionaryHtml = async (word: NonEmptyString): Promise<Except<string, FetchResult>> => {
  try {
    const url = `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`
    const response = await fetch(url)

    if (response.status === 404) {
      return Except_ok({ t: '404' })
    }

    if (!response.ok) {
      return Except_error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const dom = new JSDOM(html)
    const bodyContent = dom.window.document.getElementById('bodyContent')

    if (!bodyContent) return Except_error('No #bodyContent element found in HTML')

    const innerHTML = nonEmptyString_afterTrim(bodyContent.innerHTML)
    if (!innerHTML) return Except_error('innerHTML not non-empty-string')

    return Except_ok({ t: 'ok', html: innerHTML })
  } catch (e) {
    return Except_error(`Network/Parse Error: ${String(e)}`)
  }
}

export const processQueue = async (words: Set<NonEmptyString>, cache: WiktionaryCache): Promise<void> => {
  const queue = new PQueue({ concurrency: 5 })

  let fetchedCount = 0
  let fetched404Count = 0
  let skippedCount = 0

  // Map<ErrorMessage, ListOfWords>
  const errorGroups = new Map<string, NonEmptyString[]>()

  for (const word of words) {
    if (cache.has(word)) {
      skippedCount++
      continue
    }

    queue.add(async () => {
      try {
        await new Promise(r => setTimeout(r, Math.random() * 500 + 200))

        console.log(`[Fetch] ${word}`)
        const result = await fetchWiktionaryHtml(word)

        if (Except_isOk(result)) {
          const val = result.v
          if (val.t === 'ok') {
            await cache.addSuccess(word, val.html)
            fetchedCount++
          } else {
            // It was a 404, save it so we don't retry
            console.log(`[404] ${word}`)
            await cache.add404(word)
            fetched404Count++
          }
        } else {
          console.warn(`[Fail] ${word}: ${result.error}`)

          // Group errors
          const currentList = errorGroups.get(result.error) ?? []
          currentList.push(word)
          errorGroups.set(result.error, currentList)
        }
      } catch (err) {
        // Handle unexpected crashes (e.g. disk full, code bugs)
        const msg = `Fatal Task Error: ${String(err)}`
        console.error(`[${msg}] ${word}`)

        const currentList = errorGroups.get(msg) ?? []
        currentList.push(word)
        errorGroups.set(msg, currentList)
      }
    })
  }

  await queue.onIdle()

  const failedCount = Array.from(errorGroups.values()).reduce((acc, list) => acc + list.length, 0)
  const total = words.size
  const computedTotal = fetchedCount + fetched404Count + skippedCount + failedCount

  console.log('------------------------------------------------')
  console.log(`Queue finished.`)
  console.log(`Total Input: ${total}`)
  console.log(`----------------`)
  console.log(`Cache hits:  ${skippedCount}`)
  console.log(`Fetched (OK):${fetchedCount}`)
  console.log(`Fetched (404):${fetched404Count}`)
  console.log(`Failed:      ${failedCount}`)
  console.log(`----------------`)

  if (failedCount > 0) {
    console.log('Error Breakdown:')
    for (const [errorMsg, affectedWords] of errorGroups) {
      console.log(`  [${errorMsg}]: ${affectedWords.length}`)
      // Print first 5 words as examples
      const preview = affectedWords.slice(0, 5).join(', ')
      const remaining = affectedWords.length > 5 ? `, ...and ${affectedWords.length - 5} more` : ''
      console.log(`    -> ${preview}${remaining}`)
    }
    console.log(`----------------`)
  }

  console.log(`Processed:   ${computedTotal} / ${total}`)
  console.log('------------------------------------------------')
}
