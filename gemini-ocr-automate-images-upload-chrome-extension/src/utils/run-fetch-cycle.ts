import { Database } from 'bun:sqlite'
import { nonEmptyString_afterTrim, type NonEmptyStringTrimmed } from './non-empty-string-trimmed.js'
import chalk from 'chalk'
import { iterateNewWordsToFetch } from './get-new-words-to-fetch.js'
import { Set_toNonEmptySet_orUndefined, type NonEmptySet } from './non-empty-set.js'

// Interface compatible with all your caches
export interface CacheWithIterator {
  iterateSuccessEntries: () => IterableIterator<{ html: string | NonEmptyStringTrimmed }>
  getAllWords: () => Set<NonEmptyStringTrimmed>
}

export interface RunFetchCycleOptions<T extends NonEmptyStringTrimmed, C extends CacheWithIterator> {
  name: string
  dictDbPath: string
  dbQuery: string
  targetCache: C
  sourceCaches: CacheWithIterator[]
  strToIterator: (text: string) => IterableIterator<T>
  processQueue: (words: NonEmptySet<T>, cache: C) => Promise<void>
}

export const runFetchCycle = async <T extends NonEmptyStringTrimmed, C extends CacheWithIterator>(
  options: RunFetchCycleOptions<T, C>,
) => {
  const { name, dictDbPath, dbQuery, targetCache, sourceCaches, strToIterator, processQueue } = options

  console.log(chalk.blue(`🏁 [${name}] Starting Fetch Cycle...`))

  const wordsFromDb = (() => {
    const db = new Database(dictDbPath)
    const rows = db.query(dbQuery).all() as { Word: string }[]
    const wordsFromDb = new Set(rows.map(r => nonEmptyString_afterTrim(r.Word)))
    db.close()
    return wordsFromDb
  })()

  console.log(chalk.gray(`   [${name}] Initial DB check: ${wordsFromDb.size} words.`))

  let iteration = 1
  let hasWaited = false
  const BATCH_SIZE = 10000

  while (true) {
    console.log(chalk.magenta(`\n[${name}] 🔄 Iteration ${iteration} starting...`))

    // 1. Take a snapshot of what we already have.
    // We will use this to filter the ENTIRE stream for this cycle.
    // New items added during this cycle will be caught in the NEXT iteration (recursion).
    const cacheSnapshot = targetCache.getAllWords()

    // 2. Prepare sources
    const harvestSources = sourceCaches.map(cache => () => {
      function* generator() {
        for (const entry of cache.iterateSuccessEntries()) {
          yield entry.html as string
        }
      }
      return generator()
    })

    // 3. Create the lazy iterator
    // const wordStream = iterateNewWordsToFetch<T>(wordsFromDb, cacheSnapshot, strToIterator, harvestSources)
    const wordStream = iterateNewWordsToFetch<T>(wordsFromDb, cacheSnapshot, strToIterator, harvestSources)

    let wordsFoundInThisCycle = 0
    let isStreamExhausted = false

    // 4. Consume the stream in batches until exhausted
    while (!isStreamExhausted) {
      const currentBatch = new Set<T>()

      // Pull up to BATCH_SIZE items
      for (let i = 0; i < BATCH_SIZE; i++) {
        const res = wordStream.next()
        if (res.done) {
          isStreamExhausted = true
          break
        }
        currentBatch.add(res.value)
      }

      const nonEmptyBatch = Set_toNonEmptySet_orUndefined(currentBatch)

      if (nonEmptyBatch) {
        console.log(chalk.yellow(`[${name}] 📈 Processing batch of ${nonEmptyBatch.size} words...`))

        // Reset wait flag since we found work
        hasWaited = false
        wordsFoundInThisCycle += nonEmptyBatch.size

        // Process this chunk
        await processQueue(nonEmptyBatch, targetCache)
      }
    }

    // 5. End of Cycle Logic
    if (wordsFoundInThisCycle === 0) {
      if (!hasWaited) {
        const seconds = 600
        console.log(chalk.cyan(`[${name}] ⏳ Nothing to fetch in entire cycle. Waiting ${seconds}s...`))
        await Bun.sleep(seconds * 1000)
        hasWaited = true
        continue
      }
      console.log(chalk.green(`[${name}] ✨ Cycle complete (No new words found after wait).`))
      break
    } else {
      console.log(
        chalk.green(
          `[${name}] ♻️  Cycle ${iteration} finished. Found ${wordsFoundInThisCycle} words. Restarting to catch deep recursions...`,
        ),
      )
    }

    iteration++
  }

  console.log(chalk.blue(`[${name}] ✅ Done.`))
}
