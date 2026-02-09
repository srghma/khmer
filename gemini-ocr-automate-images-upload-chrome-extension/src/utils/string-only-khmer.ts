import type { NonEmptyStringTrimmed } from './non-empty-string-trimmed'

// text that contains only khmer letters (and whitespace) and no other scripts

// TODO rename to TypedOnlyKhmerAndSpace
export type TypedOnlyKhmer = NonEmptyStringTrimmed & { readonly __brandTypedOnlyKhmer: 'TypedOnlyKhmer' }

// Checks if the string contains NO characters that are NOT Khmer (ignoring whitespace)
export const isOnlyKhmer = (value: NonEmptyStringTrimmed): value is TypedOnlyKhmer => {
  // Regex looks for anything that is NOT Khmer and NOT whitespace. If found, return false.
  // Using \P{Script=Khmer} would be the inverse, but [^\p{Script=Khmer}] is safer in some contexts.
  return !/[^\p{Script=Khmer}\s]/u.test(value)
}

export const strToOnlyKhmerOrUndefined = (value: NonEmptyStringTrimmed): TypedOnlyKhmer | undefined =>
  isOnlyKhmer(value) ? value : undefined

export const strToOnlyKhmerOrThrow = (value: NonEmptyStringTrimmed): TypedOnlyKhmer => {
  const v = strToOnlyKhmerOrUndefined(value)
  if (!v) throw new Error(`Invalid OnlyKhmer format: '${value}'`)
  return v
}

export const strToOnlyKhmer_remove_orUndefined = (value: string): TypedOnlyKhmer | undefined => {
  if (!value) return undefined
  const v = value
    // Replace anything that is NOT Khmer script with a space
    .replace(/[^\p{Script=Khmer}]+/gu, ' ') // TODO: leave digits and punctuation OR remove latin, cyrillic, etc.
    .replace(/\s\s+/g, ' ')
    .trim()

  if (!v) return undefined
  return v as TypedOnlyKhmer
}

export const strToOnlyKhmer_remove_orThrow = (value: string): TypedOnlyKhmer => {
  const v = strToOnlyKhmer_remove_orUndefined(value)
  if (!v) throw new Error(`Invalid OnlyKhmer format: '${value}'`)
  return v
}
