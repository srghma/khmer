// Copyright 2023 srghma

import type { NonEmptyArray } from './non-empty-array.js'
import { Option_none, Option_some, type Option } from './types.js'

// -- Types --

export type NonEmptyString = string & {
  readonly __NonEmptyStringBrand: 'NonEmptyString'
}

// -- Single Value: To Undefined --

export const String_toNonEmptyString_orUndefined = (str: string): NonEmptyString | undefined => {
  return str.length > 0 ? (str as NonEmptyString) : undefined
}

// -- Single Value: To Option --

export const String_toNonEmptyString = (str: string): Option<NonEmptyString> => {
  return str.length > 0 ? Option_some(str as NonEmptyString) : Option_none
}

// -- Single Value: Assert/Throw --

export function nonEmptyString(str: ''): never
export function nonEmptyString(str: string): NonEmptyString
export function nonEmptyString(str: string): NonEmptyString {
  if (typeof str !== 'string') {
    throw new TypeError('not string passed to nonEmptyString()')
  }
  if (str.length === 0) {
    throw new TypeError('empty string passed to nonEmptyString()')
  }
  return str as NonEmptyString
}

// -- Type Guards --

export const unknown_isNonEmptyString = (v: unknown): v is NonEmptyString => {
  return typeof v === 'string' && v.length > 0
}

export function unknown_assertNonEmptyString(v: unknown): asserts v is NonEmptyString {
  if (!unknown_isNonEmptyString(v)) {
    throw new TypeError(`Invalid NonEmptyString. Received: ${JSON.stringify(v)}`)
  }
}

// -- Arrays --

export function nonEmptyArrayOfString(arr: []): never
export function nonEmptyArrayOfString(arr: ['']): never
export function nonEmptyArrayOfString(arr: string[]): NonEmptyArray<NonEmptyString>
export function nonEmptyArrayOfString(arr: string[]): NonEmptyArray<NonEmptyString> {
  if (!Array.isArray(arr)) {
    throw new TypeError('Validation Error: Input passed to nonEmptyArrayOfString is not an array.')
  }
  if (arr.length === 0) {
    throw new TypeError('Validation Error: Input array passed to nonEmptyArrayOfString is empty.')
  }

  // Functional check preserving the "Line number" error reporting style
  arr.forEach((s, i) => {
    const line = i + 1
    if (typeof s !== 'string') {
      throw new TypeError(`Validation Error at line ${line}: Expected a string, but found type '${typeof s}'.`)
    }
    if (s.length === 0) {
      throw new TypeError(`Validation Error at line ${line}: Expected a non-empty string, but found an empty string.`)
    }
  })

  return arr as unknown as NonEmptyArray<NonEmptyString>
}

export const arrayOfNonEmptyString_filterOut = (arr: string[]): readonly NonEmptyString[] => {
  return arr.filter((s): s is NonEmptyString => s.length > 0)
}
