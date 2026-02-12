import React, { createContext, useContext, useMemo } from 'react'
import { createPulseStore, type PulseStore } from '../../utils/createPulseStore'

const AnkiPulseContext = createContext<PulseStore | null>(null)

export const AnkiPulseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Create a store that ticks every 60 seconds (sufficient for "minutes" resolution)
  const store = useMemo(() => createPulseStore(60000), [])

  return <AnkiPulseContext.Provider value={store}>{children}</AnkiPulseContext.Provider>
}

export const useAnkiPulseStore = () => {
  const store = useContext(AnkiPulseContext)

  if (!store) throw new Error('useAnkiPulseStore must be used within AnkiPulseProvider')

  return store
}
