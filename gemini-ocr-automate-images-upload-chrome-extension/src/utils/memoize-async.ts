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

type MemoKey = string | number | symbol

// TODO: cache hsould not exceed N size
export function memoizeAsync1_simpleKey_throwIfInFly<T extends MemoKey, R>(
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
