import { useState, useEffect, useRef } from 'react'
import * as DictDb from '../db/dict'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { isKhmerWord, type TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { useToast } from '../providers/ToastProvider'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'

export type DictData = {
  en: NonEmptyStringTrimmed[]
  km: NonEmptyStringTrimmed[]
  km_setOfPureKhmerWords?: Set<TypedKhmerWord>
  ru: NonEmptyStringTrimmed[]
}

const dictDataInit: DictData = {
  en: [],
  km: [],
  ru: [],
}

export function useDictionaryData() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [dictData, setDictData] = useState<DictData>(dictDataInit)

  // 1. Add a ref to track if initialization has started
  // to ensure the initialization logic runs **only once** per component lifecycle, even in Strict Mode. We can use a `useRef` to track if we have already started the initialization.
  const initialized = useRef(false)

  useEffect(() => {
    // 2. Prevent double-invocation in Strict Mode
    if (initialized.current) return
    initialized.current = true

    const fetchWords = async () => {
      try {
        setLoading(true)

        // 1. Fetch EN
        console.log('getEnWords')
        const enWords = await DictDb.getEnWords()
        console.log('getEnWords finish', enWords.length)

        setDictData(prev => ({ ...prev, en: enWords }))

        // 2. Fetch KM
        const kmWords = await DictDb.getKmWords()

        setDictData(prev => ({ ...prev, km: kmWords }))
        const pureKm = kmWords.filter(isKhmerWord)

        setDictData(prev => ({ ...prev, km_setOfPureKhmerWords: new Set(pureKm) }))

        // 3. Fetch RU
        const ruWords = await DictDb.getRuWords()

        setDictData(prev => ({ ...prev, ru: ruWords }))
      } catch (e: any) {
        toast.error('Failed to load dictionary', e.message || 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    const init = async () => {
      // If not ready, wait for event
      const unlisten = await listen('db-initialized', () => {
        console.log('DB Initialized Event Received')
        toast.info('DB Initialized Event Received')
        fetchWords()
      })

      try {
        const isReady = await invoke<boolean>('is_db_ready')

        if (isReady) {
          unlisten()
          await fetchWords()

          return
        }
      } catch (e: any) {
        console.warn('Could not check db status', e)
        toast.warn('Could not check db status', e.message)
      }

      const unlistenError = await listen<string>('db-error', evt => {
        toast.error('Database Error', evt.payload)
        setLoading(false)
      })

      return () => {
        unlisten()
        unlistenError()
      }
    }

    const cleanupPromise = init()

    return () => {
      cleanupPromise.then(fn => fn && fn())
      // Note: We do NOT reset initialized.current = false here.
      // We want it to persist across the immediate remount of Strict Mode.
    }
  }, [])

  return { loading, dictData }
}
