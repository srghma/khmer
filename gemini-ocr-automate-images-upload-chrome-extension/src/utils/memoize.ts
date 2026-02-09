export const memoizeSync2_LRU__default_keyMaker = (a1: unknown, a2: unknown) => `${String(a1)}:${String(a2)}`

export function memoizeSync2_LRU<A1, A2, R>(
  fn: (a1: A1, a2: A2) => R,
  /**
   * Function to generate a unique cache key from arguments.
   * @default `${a1}:${a2}`
   */
  keyMaker: (a1: A1, a2: A2) => string,
  /**
   * Maximum number of entries to keep in cache.
   * @default 20
   */
  maxSize: number = 20,
): (a1: A1, a2: A2) => R {
  // Maps in JS preserve insertion order.
  // We utilize this to implement LRU by deleting and re-setting keys on access.
  const cache = new Map<string, R>()

  return (a1: A1, a2: A2) => {
    const key = keyMaker(a1, a2)

    if (cache.has(key)) {
      // LRU HIT:
      // Delete and re-set the entry to move it to the end (most recent) of the Map
      const value = cache.get(key)!
      cache.delete(key)
      cache.set(key, value)
      return value
    }

    // MISS: Calculate value
    const result = fn(a1, a2)

    // Add to cache
    cache.set(key, result)

    // LRU EVICTION:
    // If we exceed size, delete the first item in the Map (the oldest/least recently used)
    if (cache.size > maxSize) {
      const oldestKey = cache.keys().next().value
      if (oldestKey !== undefined) {
        cache.delete(oldestKey)
      }
    }

    return result
  }
}

export function memoizeSync3_LRU<A1, A2, A3, R>(
  fn: (a1: A1, a2: A2, a3: A3) => R,
  keyMaker: (a1: A1, a2: A2, a3: A3) => string,
  maxSize: number = 20,
): (a1: A1, a2: A2, a3: A3) => R {
  const cache = new Map<string, R>()

  return (a1: A1, a2: A2, a3: A3) => {
    const key = keyMaker(a1, a2, a3)

    if (cache.has(key)) {
      const value = cache.get(key)!
      cache.delete(key)
      cache.set(key, value)
      return value
    }

    const result = fn(a1, a2, a3)
    cache.set(key, result)

    if (cache.size > maxSize) {
      const oldestKey = cache.keys().next().value
      if (oldestKey !== undefined) cache.delete(oldestKey)
    }

    return result
  }
}

export function memoizeSync3_Booleans<R>(
  fn: (a1: boolean, a2: boolean, a3: boolean) => R,
): (a1: boolean, a2: boolean, a3: boolean) => R {
  // We only need an array of size 8 for all boolean combinations
  const cache: (R | undefined)[] = new Array(8)

  return (a1: boolean, a2: boolean, a3: boolean): R => {
    // Create a key from 0-7 using bitwise operators
    // a1=true -> 4, a2=true -> 2, a3=true -> 1
    const key = (a1 ? 4 : 0) | (a2 ? 2 : 0) | (a3 ? 1 : 0)

    const cached = cache[key]
    if (cached !== undefined) {
      return cached
    }

    const result = fn(a1, a2, a3)
    cache[key] = result
    return result
  }
}
