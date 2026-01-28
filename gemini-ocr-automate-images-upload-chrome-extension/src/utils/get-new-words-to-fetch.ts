import chalk from 'chalk'
import type { NonEmptyStringTrimmed } from './non-empty-string-trimmed'
import { ReusableHtmlParser } from './html-text-parser'

/**
 * Generator that yields unique new words to fetch.
 *
 * @param wordsFromDb - The seed list of words from the database
 * @param alreadyCached - A snapshot of words we ALREADY have (Ignore list)
 * @param strToIterator - Logic to extract specific word type from text
 * @param mkHarvestSources - Factories for HTML iterators
 */
export function* iterateNewWordsToFetch<T extends NonEmptyStringTrimmed>(
  wordsFromDb: Set<NonEmptyStringTrimmed>,
  alreadyCached: Set<NonEmptyStringTrimmed>,
  strToIterator: (text: string) => IterableIterator<T>,
  mkHarvestSources: (() => IterableIterator<string>)[],
): Generator<T, void, unknown> {
  // if (mkHarvestSources.length === 0) {
  //   for (const text of wordsFromDb) {
  //     for (const w of strToIterator(text)) yield w
  //   }
  //   return
  // }

  console.log(chalk.gray('   [Diff Stream] Started...'))

  // We track what we yield IN THIS CYCLE to avoid duplicates within the stream
  const yieldedInThisCycle = new Set<T>()
  const htmlParser = new ReusableHtmlParser()

  // Helper: Checks duplicates and yields
  function* tryYield(text: string): Generator<T, void, unknown> {
    for (const w of strToIterator(text)) {
      // 1. Must not be in the original cache snapshot
      // 2. Must not have been yielded already in this iterator's life
      if (!alreadyCached.has(w) && !yieldedInThisCycle.has(w)) {
        yieldedInThisCycle.add(w)
        yield w
      }
    }
  }

  // 1. Process DB Words
  for (const w of wordsFromDb) {
    yield* tryYield(w)
  }

  // 2. Harvest from Caches
  for (const mkHarvestSource of mkHarvestSources) {
    console.log(chalk.gray('   [Diff Stream] Switching to next cache source...'))

    let entryCount = 0
    const startTime = Date.now()

    for (const html of mkHarvestSource()) {
      entryCount++

      // Log progress periodically for large caches
      if (entryCount % 5000 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
        console.log(chalk.gray(`     Scanned ${entryCount} entries in ${elapsed}s...`))
      }

      // Parse HTML and yield words
      for (const textChunk of htmlParser.iterateText(html)) {
        yield* tryYield(textChunk)
      }
    }
  }
}
