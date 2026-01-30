// Copyright 2023 srghma

import type { NonEmptyStringTrimmed } from './non-empty-string-trimmed'

// Khmer Unicode range: U+1780 to U+17FF
const ContainsKhmer_REGEX = /\p{Script=Khmer}/u

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
