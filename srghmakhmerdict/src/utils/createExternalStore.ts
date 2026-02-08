/**
 * Interface compatible with React's useSyncExternalStore
 */
export interface ExternalStore<T> {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => T
  set: (val: T) => void
}

export function createExternalStore<T>(initial: T, eq: (x: T, y: T) => boolean): ExternalStore<T> {
  let state = initial
  const listeners = new Set<() => void>()

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => state,
    set: (val: T) => {
      if (eq(val, state)) return
      state = val
      listeners.forEach(l => l())
    },
  }
}
