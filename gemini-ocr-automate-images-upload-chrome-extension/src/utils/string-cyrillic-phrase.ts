import type { NonEmptyStringTrimmed } from './non-empty-string-trimmed'

/**
 * Allows Cyrillic characters, single spaces, and hyphens.
 * Rules:
 * 1. Must start with a Cyrillic character.
 * 2. Can contain single spaces or single hyphens.
 * 3. Can end with a hyphen (e.g., "пол-") or a Cyrillic character.
 */
export const StringCyrillicPhrase_REGEX = /^[\p{Script=Cyrillic}]+(?:[\s-][\p{Script=Cyrillic}]+)*-?$/u

export type StringCyrillicPhrase = NonEmptyStringTrimmed & {
  readonly __brandStringCyrillicPhrase: 'StringCyrillicPhrase'
}

export const isStringCyrillicPhrase = (value: string): value is StringCyrillicPhrase =>
  StringCyrillicPhrase_REGEX.test(value)

/**
 * STRICT check: Returns value only if it is already perfectly formatted.
 */
export const strToCyrillicPhrase_orUndefined = (value: string): StringCyrillicPhrase | undefined => {
  if (!value) return undefined
  return isStringCyrillicPhrase(value) ? value : undefined
}

/**
 * NORMALIZING check:
 * 1. NFC Normalization (standardizes 'ё').
 * 2. Removes stress marks (U+0301).
 * 3. Replaces non-Cyrillic/non-space/non-hyphen symbols with spaces.
 * 4. Collapses multiple spaces and multiple hyphens.
 * 5. Trims.
 */
export const strToCyrillicPhrase_orUndefined_normalize = (value: string): StringCyrillicPhrase | undefined => {
  if (!value) return undefined

  const v = value
    .normalize('NFC')
    .replace(/\u0301/gu, '')
    // Replace anything NOT Cyrillic, space, or hyphen with a space
    .replace(/[^\p{Script=Cyrillic}\s-]+/gu, ' ')
    // Collapse multiple hyphens into one
    .replace(/-+/gu, '-')
    // Collapse multiple spaces into one
    .replace(/\s+/gu, ' ')
    .trim()

  if (!v || v.length === 0) return undefined

  return isStringCyrillicPhrase(v) ? v : undefined
}

export const strToCyrillicPhrase_orThrow = (value: string): StringCyrillicPhrase => {
  const v = strToCyrillicPhrase_orUndefined(value)
  if (!v) throw new Error(`Invalid CyrillicPhrase format: '${value}'`)
  return v
}

export const strToUniqueCyrillicPhrases = (value: string): Set<StringCyrillicPhrase> => {
  const lines = value.split(/[\n\r]+/u)
  const result = new Set<StringCyrillicPhrase>()

  for (const line of lines) {
    const normalized = strToCyrillicPhrase_orUndefined_normalize(line)
    if (normalized) {
      result.add(normalized)
    }
  }

  return result
}
