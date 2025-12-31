import { type NonEmptyArray } from './non-empty-array'
import { type NonEmptyString } from './non-empty-string'
import { type Option, Option_some, Option_none } from './types'

export type NonEmptyStringTrimmed = NonEmptyString & {
  readonly __NonEmptyStringTrimmedBrand: 'NonEmptyStringTrimmed'
}

export const String_toNonEmptyString_orUndefined_afterTrim = (str: string): NonEmptyStringTrimmed | undefined => {
  const trimmed = str.trim()
  return trimmed.length > 0 ? (trimmed as NonEmptyStringTrimmed) : undefined
}

export const String_toNonEmptyString_afterTrim = (str: string): Option<NonEmptyStringTrimmed> => {
  const trimmed = str.trim()
  return trimmed.length > 0 ? Option_some(trimmed as NonEmptyStringTrimmed) : Option_none
}

export function nonEmptyString_afterTrim(str: ''): never
export function nonEmptyString_afterTrim(str: string): NonEmptyStringTrimmed
export function nonEmptyString_afterTrim(str: string): NonEmptyStringTrimmed {
  const trimmed = str.trim()
  if (trimmed.length === 0) {
    throw new TypeError('empty string passed to nonEmptyString_afterTrim() (after trimming)')
  }
  return trimmed as NonEmptyStringTrimmed
}

export function unknown_isNonEmptyStringTrimmed(v: unknown): v is NonEmptyStringTrimmed {
  if (typeof v !== 'string') return false
  const v_ = v.trim()
  return v_.length > 0
}

export function unknown_assertNonEmptyStringTrimmed(v: unknown): asserts v is NonEmptyStringTrimmed {
  if (!unknown_isNonEmptyStringTrimmed(v))
    throw new TypeError(`Invalid NonEmptyStringTrimmed. Received: ${JSON.stringify(v)}`)
}

export const nonEmptyArrayOfString_afterTrim = (arr: readonly string[]): NonEmptyArray<NonEmptyStringTrimmed> => {
  if (!Array.isArray(arr)) {
    throw new TypeError('Validation Error: Input passed to nonEmptyArrayOfString_afterTrim is not an array.')
  }
  if (arr.length === 0) {
    throw new TypeError('Validation Error: Input array passed to nonEmptyArrayOfString_afterTrim is empty.')
  }

  const result = arr.map((original, i) => {
    const line = i + 1
    if (typeof original !== 'string') {
      throw new TypeError(`Validation Error at line ${line}: Expected a string, but found type '${typeof original}'.`)
    }
    const trimmed = original.trim()
    if (trimmed.length === 0) {
      throw new TypeError(
        `Validation Error at line ${line}: String is empty after trimming. Original value: "${original}"`,
      )
    }
    return trimmed as NonEmptyStringTrimmed
  })

  return result as unknown as NonEmptyArray<NonEmptyStringTrimmed>
}

export const arrayOfNonEmptyString_filterOut_afterTrim = (arr: string[]): readonly NonEmptyStringTrimmed[] => {
  return arr.map(x => x.trim()).filter((s): s is NonEmptyStringTrimmed => s.length > 0)
}
