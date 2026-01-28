import { useState, useEffect } from 'react'
import { type ValidNonNegativeInt, strToNonNegativeIntOrUndefined_strict } from './utils/toNumber'

// LocalStorageApi type definition
export type LocalStorageApi = {
  get: () => ValidNonNegativeInt
  set: (val: ValidNonNegativeInt) => void
}

// Factory function to create LocalStorageApi for a specific key
const mkLocalStorageApi = (key: string, defaultValue: ValidNonNegativeInt): LocalStorageApi => ({
  get: () => {
    const val = localStorage.getItem(key)
    const val_ = val ? strToNonNegativeIntOrUndefined_strict(val) : undefined
    if (val_ === undefined) return defaultValue
    return val_
  },
  set: (val: ValidNonNegativeInt) => {
    localStorage.setItem(key, val.toString())
  },
})

// Create the specific APIs for StartNum and PageCount
export const startNum_LocalStorageApi = mkLocalStorageApi('OCR_START_NUM', 100 as ValidNonNegativeInt)
export const pageCount_LocalStorageApi = mkLocalStorageApi('OCR_PAGE_COUNT', 1 as ValidNonNegativeInt)

// Custom hook to sync state with localStorage
export function useLocalStorageState(
  storageApi: LocalStorageApi,
): [ValidNonNegativeInt, (val: ValidNonNegativeInt) => void] {
  const [state, setState] = useState<ValidNonNegativeInt>(storageApi.get())

  useEffect(() => {
    storageApi.set(state) // Sync state to localStorage when it changes
  }, [state, storageApi])

  return [state, setState]
}
