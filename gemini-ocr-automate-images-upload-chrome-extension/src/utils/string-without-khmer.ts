// Copyright 2023 srghma

import type { NonEmptyStringTrimmed } from './non-empty-string-trimmed'
import { isContainsKhmer } from './string-contains-khmer-char'

// text that contains only khmer letters and no other letters (not even space)

export type TypedWithoutKhmer = NonEmptyStringTrimmed & { readonly __brandTypedWithoutKhmer: 'TypedWithoutKhmer' }
export const isWithoutKhmer = (value: NonEmptyStringTrimmed): value is TypedWithoutKhmer => !isContainsKhmer(value)
export const strToWithoutKhmerOrUndefined = (value: NonEmptyStringTrimmed): TypedWithoutKhmer | undefined =>
  isWithoutKhmer(value) ? value : undefined
export const strToWithoutKhmerOrThrow = (value: NonEmptyStringTrimmed): TypedWithoutKhmer => {
  const v = strToWithoutKhmerOrUndefined(value)
  if (!v) throw new Error(`Invalid WithoutKhmer format: '${value}'`)
  return v
}

export const strToWithoutKhmer_remove_orUndefined = (value: string): TypedWithoutKhmer | undefined => {
  const v = value
    .replace(/\p{Script=Khmer}+/gu, '')
    .replace(/\s\s+/g, ' ')
    .trim()
  if (!v) return undefined
  return v as TypedWithoutKhmer
}

export const strToWithoutKhmer_remove_orThrow = (value: string): TypedWithoutKhmer => {
  const v = strToWithoutKhmer_remove_orUndefined(value)
  if (!v) throw new Error(`Invalid WithoutKhmer format: '${value}'`)
  return v
}
