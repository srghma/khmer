// Copyright 2025 srghma

import { assertIsDefinedAndReturn } from './asserts.js'
import { type Option } from './types.js'

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

export function zipArrayBy_toMaps<A, B, K extends string | number | symbol>(
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

export function zipArrayBy_toMaps_strict<A, B, K extends string | number | symbol>(
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
  return ts.reduce((acc: T[][], _, index) => {
    if (index % groupLength === 0) {
      acc.push(ts.slice(index, index + groupLength))
    }
    return acc
  }, [])
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
