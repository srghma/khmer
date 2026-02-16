import type { NonEmptyStringTrimmed } from './non-empty-string-trimmed'

/**
 * Strictly Cyrillic characters only (includes ё, й, etc.), no whitespace, no symbols.
 * Note: In NFC form, accented letters like ё are single characters within this script block.
 */
export const StringLowercaseCyrillic_REGEX = /^[\p{Script=Cyrillic}]+$/u

export type StringLowercaseCyrillic = NonEmptyStringTrimmed & {
  readonly __brandStringLowercaseCyrillic: 'StringLowercaseCyrillic'
}

export const isStringLowercaseCyrillic = (value: string): value is StringLowercaseCyrillic =>
  StringLowercaseCyrillic_REGEX.test(value)

/**
 * Removes ALL non-Cyrillic characters (including spaces), lowercases,
 * and strips ONLY stress marks (acute accents), preserving letters like 'ё'.
 */
export const strToLowercaseCyrillic_remove_orUndefined = (value: string): StringLowercaseCyrillic | undefined => {
  if (!value) return undefined

  const v = value
    .toLowerCase()
    // Normalize to NFC so that letters like 'ё' are treated as single characters
    .normalize('NFC')
    // Remove ONLY the Combining Acute Accent (U+0301), which is the standard Cyrillic stress mark
    .replace(/\u0301/gu, '')
    // Remove EVERYTHING that is NOT a Cyrillic character (this includes spaces, symbols, and remaining diacritics)
    .replace(/[^\p{Script=Cyrillic}]+/gu, '')

  if (!v || v.length === 0) return undefined

  // Final check against regex to ensure no hidden whitespace or symbols remain
  return isStringLowercaseCyrillic(v) ? v : undefined
}

export const strToLowercaseCyrillic_remove_orThrow = (value: string): StringLowercaseCyrillic => {
  const v = strToLowercaseCyrillic_remove_orUndefined(value)
  if (!v) throw new Error(`Invalid LowercaseCyrillic format: '${value}'`)
  return v
}

/**
 * Internal helper for word-level normalization.
 * Standardizes 'ё' and removes stress marks.
 */
export const normalizeToCyrillicInternal = (value: string): string | undefined => {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFC')
    .replace(/\u0301/gu, '')

  return normalized.length > 0 ? normalized : undefined
}

/**
 * Splits text into unique words, ensuring each is strictly Lowercase Cyrillic
 */
export const strToUniqueLowercaseCyrillicWords = (value: string): Set<StringLowercaseCyrillic> => {
  const fragments = value
    .split(/[^\p{Script=Cyrillic}]+/u)
    .map(normalizeToCyrillicInternal)
    .filter((w): w is StringLowercaseCyrillic => !!w && isStringLowercaseCyrillic(w))

  return new Set(fragments)
}
