import { type NonEmptyStringTrimmed } from './non-empty-string-trimmed.js'
import { type Except, Except_error, Except_isError, Except_ok } from './types.js'
import { cleanEnglishKhmerHtml } from './english-khmer-en-kh-extractor.js'
import type { EnglishKhmerCache } from './english-khmer-en-kh-cache-db.js'
import PQueue from 'p-queue'
import type { StringLowercaseLatin } from './string-lowercase-latin.js'
import type { NonEmptySet } from './non-empty-set.js'

// -- Types --

type FetchResult = { t: 'ok'; html: NonEmptyStringTrimmed } | { t: '404' }

// -- Fetch Logic --

const fetchUrl = async (word: NonEmptyStringTrimmed): Promise<Except<string, FetchResult>> => {
  const url = `https://www.english-khmer.com/index.php?gcm=1&gword=${encodeURIComponent(word)}`

  let response = undefined
  try {
    // Add headers to look like a browser
    response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        Referer: 'https://www.english-khmer.com/',
      },
    })
  } catch (e) {
    return Except_error(`Network Error: ${String(e)}`)
  }

  if (!response.ok) return Except_error(`HTTP ${response.status}`)

  const rawHtml = await response.text()

  // Process HTML immediately to detect 404 or Clean Content
  const result = await cleanEnglishKhmerHtml(rawHtml)

  if (result === '404') return Except_ok({ t: '404' })

  if (!result) {
    // It wasn't 404, but we couldn't find the definition row.
    // This usually means the page structure changed or it's a glitch.
    return Except_error('Parser failed to extract definition from page')
  }

  return Except_ok({ t: 'ok', html: result })
}

// -- Queue --

export const processEKQueue = async (
  wordsToFetch: NonEmptySet<StringLowercaseLatin>,
  cache: EnglishKhmerCache,
): Promise<void> => {
  const queue = new PQueue({ concurrency: 10 }) // Conservative concurrency for scraping
  const total = wordsToFetch.size
  let processed = 0

  const stats = { fetched: 0, notFound: 0, failed: 0 }

  console.log(`Starting queue for ${total} words...`)

  for (const word of wordsToFetch) {
    // Check Cache First
    if (cache.has(word)) {
      processed++
      continue
    }

    queue.add(async () => {
      // Rate Limit Delay
      const delay = 1000 + Math.random() * 1500
      await new Promise(r => setTimeout(r, delay))

      console.log(`[${processed + 1}/${total}] Fetching: ${word}`)

      const res = await fetchUrl(word)

      if (Except_isError(res)) {
        console.error(`  ❌ Failed: ${word} - ${res.error}`)
        stats.failed++
      } else {
        const val = res.v
        if (val.t === '404') {
          console.log(`  ⚪ 404: ${word}`)
          await cache.add404(word)
          stats.notFound++
        } else {
          console.log(`  ✅ Found: ${word}`)
          await cache.addSuccess(word, val.html)
          stats.fetched++
        }
      }
      processed++
    })
  }

  console.log('--- Start ---')
  console.log(`To fetch: ${wordsToFetch.size}`)

  await queue.onIdle()

  console.log('--- Done ---')
  console.log(`Fetched: ${stats.fetched}`)
  console.log(`404: ${stats.notFound}`)
  console.log(`Failed: ${stats.failed}`)
}
