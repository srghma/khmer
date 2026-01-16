// Copyright 2025 srghma

import { type Option } from './types.js'

export function Map_every<K, V>(map: Map<K, V>, predicate: (k: K, v: V) => boolean): boolean {
  for (const [k, v] of map.entries()) {
    if (!predicate(k, v)) return false
  }
  return true
}

export function Map_keysToSet<K, V>(map: Map<K, V>): Set<K> {
  return new Set(map.keys())
}

export function Map_entriesToArray<K, V, R>(map: Map<K, V>, fn: (key: K, value: V, index: number) => R): R[] {
  return Array.from(map.entries()).map(([k, v], i) => fn(k, v, i))
}

export function Map_entriesToRecord<K extends string | number | symbol, V, R>(
  map: Map<K, V>,
  fn: (key: K, value: V) => R,
): Record<K, R> {
  const result = {} as Record<K, R>
  for (const [k, v] of map.entries()) {
    result[k] = fn(k, v)
  }
  return result
}

export function Map_entriesFlatMapToArray<K, V, R>(map: Map<K, V>, fn: (key: K, value: V) => readonly R[]): R[] {
  // return Array.from(map.entries()).flatMap(([key, value]: [K, V]) => fn(key, value))
  const result: R[] = []
  for (const [key, value] of map) {
    const items = fn(key, value)
    // Push each item into result individually to avoid extra intermediate arrays
    for (const item of items) {
      result.push(item)
    }
  }
  return result
}

export function Map_everyEntry<K, V>(map: Map<K, V>, fn: (key: K, value: V) => boolean): boolean {
  // return Array.from(map.entries()).every(([key, value]: [K, V]) => fn(key, value))
  for (const [key, value] of map) {
    if (!fn(key, value)) {
      return false
    }
  }
  return true
}

export function Map_find<K, V>(map: Map<K, V>, predicate: (k: K, v: V) => boolean): [K, V] | undefined {
  for (const [k, v] of map) if (predicate(k, v)) return [k, v]
  return undefined
}

export function Map_getOr<K, V>(map: Map<K, V>, key: K, defaultValue: V): V {
  return map.has(key) ? map.get(key)! : defaultValue
}

export function Map_union_onCollisionThrow<K, V>(...maps: readonly Map<K, V>[]): Map<K, V> {
  const result = new Map<K, V>()
  for (const map of maps) {
    for (const [k, v] of map) {
      if (result.has(k)) throw new Error(`Map union collision on key: ${String(k)}`)
      result.set(k, v)
    }
  }
  return result
}

// similar to Map_mkSemigroupArray, but with custom merge function
export function Map_union_onCollisionMerge<K, V>(
  mergeCollision: (a: V, b: V) => V,
  ...maps: readonly Map<K, V>[]
): Map<K, V> {
  const result = new Map<K, V>()
  for (const map of maps) {
    for (const [k, v] of map) {
      if (result.has(k)) {
        result.set(k, mergeCollision(result.get(k)!, v))
      } else {
        result.set(k, v)
      }
    }
  }
  return result
}

export function Map_union_onCollisionPreferFirst<K, V>(...maps: readonly Map<K, V>[]): Map<K, V> {
  const result = new Map<K, V>()
  for (const map of maps) {
    for (const [k, v] of map) {
      if (!result.has(k)) result.set(k, v)
    }
  }
  return result
}

export function Map_union_onCollisionPreferLast<K, V>(...maps: readonly Map<K, V>[]): Map<K, V> {
  const result = new Map<K, V>()
  for (const map of maps) {
    for (const [k, v] of map) result.set(k, v)
  }
  return result
}

export function Map_intersection<K, V>(mapA: Map<K, V>, mapB: Map<K, V>, merge?: (a: V, b: V) => V): Map<K, V> {
  const result = new Map<K, V>()
  for (const [k, v] of mapA) {
    if (mapB.has(k)) {
      result.set(k, merge ? merge(v, mapB.get(k)!) : v)
    }
  }
  return result
}

export function Map_difference<K, V>(mapA: Map<K, V>, mapB: Map<K, V>): Map<K, V> {
  const result = new Map<K, V>()
  for (const [k, v] of mapA) {
    if (!mapB.has(k)) result.set(k, v)
  }
  return result
}

