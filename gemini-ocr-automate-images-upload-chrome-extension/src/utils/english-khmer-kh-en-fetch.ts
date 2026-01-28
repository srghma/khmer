import { type NonEmptyStringTrimmed } from './non-empty-string-trimmed'
import { type Except, Except_error, Except_isError, Except_ok } from './types.js'
import { cleanEnglishKhmerKhEnHtml } from './english-khmer-kh-en-extractor.js'
import type { EnglishKhmerKhEnCache } from './english-khmer-kh-en-cache-db.js'
import PQueue from 'p-queue'
import type { TypedKhmerWord } from './khmer-word.js'

type FetchResult = { t: 'ok'; html: NonEmptyStringTrimmed } | { t: '404' }

const fetchKhEnUrl = async (word: NonEmptyStringTrimmed): Promise<Except<string, FetchResult>> => {
  // gcm=3 is Khmer->English
  const url = `https://www.english-khmer.com/index.php?gcm=3&gword=${encodeURIComponent(word)}`

  let response
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Compatible; Bot/1.0)',
        Referer: 'https://www.english-khmer.com/',
      },
    })
  } catch (e) {
    return Except_error(`Network Error: ${String(e)}`)
  }

  if (!response.ok) return Except_error(`HTTP ${response.status}`)
  const rawHtml = await response.text()

  const result = await cleanEnglishKhmerKhEnHtml(rawHtml)

  if (result === '404') return Except_ok({ t: '404' })
  if (!result) return Except_error('Parser returned empty result')

  return Except_ok({ t: 'ok', html: result })
}

export const processEKKhEnQueue = async (words: Set<TypedKhmerWord>, cache: EnglishKhmerKhEnCache): Promise<void> => {
  const wordsToFetch = (() => {
    const wordsToFetch: Set<TypedKhmerWord> = new Set()
    for (const word of words) if (!cache.has(word)) wordsToFetch.add(word)
    return wordsToFetch
  })()

  const queue = new PQueue({ concurrency: 7 })
  const total = wordsToFetch.size
  let processed = 0
  const stats = { fetched: 0, notFound: 0, failed: 0 }

  console.log(`Starting Kh->En queue for ${total} words...`)

  for (const word of wordsToFetch) {
    if (cache.has(word)) {
      processed++
      continue
    }

    queue.add(async () => {
      // Rate limit
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000))
      console.log(`[${processed + 1}/${total}] Fetching: ${word}`)

      const res = await fetchKhEnUrl(word)

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

  await queue.onIdle()
  console.log('--- Done ---')
  console.log(`Fetched: ${stats.fetched}, 404: ${stats.notFound}, Failed: ${stats.failed}`)
}
