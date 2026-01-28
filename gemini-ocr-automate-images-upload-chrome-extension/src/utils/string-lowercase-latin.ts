import type { NonEmptyStringTrimmed } from './non-empty-string-trimmed'

export const StringLowercaseLatin_REGEX = /^[a-z]+$/

export type StringLowercaseLatin = NonEmptyStringTrimmed & { __brandStringLowercaseLatin: 'StringLowercaseLatin' }
export const unsafe_string_toStringLowercaseLatin = (c: string) => c as StringLowercaseLatin

export const isStringLowercaseLatin = (value: string): value is StringLowercaseLatin =>
  StringLowercaseLatin_REGEX.test(value)

export const stringToStringLowercaseLatinOrUndefined = (value: string): StringLowercaseLatin | undefined =>
  isStringLowercaseLatin(value) ? value : undefined

export const stringToStringLowercaseLatinOrThrow = (value: string): StringLowercaseLatin => {
  const c = stringToStringLowercaseLatinOrUndefined(value)
  if (!c) throw new Error(`Invalid StringLowercaseLatin format: '${value}'`)
  return c
}

/**
 * Normalizes a string: trims, lowercases, and strips diacritics/accents.
 * Returns a basic string, or undefined if the result contains non-latin characters.
 */
export const normalizeToLatinInternal = (value: string): string | undefined => {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .normalize('NFC')

  return normalized.length > 0 ? normalized : undefined
}

export const stringToStringLowercaseLatinOrThrow__allowUppercaseAndAccents = (value: string): StringLowercaseLatin => {
  const normalized = normalizeToLatinInternal(value)
  const result = normalized ? stringToStringLowercaseLatinOrUndefined(normalized) : undefined

  if (!result) {
    throw new Error(`Could not normalize '${value}' to a valid Lowercase Latin string. Result: '${normalized}'`)
  }

  return result
}

/**
 * Generator that yields normalized Latin words one by one.
 * Uses matchAll for lazy evaluation (avoids creating large arrays via split).
 */
export function* iterateLowercaseLatinWords(value: string): IterableIterator<StringLowercaseLatin> {
  // \p{Script=Latin} matches any Latin character (including accents).
  // We match sequences of them, then normalize.
  const matches = value.matchAll(/[\p{Script=Latin}]+/gu)

  for (const match of matches) {
    const rawWord = match[0]
    const normalized = normalizeToLatinInternal(rawWord)

    // Check if valid [a-z]+ after normalization
    if (normalized && isStringLowercaseLatin(normalized)) {
      yield normalized
    }
  }
}

/**
 * Legacy support: Returns a Set of unique words.
 * Now implemented using the iterator to avoid code duplication.
 */
export const strToUniqueLowercaseLatinWords = (value: string): Set<StringLowercaseLatin> => {
  // The Set constructor accepts an iterable, so this works perfectly
  return new Set(iterateLowercaseLatinWords(value))
}
