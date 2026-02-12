import { Array_groupByKeys } from './array'
import { Set_toNonEmptySet_orThrow, type NonEmptySet } from './non-empty-set'
import { sortBy_immutable } from './sort'
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

export function Array_toNonEmptyArray_unsafe<T>(arr: readonly T[]): NonEmptyArray<T> {
  return arr as any
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

export const NonEmptyArray_sortBy_immutable = sortBy_immutable as unknown as <A, B>(
  items: NonEmptyArray<A>,
  byF: (a: A) => B,
  sorter: (a: B, b: B) => number,
) => NonEmptyArray<A>

/**
 * Finds words in the queue that are missing from the descriptions record.
 */
export function NonEmptyArray_collectToSet<A, B>(queue: NonEmptyArray<A>, f: (a: A) => B): NonEmptySet<B> {
  const s = new Set<B>()
  for (const item of queue) s.add(f(item))
  return Set_toNonEmptySet_orThrow(s)
}

export function Array_groupByKeys_toNonEmptyArrays<V, K extends string>(
  xs: readonly V[],
  keys: readonly K[],
  getKey: (v: V) => K,
): Record<K, NonEmptyArray<V> | undefined> {
  const buckets = Array_groupByKeys(xs, keys, getKey)
  const result = {} as Record<K, NonEmptyArray<V> | undefined>
  for (const key of keys) result[key] = Array_toNonEmptyArray_orUndefined(buckets[key])
  return result
}
