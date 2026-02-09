export interface PulseStore {
  subscribe: (onStoreChange: () => void) => () => void
  getSnapshot: () => number // not used
}

/**
 * Creates a store that holds the current timestamp (Date.now()).
 * The internal timer only runs while there are active subscribers.
 *
 * @param tickMs - How often to update the timestamp (e.g. 10s to make 4 buttons for example update every 4 seconds)
 */
export function createPulseStore(tickMs: number): PulseStore {
  let now = Date.now()
  const listeners = new Set<() => void>()
  let intervalId: ReturnType<typeof setInterval> | null = null

  return {
    subscribe: (onStoreChange: () => void) => {
      listeners.add(onStoreChange)

      // Start the timer only when the first listener joins
      if (!intervalId) {
        // Update 'now' immediately to sync all new components
        now = Date.now()
        intervalId = setInterval(() => {
          now = Date.now()
          listeners.forEach(l => l())
        }, tickMs)
      }

      return () => {
        listeners.delete(onStoreChange)
        // Stop the timer when the last listener leaves
        if (listeners.size === 0 && intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
      }
    },
    getSnapshot: () => now,
  }
}
