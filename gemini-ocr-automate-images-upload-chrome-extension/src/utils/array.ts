// Copyright 2025 srghma

import { assertIsDefinedAndReturn } from './asserts.js'
import { type Option } from './types.js'

export function Array_eq<T>(eq: (x: T, y: T) => boolean, arr1: readonly T[], arr2: readonly T[]): boolean {
  if (arr1.length !== arr2.length) return false
  for (let i = 0; i < arr1.length; i++) {
    if (!eq(arr1[i]!, arr1[i]!)) return false
  }
  return true
}

// Array_startsWith([1,2,3], [1,2,3]) => true
// Array_startsWith([1,2,3], [1,2]) => true
// Array_startsWith([1,2], [1,2,3]) => false
export const Array_startsWith = <T>(
  eq: (x: T, y: T) => boolean,
  array: readonly T[],
  maybeprefix: readonly T[],
): boolean => {
  if (maybeprefix.length > array.length) return false
  for (let i = 0; i < maybeprefix.length; i++) {
    if (!eq(maybeprefix[i]!, array[i]!)) return false
  }
  return true
}

export function Array_filterMap<T, U>(arr: readonly T[], f: (item: T, index: number) => Option<U>): U[] {
  const result: U[] = []
  arr.forEach((item, idx) => {
    const opt = f(item, idx)
    if (opt.t === 'some') {
      result.push(opt.v)
    }
  })
  return result
}

export function Array_filterMap_undefined<T, U>(arr: readonly T[], f: (item: T, index: number) => U | undefined): U[] {
  const result: U[] = []
  arr.forEach((item, idx) => {
    const opt = f(item, idx)
    if (opt !== undefined) result.push(opt)
  })
  return result
}

export function Array_findExactlyOneOrNoneBy<T>(arr: readonly T[], predicate: (item: T) => boolean): T | undefined {
  const [found, ...others] = arr.filter(predicate)
  if (others.length > 0) throw new Error(`Multiple elements found`)
  return found
}

export function Array_findExactlyOneBy<T>(arr: readonly T[], predicate: (item: T) => boolean): T {
  return assertIsDefinedAndReturn(Array_findExactlyOneOrNoneBy(arr, predicate))
}

export function Array_partition<T>(arr: readonly T[], predicate: (item: T, index: number) => boolean): [T[], T[]] {
  const yes: T[] = []
  const no: T[] = []
  arr.forEach((item, idx) => {
    if (predicate(item, idx)) {
      yes.push(item)
    } else {
      no.push(item)
    }
  })
  return [yes, no]
}

export type FindByAndSplit<T> = {
  readonly found: T
  readonly withoutFoundOne: T[]
}

export function findByAndSplit<T>(
  arr: readonly NonNullable<T>[],
  predicate: (item: T) => boolean,
): FindByAndSplit<T> | undefined {
  const index = arr.findIndex(predicate)

  if (index === -1) {
    return undefined
  }

  const found = arr[index]
  if (found === undefined) return undefined

  const withoutFoundOne = [...arr.slice(0, index), ...arr.slice(index + 1)]
  return { found, withoutFoundOne }
}

export function Array_unique_usingSet<T extends string | number>(items: readonly T[]): T[] {
  return Array.from(new Set(items))
}

export function isUniqueArray<T>(items: readonly T[]): boolean {
  const seen = new Set<T>()
  for (const item of items) {
    if (seen.has(item)) {
      return false
    }
    seen.add(item)
  }
  return true
}

export function assertUniqueArray<T>(items: readonly T[]): void {
  const seen = new Set<T>()
  for (const item of items) {
    if (seen.has(item)) {
      throw new Error(`duplicate item '${String(item)}' found`)
    }
    seen.add(item)
  }
}

export function assertArrayElementsAreSame<T>(items: readonly T[]): void {
  if (items.length === 0) {
    throw new Error('assertArrayOfSameElements: empty array')
  }
  const first = items[0]
  for (const item of items) {
    if (item !== first) {
      throw new Error(`assertArrayOfSameElements: elements differ: ${String(first)} !== ${String(item)}`)
    }
  }
}

