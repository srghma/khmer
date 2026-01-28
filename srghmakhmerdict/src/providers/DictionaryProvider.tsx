import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { DictData } from '../initDictionary'

type LoadingStage = 'initializing_db' | 'loading_data' | 'ready' | 'error'

// type DictionaryContextType = {
//   dictData: DictData | undefined
//   // loading: boolean
//   // stage: LoadingStage
// }

const DictionaryContext = createContext<DictData | undefined>(undefined)

type DictionaryProviderProps = {
  // Promise that resolves (when DB is ready) to a function returning the data Promise
  initPromise: Promise<() => Promise<DictData>>
  children: ReactNode
}

export function DictionaryProvider({ initPromise, children }: DictionaryProviderProps) {
  const [dictData, setDictData] = useState<DictData | undefined>()
  const [stage, setStage] = useState<LoadingStage>('initializing_db')
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        // Phase 1: Waiting for DB connection
        if (mounted) setStage('initializing_db')
        // console.log('Provider: Waiting for DB...')

        const getDataPromise = await initPromise

        // Phase 2: DB is ready, waiting for SQL queries
        if (mounted) setStage('loading_data')
        // console.log('Provider: DB Ready. Waiting for data...')

        const data = await getDataPromise()

        // Phase 3: Done
        if (mounted) {
          setDictData(data)
          setStage('ready')
          // console.log('Provider: Ready')
        }
      } catch (err: any) {
        if (mounted) {
          // console.error('Provider Error:', err)
          setError(err instanceof Error ? err : new Error(String(err)))
          setStage('error')
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [initPromise])

  // Error State UI
  if (stage === 'error' && error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-5 text-center font-sans">
        <h1 className="text-red-500 mb-4 text-2xl font-bold">❌ Failed to Initialize</h1>
        <p className="text-gray-500 max-w-lg mb-6">{error.message || 'Unknown error'}</p>
        <button
          className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    )
  }

  // Optional: Loading State UI (Full screen blocking)
  // You can remove this if you want the App to handle the loading UI via the hook
  if (stage !== 'ready') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-content1 text-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
        <h2 className="text-xl font-semibold">
          {stage === 'initializing_db' ? 'Connecting to Database...' : 'Loading Dictionary...'}
        </h2>
      </div>
    )
  }

  return (
    <DictionaryContext.Provider
      value={dictData}
      // dictData,
      // loading: stage !== 'ready',
      // stage
      // }}
    >
      {children}
    </DictionaryContext.Provider>
  )
}

export function useDictionary() {
  const context = useContext(DictionaryContext)

  if (context === undefined) throw new Error('useDictionary must be used within a DictionaryProvider')

  return context
}
