export function memoizeAsync0_throwIfInFly<R>(fn: () => Promise<R>): () => Promise<R> {
  let cached: R | undefined
  let hasValue = false
  let inFlight = false

  return async () => {
    if (hasValue) {
      return cached as R
    }

    if (inFlight) {
      throw new Error('memoizeAsync0: function is already in progress')
    }

    inFlight = true
    try {
      const result = await fn()
      cached = result
      hasValue = true
      return result
    } finally {
      inFlight = false
    }
  }
}

export function memoizeAsync0_cachePromise<R>(fn: () => Promise<R>): () => Promise<R> {
  let cached: Promise<R> | undefined

  return () => {
    if (cached) return cached

    cached = fn().catch(err => {
      // Evict on failure so it can retry
      cached = undefined
      throw err
    })

    return cached
  }
}

// TODO: cache should not exceed N size
export function memoizeAsync1_simpleKey_throwIfInFly<T extends PropertyKey, R>(
  fn: (arg: T) => Promise<R>,
): (arg: T) => Promise<R> {
  const cache = new Map<T, R>()
  const inFlight = new Set<T>()

  return async (arg: T) => {
    if (cache.has(arg)) {
      return cache.get(arg)!
    }

    if (inFlight.has(arg)) {
      throw new Error(`memoizeAsync1: function is already in progress for key "${String(arg)}"`)
    }

    inFlight.add(arg)
    try {
      const result = await fn(arg)
      cache.set(arg, result)
      return result
    } finally {
      inFlight.delete(arg)
    }
  }
}

export const memoizeAsync3_LRU_cachePromise__default_keyMaker = (a1: unknown, a2: unknown, a3: unknown) =>
  `${String(a1)}:${String(a2)}:${String(a3)}`

export function memoizeAsync3_LRU_cachePromise<A1, A2, A3, R>(
  fn: (a1: A1, a2: A2, a3: A3) => Promise<R>,
  /**
   * Function to generate a unique cache key from arguments.
   */
  keyMaker: (a1: A1, a2: A2, a3: A3) => string,
  /**
   * Maximum number of entries to keep in cache.
   * @default 20
   */
  maxSize: number = 20,
): (a1: A1, a2: A2, a3: A3) => Promise<R> {
  // Store Promises to handle concurrent requests for the same key efficiently
  const cache = new Map<string, Promise<R>>()

  return (a1: A1, a2: A2, a3: A3) => {
    const key = keyMaker(a1, a2, a3)

    if (cache.has(key)) {
      // LRU HIT:
      // Delete and re-set to mark as most recently used
      const promise = cache.get(key)!
      cache.delete(key)
      cache.set(key, promise)
      return promise
    }

    // MISS: Create Promise
    // We catch errors to evict failed promises so they can be retried later
    const promise = fn(a1, a2, a3).catch(err => {
      cache.delete(key) // Evict on failure
      throw err
    })

    // Add to cache
    cache.set(key, promise)

    // LRU EVICTION
    if (cache.size > maxSize) {
      const oldestKey = cache.keys().next().value
      if (oldestKey !== undefined) {
        cache.delete(oldestKey)
      }
    }

    return promise
  }
}

/**
 * Generic Async LRU Cache for Arity 1 functions.
 * Caches the Promise, not just the result, to handle in-flight deduplication.
 */
export function memoizeAsync1Lru<T, R>(
  fn: (arg: T) => Promise<R>,
  capacity: number,
  keySelector: (arg: T) => string,
): (arg: T) => Promise<R> {
  const cache = new Map<string, Promise<R>>()

  return (arg: T) => {
    const key = keySelector(arg)

    if (cache.has(key)) {
      // LRU: Delete and re-set to move to the end (most recently used)
      const promise = cache.get(key)!
      cache.delete(key)
      cache.set(key, promise)
      return promise
    }

    // Call function and cache the promise
    const promise = fn(arg)
    cache.set(key, promise)

    // Enforce Capacity: Delete first item (least recently used)
    if (cache.size > capacity) {
      const firstKey = cache.keys().next().value
      if (firstKey !== undefined) {
        cache.delete(firstKey)
      }
    }

    return promise
  }
}
