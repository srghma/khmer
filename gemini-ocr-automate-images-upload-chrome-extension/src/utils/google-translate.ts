export type LanguageCode = 'en' | 'km'

import { translate } from '@vitalets/google-translate-api'
import { delay } from './delay'
import { nonEmptyString_afterTrim, type NonEmptyStringTrimmed } from './non-empty-string-trimmed'

export async function translateBulk(args: {
  listOfWordsToTranslate: NonEmptyStringTrimmed[]
  fromLanguage: LanguageCode
  toLanguage: LanguageCode
}): Promise<{ original: NonEmptyStringTrimmed; translation: NonEmptyStringTrimmed }[]> {
  const { listOfWordsToTranslate, fromLanguage, toLanguage } = args
  const results: {
    original: NonEmptyStringTrimmed
    translation: NonEmptyStringTrimmed
  }[] = []

  for (const word of listOfWordsToTranslate) {
    try {
      // 1. Perform translation
      const { text } = await translate(word, {
        from: fromLanguage,
        to: toLanguage,
      })
      console.log(text)

      // 2. Add to results
      results.push({
        original: word,
        translation: nonEmptyString_afterTrim(text),
      })

      // 3. Wait 10ms between requests
      await delay(10)
    } catch (error) {
      // 4. Stop immediately on error (e.g. 429 Too Many Requests)
      // We return the results accumulated so far so they can be cached.
      console.warn(
        `[translateBulk] Error encountered at word "${word}". Stopping batch.`,
        error instanceof Error ? error.message : error,
      )
      break
    }
  }

  return results
}