/**
 * @example
 * const users = new Map<number, { name: string; role: string }>([
 *   [1, { name: 'Alice', role: 'admin' }],
 *   [2, { name: 'Bob', role: 'user' }],
 *   [3, { name: 'Charlie', role: 'admin' }],
 *   [4, { name: 'David', role: 'user' }],
 * ]);
 *
 * const grouped = Map_groupBy(users, (_, user) => user.role);
 *
 * // Result:
 * // Map {
 * //   'admin' => Map { 1 => {name: 'Alice', ...}, 3 => {name: 'Charlie', ...} },
 * //   'user' => Map { 2 => {name: 'Bob', ...}, 4 => {name: 'David', ...} }
 * // }
 */
export function Map_groupBy<K, V, G>(input: Map<K, V>, fn: (key: K, value: V) => G): Map<G, Map<K, V>> {
  const result = new Map<G, Map<K, V>>()
  for (const [k, v] of input) {
    const groupKey = fn(k, v)
    if (!result.has(groupKey)) {
      result.set(groupKey, new Map())
    }
    result.get(groupKey)!.set(k, v)
  }
  return result
}

export function Map_some<K, V>(map: Map<K, V>, predicate: (k: K, v: V) => boolean): boolean {
  for (const [k, v] of map) if (predicate(k, v)) return true
  return false
}

export function Map_none<K, V>(map: Map<K, V>, predicate: (k: K, v: V) => boolean): boolean {
  return !Map_some(map, predicate)
}

/**
 * Filters and maps a Map in one pass using Option.
 * - If the callback returns Option_none, the entry is skipped.
 * - If it returns Option_some, the transformed value is kept.
 */
export function Map_filterMap<K, V, U>(map: Map<K, V>, f: (key: K, value: V) => Option<U>): Map<K, U> {
  const result = new Map<K, U>()
  for (const [k, v] of map) {
    const opt = f(k, v)
    if (opt.t === 'some') {
      result.set(k, opt.v)
    }
  }
  return result
}

export function Map_filter<K, V>(map: Map<K, V>, predicate: (key: K, value: V) => boolean): Map<K, V> {
  const result = new Map<K, V>()
  for (const [k, v] of map) {
    if (predicate(k, v)) {
      result.set(k, v)
    }
  }
  return result
}

export function Map_mapKeys<K, V, J>(map: Map<K, V>, f: (key: K, value: V) => J): Map<J, V> {
  const result = new Map<J, V>()
  for (const [k, v] of map) {
    result.set(f(k, v), v)
  }
  return result
}

export function Map_mapValues<K, V, U>(inputMap: Map<K, V>, fn: (key: K, value: V) => U): Map<K, U> {
  const result = new Map<K, U>()
  for (const [key, value] of inputMap) {
    result.set(key, fn(key, value))
  }
  return result
}

export function Map_partition<K, V>(map: Map<K, V>, predicate: (key: K, value: V) => boolean): [Map<K, V>, Map<K, V>] {
  const yes = new Map<K, V>()
  const no = new Map<K, V>()
  for (const [k, v] of map) {
    const s = predicate(k, v) ? yes : no
    s.set(k, v)
  }
  return [yes, no]
}

/**
 * Build a Map from entries [K, V] but merge duplicate keys into arrays of values
 * @param entries Array of [K, V]
 * @returns Map<K, V[]>
 */
export function Map_mkSemigroupArray<K, V>(entries: readonly [K, V][]): Map<K, V[]> {
  const map = new Map<K, V[]>()
  for (const [key, value] of entries) {
    const existing = map.has(key) ? map.get(key)! : []
    map.set(key, [...existing, value])
  }
  return map
}

export function Map_mkOrThrowIfDuplicateKeys<K, V>(entries: readonly [K, V][]): Map<K, V> {
  const map = new Map<K, V>()
  const duplicates = new Set<K>()

  for (const [key, value] of entries) {
    if (map.has(key)) {
      duplicates.add(key)
    } else {
      map.set(key, value)
    }
  }

  if (duplicates.size > 0) {
    throw new Error(`Duplicate keys found: ${[...duplicates].join(', ')}`)
  }

  return map
}

