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
