import type { NonEmptyStringTrimmed } from './non-empty-string-trimmed'

export const StringLowercaseCyrillic_REGEX = /^[\p{Script=Cyrillic}]+$/u

export type StringLowercaseCyrillic = NonEmptyStringTrimmed & {
  readonly __brandStringLowercaseCyrillic: 'StringLowercaseCyrillic'
}

export const isStringLowercaseCyrillic = (value: string): value is StringLowercaseCyrillic =>
  StringLowercaseCyrillic_REGEX.test(value)

export const normalizeToCyrillicInternal = (value: string): string | undefined => {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    // Remove stress marks and other diacritics
    .replace(/\p{Diacritic}/gu, '')
    .normalize('NFC')

  return normalized.length > 0 ? normalized : undefined
}

export const strToUniqueLowercaseCyrillicWords = (value: string): Set<StringLowercaseCyrillic> => {
  const fragments = value
    .split(/[^\p{Script=Cyrillic}]+/u)
    .map(normalizeToCyrillicInternal)
    .filter((w): w is StringLowercaseCyrillic => !!w && isStringLowercaseCyrillic(w))

  return new Set(fragments)
}
