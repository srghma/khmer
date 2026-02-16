// Copyright 2023 srghma

import type { NonEmptyStringTrimmed } from './non-empty-string-trimmed'

// Khmer Unicode range: U+1780 to U+17FF
export const ContainsKhmer_REGEX = /\p{Script=Khmer}/u

// text that contains only khmer letters and no other letters (not even space)

export type TypedContainsKhmer = NonEmptyStringTrimmed & { readonly __brandTypedContainsKhmer: 'TypedContainsKhmer' }
export const isContainsKhmer = (value: NonEmptyStringTrimmed): value is TypedContainsKhmer =>
  ContainsKhmer_REGEX.test(value)
export const strToContainsKhmerOrUndefined = (value: NonEmptyStringTrimmed): TypedContainsKhmer | undefined =>
  isContainsKhmer(value) ? value : undefined
export const strToContainsKhmerOrThrow = (value: NonEmptyStringTrimmed): TypedContainsKhmer => {
  const v = strToContainsKhmerOrUndefined(value)
  if (!v) throw new Error(`Invalid ContainsKhmer format: '${value}'`)
  return v
}

export const strToContainsKhmerOrThrow__stripAllNonKhmer = (value: string): TypedContainsKhmer => {
  // 1. Replace all characters that are NOT Khmer (\P is the negation of \p)
  // This removes spaces, latin letters, emojis, etc.
  // The 'u' flag is required for Unicode property escapes
  const stripped = value.replace(/\P{Script=Khmer}/gu, '')

  // 2. Since your type 'TypedContainsKhmer' requires 'NonEmptyStringTrimmed',
  // we must ensure that stripping didn't result in an empty string
  if (stripped.length === 0) {
    throw new Error(
      `Invalid Khmer format: After stripping all non-Khmer characters, the result is empty. Original input: '${value}'`,
    )
  }

  // 3. Return the result cast to the branded type
  return stripped as TypedContainsKhmer
}
