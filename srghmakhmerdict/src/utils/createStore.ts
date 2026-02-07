// to use with useSyncExternalStore
export function createStore<T>(initial: T, eq: (x: T, y: T) => boolean) {
  let state = initial
  const listeners = new Set<() => void>()

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener)

      return () => listeners.delete(listener)
    },
    getSnapshot: () => state,
    set: (val: T) => {
      if (eq(val, state)) return
      state = val
      listeners.forEach(l => l())
    },
  }
}
