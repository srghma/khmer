export function createBooleanStore() {
  let state = false
  const listeners = new Set<() => void>()

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener)

      return () => listeners.delete(listener)
    },
    getSnapshot: () => state,
    set: (val: boolean) => {
      state = val
      listeners.forEach(l => l())
    },
  }
}
