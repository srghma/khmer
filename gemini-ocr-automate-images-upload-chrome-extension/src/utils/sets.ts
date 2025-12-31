// Copyright 2023 srghma

import { type Option } from './types.js'

export function Set_filterMap<T, U>(set: Set<T>, f: (item: T) => Option<U>): Set<U> {
  const result: Set<U> = new Set()
  for (const item of set) {
    const opt = f(item)
    if (opt.t === 'some') result.add(opt.v)
  }
  return result
}

export function Set_mapToArray<T, U>(set: Set<T>, fn: (x: T) => U): U[] {
  const result: U[] = []
  for (const x of set) {
    result.push(fn(x))
  }
  return result
}

export function Set_map<T, U>(set: Set<T>, fn: (x: T) => U): Set<U> {
  const result = new Set<U>()
  for (const x of set) {
    result.add(fn(x))
  }
  return result
}

export function Set_filter<T>(set: Set<T>, predicate: (x: T) => boolean): Set<T> {
  const result = new Set<T>()
  for (const x of set) {
    if (predicate(x)) result.add(x)
  }
  return result
}

export function Set_partition<T>(set: Set<T>, predicate: (x: T) => boolean): [Set<T>, Set<T>] {
  const yes = new Set<T>()
  const no = new Set<T>()
  for (const x of set) {
    const s = predicate(x) ? yes : no
    s.add(x)
  }
  return [yes, no]
}

export function Set_some<T>(set: Set<T>, predicate: (x: T) => boolean): boolean {
  for (const x of set) if (predicate(x)) return true
  return false
}

export function Set_every<T>(set: Set<T>, predicate: (x: T) => boolean): boolean {
  for (const x of set) if (!predicate(x)) return false
  return true
}

export function Set_flatMap<T, U>(set: Set<T>, fn: (x: T) => Set<U>): Set<U> {
  const result = new Set<U>()
  for (const x of set) {
    for (const y of fn(x)) {
      result.add(y)
    }
  }
  return result
}

export function Set_toMap<K, V>(set: Set<K>, mapFn: (key: K) => V): Map<K, V> {
  // return new Map(Array.from(set, k => [k, mapFn(k)]))
  const result = new Map<K, V>()
  for (const key of set) {
    result.set(key, mapFn(key))
  }
  return result
}

export function Set_eq<T>(set1: Set<T>, set2: Set<T>): boolean {
  if (set1.size !== set2.size) return false
  for (const item of set1) {
    if (!set2.has(item)) return false
  }
  return true
}

export function Set_diff<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  // return new Set([...setA].filter(x => !setB.has(x)))
  const result = new Set<T>()
  for (const x of setA) {
    if (!setB.has(x)) result.add(x)
  }
  return result
}

export function Set_inter<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  // return new Set([...setA].filter(x => setB.has(x)))
  const result = new Set<T>()
  const [small, large] = setA.size < setB.size ? [setA, setB] : [setB, setA] // Iterate the smaller set for efficiency
  for (const x of small) {
    if (large.has(x)) result.add(x)
  }
  return result
}

export function Set_union_onCollisionThrow<T>(...sets: readonly Set<T>[]): Set<T> {
  const result = new Set<T>()
  for (const set of sets) {
    for (const item of set) {
      if (result.has(item)) {
        throw new Error(`Set union collision on item: ${String(item)}`)
      }
      result.add(item)
    }
  }
  return result
}

export function Set_union_onCollisionPreferLast<T>(...sets: readonly Set<T>[]): Set<T> {
  const result = new Set<T>()
  for (const set of sets) {
    for (const item of set) result.add(item)
  }
  return result
}

export function Set_union_onCollisionMerge<T>(mergeCollision: (a: T, b: T) => T, ...sets: readonly Set<T>[]): Set<T> {
  const result = new Set<T>()
  for (const set of sets) {
    for (const item of set) {
      if (result.has(item)) {
        // get the existing item from result
        let existing: T | undefined
        for (const r of result) {
          if (Object.is(r, item) || r === item) {
            existing = r
            break
          }
        }
        if (existing !== undefined) {
          result.delete(existing)
          result.add(mergeCollision(existing, item))
        } else {
          // fallback: shouldn't happen, but add anyway
          result.add(item)
        }
      } else {
        result.add(item)
      }
    }
  }
  return result
}

function Set_mkOrCollectIfArrayIsNotUnique<T>(entries: readonly T[]): {
  seen: Set<T>
  duplicates: Set<T>
} {
  const seen = new Set<T>()
  const duplicates = new Set<T>()

  for (const e of entries) {
    if (seen.has(e)) duplicates.add(e)
    else seen.add(e)
  }

  return { seen, duplicates }
}

export function Set_mkOrThrowIfArrayIsNotUnique<T>(entries: readonly T[]): Set<T> {
  const { seen, duplicates } = Set_mkOrCollectIfArrayIsNotUnique(entries)
  if (duplicates.size > 0) throw new Error(`Array contains duplicate entries: ${[...duplicates].join(', ')}`)
  return seen
}

export function Set_mkOrLogIfArrayIsNotUnique<T>(entries: readonly T[]): Set<T> {
  const { seen, duplicates } = Set_mkOrCollectIfArrayIsNotUnique(entries)
  if (duplicates.size > 0) console.error(`Array contains duplicate entries: ${[...duplicates].join(', ')}`)
  return seen
}
