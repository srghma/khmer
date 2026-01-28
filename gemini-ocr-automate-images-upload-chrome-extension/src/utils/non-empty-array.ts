import { Option_none, Option_some, type Option } from './types'

// export type NonEmptyArray<T> = T[] & { readonly __NonEmptyArrayBrand: 'NonEmptyArray' }
export type NonEmptyArray<T> = readonly [T, ...(readonly T[])]

export function Array_toNonEmptyArrayOrNone<T>(arr: readonly T[]): Option<NonEmptyArray<T>> {
  if (arr.length === 0) return Option_none
  return Option_some(arr as NonEmptyArray<T>)
}

export function Array_toNonEmptyArray_orUndefined<T>(arr: readonly T[]): NonEmptyArray<T> | undefined {
  if (arr.length === 0) return undefined
  return arr as NonEmptyArray<T>
}

export function Array_toNonEmptyArray_orThrow<T>(arr: readonly T[]): NonEmptyArray<T> {
  Array_assertNonEmptyArray(arr)
  return arr
}

export function Array_isNonEmptyArray<T>(arr: readonly T[]): arr is NonEmptyArray<T> {
  return arr.length !== 0
}

export function Array_assertNonEmptyArray<T>(arr: readonly T[]): asserts arr is NonEmptyArray<T> {
  if (arr.length === 0) throw new Error('array should be non-empty')
}

export function Array_elementsMaybeUndefined_ifAllNonUndefined_toNonEmptyArray_orUndefined<T>(
  arr: readonly (T | null | undefined)[],
): NonEmptyArray<T> | undefined {
  if (arr.some(e => e === undefined || e === null)) return undefined
  if (arr.length === 0) return undefined
  return arr as NonEmptyArray<T>
}

export function Array_elementsMaybeUndefined_ifAllNonUndefined_assertNonEmptyArray<T>(
  arr: readonly (T | null | undefined)[],
): asserts arr is NonEmptyArray<T> {
  const arr_ = Array_elementsMaybeUndefined_ifAllNonUndefined_toNonEmptyArray_orUndefined(arr)
  if (arr_ === undefined) throw new Error('array should be non-empty and all elements should not undefined or null')
}