export function zipArrayBy_toMaps<A, B, K extends PropertyKey>(
  a: readonly A[],
  b: readonly B[],
  keyA: (x: A) => K,
  keyB: (x: B) => K,
): [Map<K, [A, B]>, Map<K, A>, Map<K, B>] {
  const zipped = new Map<K, [A, B]>()
  const leftoversA = new Map<K, A>()
  const leftoversB = new Map<K, B>()

  // put B items into leftoversB by key
  for (const bi of b) {
    leftoversB.set(keyB(bi), bi)
  }

  // iterate A and try to find matches in B
  for (const ai of a) {
    const k = keyA(ai)
    const bj = leftoversB.get(k)
    if (bj !== undefined) {
      zipped.set(k, [ai, bj])
      leftoversB.delete(k)
    } else {
      leftoversA.set(k, ai)
    }
  }

  return [zipped, leftoversA, leftoversB]
}

export function zipArrayBy_toMaps_strict<A, B, K extends PropertyKey>(
  a: readonly A[],
  b: readonly B[],
  keyA: (x: A) => K,
  keyB: (x: B) => K,
): Map<K, [A, B]> {
  const [zipped, leftoversA, leftoversB] = zipArrayBy_toMaps(a, b, keyA, keyB)

  if (leftoversA.size > 0) {
    throw new Error(
      `zipArrayByToMaps_Strict: Unmatched elements in first array: ${JSON.stringify(Array.from(leftoversA.values()))}`,
    )
  }

  if (leftoversB.size > 0) {
    throw new Error(
      `zipArrayByToMaps_Strict: Unmatched elements in second array: ${JSON.stringify(Array.from(leftoversB.values()))}`,
    )
  }

  return zipped
}

// export function zipArrayBy<A, B, K>(a: readonly A[], b: readonly B[], keyA: (x: A) => K, keyB: (x: B) => K): [Array<[A, B]>, A[], B[]] {
//   const zipped: Array<[A, B]> = []
//   const leftoversA: A[] = []
//   const leftoversB = new Map<K, B>()
//
//   // put B items into a map by key
//   for (const bi of b) {
//     leftoversB.set(keyB(bi), bi)
//   }
//
//   // iterate A and try to find matches in B
//   for (const ai of a) {
//     const k = keyA(ai)
//     const bj = leftoversB.get(k)
//     if (bj !== undefined) {
//       zipped.push([ai, bj])
//       leftoversB.delete(k)
//     } else {
//       leftoversA.push(ai)
//     }
//   }
//
//   return [zipped, leftoversA, Array.from(leftoversB.values())]
// }
//
// export function zipArrayBy_Strict<A, B, K>(a: readonly A[], b: readonly B[], keyA: (x: A) => K, keyB: (x: B) => K): Array<[A, B]> {
//   const [zipped, leftoversA, leftoversB] = zipArrayBy(a, b, keyA, keyB)
//
//   if (leftoversA.length > 0) {
//     throw new Error(`zipArrayBy_Strict: Unmatched elements in first array: ${JSON.stringify(leftoversA)}`)
//   }
//
//   if (leftoversB.length > 0) {
//     throw new Error(`zipArrayBy_Strict: Unmatched elements in second array: ${JSON.stringify(leftoversB)}`)
//   }
//
//   return zipped
// }

export function zipArray_byPosition<A, B>(a: readonly A[], b: readonly B[]): [Array<[A, B]>, A[], B[]] {
  const len = Math.min(a.length, b.length)
  const zipped: Array<[A, B]> = []
  for (let i = 0; i < len; i++) {
    zipped.push([a[i]!, b[i]!])
  }
  return [
    zipped,
    a.slice(len), // leftover in A
    b.slice(len), // leftover in B
  ]
}

export function splitOnGroupsOf<T>(groupLength: number, ts: readonly T[]): T[][] {
  if (groupLength <= 0) throw new Error('groupLength must be > 0')
  return Array.from({ length: Math.ceil(ts.length / groupLength) }, (_, i) =>
    ts.slice(i * groupLength, i * groupLength + groupLength),
  )
}

