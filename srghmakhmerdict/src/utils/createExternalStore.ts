export interface ReactExternalStore<T> {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => T
}

/**
 * Interface compatible with React's useSyncExternalStore
 */
export interface ExternalStore<T> extends ReactExternalStore<T> {
  replaceStateWith_emitOnlyIfDifferentRef: (val: T) => void
  mutateStateUsing_emitUnconditionally: (f: (oldState: T) => T) => void
}

export function createExternalStore<T>(initial: T): ExternalStore<T> {
  let state = initial
  const listeners = new Set<() => void>()

  const emit = () => {
    for (const l of listeners) l()
  }

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => state,
    replaceStateWith_emitOnlyIfDifferentRef: (val: T) => {
      if (Object.is(val, state)) return
      state = val
      emit()
    },
    mutateStateUsing_emitUnconditionally: (f: (oldState: T) => T) => {
      const new_: T = f(state)

      state = new_
      emit()
    },
  }
}
