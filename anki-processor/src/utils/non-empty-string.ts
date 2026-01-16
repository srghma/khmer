// Copyright 2023 srghma

import type { NonEmptyArray } from './non-empty-array.js'
import { Option_none, Option_some, type Option } from './types.js'

export type NonEmptyString = string & { readonly __NonEmptyStringBrand: 'NonEmptyString' }

export function String_toNonEmptyString_orUndefined(str: string): NonEmptyString | undefined {
  if (str.length === 0) return undefined
  return str as NonEmptyString
}

export function String_toNonEmptyString_orUndefined_afterTrim(str: string): NonEmptyString | undefined {
  return String_toNonEmptyString_orUndefined(str.trim())
}

export function String_toNonEmptyString(str: string): Option<NonEmptyString> {
  if (str.length === 0) return Option_none
  return Option_some(str as NonEmptyString)
}

export function String_toNonEmptyString_afterTrim(str: string): Option<NonEmptyString> {
  return String_toNonEmptyString(str.trim())
}

export function nonEmptyString_afterTrim(str: ''): never
export function nonEmptyString_afterTrim(str: string): NonEmptyString
export function nonEmptyString_afterTrim(str: string): NonEmptyString {
  return nonEmptyString(str.trim())
}

export function nonEmptyString(str: ''): never
export function nonEmptyString(str: string): NonEmptyString
export function nonEmptyString(str: string): NonEmptyString {
  if (typeof str !== 'string') throw new TypeError('not string passed to nonEmptyString()')
  if (str === '') throw new TypeError('empty string passed to nonEmptyString()')
  return str as NonEmptyString
}

export function unknown_isNonEmptyString(v: unknown): v is NonEmptyString {
  return typeof v === 'string' && v.length > 0
}

export function unknown_assertNonEmptyString(v: unknown): asserts v is NonEmptyString {
  if (!unknown_isNonEmptyString(v)) throw new TypeError(`Invalid NonEmptyString. Received: ${JSON.stringify(v)}`)
}

///////////////// array
export function nonEmptyArrayOfString(arr: []): never
export function nonEmptyArrayOfString(arr: ['']): never
export function nonEmptyArrayOfString(arr: string[]): NonEmptyArray<NonEmptyString>
export function nonEmptyArrayOfString(arr: string[]): NonEmptyArray<NonEmptyString> {
  if (!Array.isArray(arr))
    throw new TypeError('Validation Error: Input passed to nonEmptyArrayOfString is not an array.')
  if (arr.length === 0) throw new TypeError('Validation Error: Input array passed to nonEmptyArrayOfString is empty.')
  for (let i = 0; i < arr.length; i++) {
    const s = arr[i]
    const line = i + 1
    if (typeof s !== 'string')
      throw new TypeError(`Validation Error at line ${line}: Expected a string, but found type '${typeof s}'.`)
    if (s.length === 0)
      throw new TypeError(`Validation Error at line ${line}: Expected a non-empty string, but found an empty string.`)
  }
  return arr as NonEmptyArray<NonEmptyString>
}

export function nonEmptyArrayOfString_afterTrim(arr: readonly string[]): NonEmptyArray<NonEmptyString> {
  if (!Array.isArray(arr))
    throw new TypeError('Validation Error: Input passed to nonEmptyArrayOfString_afterTrim is not an array.')
  if (arr.length === 0)
    throw new TypeError('Validation Error: Input array passed to nonEmptyArrayOfString_afterTrim is empty.')
  const result: NonEmptyString[] = []
  for (let i = 0; i < arr.length; i++) {
    const original = arr[i]
    const line = i + 1
    if (typeof original !== 'string')
      throw new TypeError(`Validation Error at line ${line}: Expected a string, but found type '${typeof original}'.`)
    const trimmed = original.trim()
    if (trimmed.length === 0)
      throw new TypeError(
        `Validation Error at line ${line}: String is empty after trimming. Original value: "${original}"`,
      )
    result.push(trimmed as NonEmptyString)
  }
  return result as NonEmptyArray<NonEmptyString>
}

export function arrayOfNonEmptyString_filterOut(arr: string[]): readonly NonEmptyString[] {
  return arr.filter(s => s.length > 0) as NonEmptyString[]
}

export function arrayOfNonEmptyString_filterOut_afterTrim(arr: string[]): readonly NonEmptyString[] {
  return arrayOfNonEmptyString_filterOut(arr.map(x => x.trim()))
}