/**
 * Finds the first duplicate element in an array using a custom equality function.
 *
 * @param items Array of items of type T
 * @param eqFn Function to determine equality between two items
 * @returns The first duplicate and its index, or undefined if none
 */
export function findFirstDuplicate<T>(
  items: readonly T[],
  eqFn: (a: T, b: T) => boolean,
): { item: T; index: number } | undefined {
  return items
    .map((item, index) => ({ item, index }))
    .find(({ item, index }, _, arr) => arr.some((other, j) => j !== index && eqFn(item, other.item)))
}

/**
 * Generic function to check for duplicates in an array.
 * Returns the first duplicate error info, or undefined if none.
 */
export function checkUniqueElements<T>(
  items: readonly T[] | undefined,
  eqFn: (a: T, b: T) => boolean,
  mkPath: (item: T, index: number) => string,
): string | undefined {
  if (!items || items.length === 0) return undefined

  const firstDup = findFirstDuplicate(items, eqFn)
  if (firstDup) {
    return mkPath(firstDup.item, firstDup.index)
  }

  return undefined
}

/**
 * @example
 * ```ts
 * // Suppose we have numbers and want to partition them into even and odd buckets.
 * const numbers = [1, 2, 3, 4, 5]
 *
 * const result: { even: number[], odd: number[] } = Array_partitionByType(
 *   numbers,
 *   x => x, // getValue: identity function
 *   {
 *     even: v => v % 2 === 0,
 *     odd: v => v % 2 !== 0,
 *   }
 * )
 *
 * // result:
 * // {
 * //   even: [2, 4],
 * //   odd:  [1, 3, 5],
 * // }
 * ```
 */
export function Array_partitionByType<V, Config extends Record<string, (v: V) => boolean>>(
  xs: readonly V[],
  config: Config,
): { [K in keyof Config]: V[] } {
  const result = Object.keys(config).reduce((acc, key) => {
    acc[key] = []
    return acc
  }, {} as any)
  for (const x of xs) {
    for (const [key, checkFn] of Object.entries(config)) {
      if (checkFn(x)) {
        result[key].push(x)
        break
      }
    }
  }
  return result
}

export function Array_moveIndexToStart<T>(arr: readonly T[], index: number): T[] {
  if (index < 0) throw new Error('Invalid index: cannot be less than zero')
  if (index >= arr.length) throw new Error('Invalid index: cannot be more than array')
  if (index === 0) throw new Error('Invalid index: cannot be zero, bc noop')

  const item = arr[index]!
  return [item, ...arr.slice(0, index), ...arr.slice(index + 1)]
}

// export function Array_moveIndexToStart_splice<T>(arr: readonly T[], index: number): T[] {
//   if (index < 0) throw new Error('Invalid index: cannot be less than zero')
//   if (index >= arr.length) throw new Error('Invalid index: cannot be more than array')
//   if (index === 0) throw new Error('Invalid index: cannot be zero, bc noop')
//
//   const entries = arr.slice() // clone
//   const [item] = entries.splice(index, 1)
//   return [item!, ...entries]
// }

export function Array_filterMap_undefined_toSet<T, U>(
  arr: readonly T[],
  f: (item: T, index: number) => U | undefined,
): Set<U> {
  const result = new Set<U>()
  arr.forEach((item, idx) => {
    const val = f(item, idx)
    if (val !== undefined) {
      result.add(val)
    }
  })
  return result
}

/**
 * Groups an array into a Record based on a fixed set of keys.
 * Ensures every key exists in the resulting record, even if the array is empty.
 */
export function Array_groupByKeys<V, K extends string>(
  xs: readonly V[],
  keys: readonly K[],
  getKey: (v: V) => K,
): Record<K, V[]> {
  const result = {} as Record<K, V[]>

  // Initialize all keys with empty arrays
  for (const key of keys) result[key] = []

  // Populate buckets
  for (const x of xs) {
    const key = getKey(x)
    // We check if the key is valid for the record we initialized
    if (Object.prototype.hasOwnProperty.call(result, key)) result[key].push(x)
  }

  return result
}