export function zipMaps<K, A, B>(mapA: Map<K, A>, mapB: Map<K, B>): [Map<K, [A, B]>, Map<K, A>, Map<K, B>] {
  const zipped = new Map<K, [A, B]>()
  const leftoversA = new Map(mapA)
  const leftoversB = new Map(mapB)

  for (const [key, valueA] of mapA) {
    if (mapB.has(key)) {
      zipped.set(key, [valueA, mapB.get(key)!])
      leftoversA.delete(key)
      leftoversB.delete(key)
    }
  }

  return [zipped, leftoversA, leftoversB]
}

// Strict version: throws if either map has leftovers
export function zipMapsStrict<K, A, B>(mapA: Map<K, A>, mapB: Map<K, B>): Map<K, [A, B]> {
  const [zipped, leftoversA, leftoversB] = zipMaps(mapA, mapB)

  if (leftoversA.size > 0) {
    throw new Error(`Keys missing in second map: ${Array.from(leftoversA.keys()).join(', ')}`)
  }

  if (leftoversB.size > 0) {
    throw new Error(`Keys missing in first map: ${Array.from(leftoversB.keys()).join(', ')}`)
  }

  return zipped
}

export function zipMapsLeftIsSubsetOfRight<K extends string, A, B>(mapA: Map<K, A>, mapB: Map<K, B>): Map<K, [A, B]> {
  // FIXME: dont use this method, sh return leftoversB
  const [zipped, leftoversA] = zipMaps(mapA, mapB)

  if (leftoversA.size > 0) {
    throw new Error(
      `zipMapsLeftIsSubsetOfRight: Key(s) missing in second map: ${Array.from(leftoversA.keys()).join(', ')}`,
    )
  }

  return zipped
}

//////////////////////

export function zipMaps3<K, A, B, C>(
  mapA: Map<K, A>,
  mapB: Map<K, B>,
  mapC: Map<K, C>,
): [Map<K, [A, B, C]>, Map<K, A>, Map<K, B>, Map<K, C>] {
  const zipped = new Map<K, [A, B, C]>()
  const leftoversA = new Map(mapA)
  const leftoversB = new Map(mapB)
  const leftoversC = new Map(mapC)

  for (const [key, valueA] of mapA) {
    const valueB = mapB.get(key)
    const valueC = mapC.get(key)
    if (valueB !== undefined && valueC !== undefined) {
      zipped.set(key, [valueA, valueB, valueC])
      leftoversA.delete(key)
      leftoversB.delete(key)
      leftoversC.delete(key)
    }
  }

  return [zipped, leftoversA, leftoversB, leftoversC]
}

export function zipMaps3Strict<K, A, B, C>(mapA: Map<K, A>, mapB: Map<K, B>, mapC: Map<K, C>): Map<K, [A, B, C]> {
  const [zipped, leftoversA, leftoversB, leftoversC] = zipMaps3(mapA, mapB, mapC)

  if (leftoversA.size > 0 || leftoversB.size > 0 || leftoversC.size > 0) {
    throw new Error(
      `zipMaps3Strict: maps must have identical keys. ` +
        `Missing or extra keys → ` +
        `A: [${Array.from(leftoversA.keys()).join(', ')}], ` +
        `B: [${Array.from(leftoversB.keys()).join(', ')}], ` +
        `C: [${Array.from(leftoversC.keys()).join(', ')}]`,
    )
  }

  return zipped
}

// Will throw if invariant keys(A) ⊆ keys(B) ⊆ keys(C) breaks
export function zipMaps3_left_lessThan_middle_lessThan_right<K, A, B, C>(
  mapA: Map<K, A>,
  mapB: Map<K, B>,
  mapC: Map<K, C>,
): Map<K, [A, B, C]> {
  // FIXME: dont use this method, sh return leftoversB
  const [zipped, leftoversA, leftoversB] = zipMaps3(mapA, mapB, mapC)

  if (leftoversA.size > 0) {
    throw new Error(
      `zipMaps3_left_lessThan_middle_lessThan_right: keys in A missing in B or C: ${Array.from(leftoversA.keys()).join(
        ', ',
      )}`,
    )
  }

  // now ensure B ⊆ C (but allow B to have keys not in A)
  if (leftoversB.size > 0) {
    throw new Error(
      `zipMaps3_left_lessThan_middle_lessThan_right: keys in B missing in C: ${Array.from(leftoversB.keys()).join(
        ', ',
      )}`,
    )
  }

  // leftoverC can exist → that's fine (C is allowed to be a superset)
  return zipped
}
