import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useRef, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useHistory } from '../providers/HistoryProvider'
import { useAppToast } from '../providers/ToastProvider'
import type { DictionaryLanguage } from '../types'
import { unknown_to_errorMessage } from '../utils/errorMessage'

export const useAddToHistoryEffect = () => {
  const [location] = useLocation()
  const { addToHistory } = useHistory()
  const toast = useAppToast()
  const lastAddedToHistoryRef = useRef<string | null>(null)

  useEffect(() => {
    const langMatch = location.match(/^\/(en|ru|km)\/(.+)$/)

    if (langMatch) {
      const mode = langMatch[1] as DictionaryLanguage
      const word = decodeURIComponent(langMatch[2] || '') as NonEmptyStringTrimmed

      const key = `${mode}:${word}`

      if (lastAddedToHistoryRef.current === key) {
        return
      }

      // console.log('[Router Debug] Adding to history:', key)
      lastAddedToHistoryRef.current = key

      addToHistory(word, mode).catch(e => {
        // console.error('[Router Debug] History Error:', e)
        toast.error('Error adding to history' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
        lastAddedToHistoryRef.current = null
      })
    }
  }, [location, addToHistory, toast])
}
