import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../types'
import { detectModeFromText } from '../utils/detectModeFromText'
import { useAppToast } from '../providers/ToastProvider'
import { unknown_to_errorMessage } from '../utils/errorMessage'

interface DeepLinkHandlerProps {
  setActiveTab: (tab: DictionaryLanguage) => void
  resetNavigation: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
}

export const useDeepLinkHandler = ({ setActiveTab, resetNavigation }: DeepLinkHandlerProps) => {
  const toast = useAppToast()

  useEffect(() => {
    // Helper to process the URL safely
    const handleUrl = (url: string | undefined) => {
      const SCHEME = 'srghmakhmerdict://'

      if (!url || !url.startsWith(SCHEME)) return

      try {
        // Remove scheme
        const path = url.substring(SCHEME.length)
        // Decode and strip query params/trailing slashes
        const rawWord = decodeURIComponent(path.split('?')[0] ?? '').replace(/\/$/, '')

        const word = String_toNonEmptyString_orUndefined_afterTrim(rawWord)

        if (word) {
          // Auto-detect language mode
          const targetMode: DictionaryLanguage = detectModeFromText(word) ?? 'en'

          // Execute navigation actions
          setActiveTab(targetMode)
          resetNavigation(word, targetMode)

          toast.success('Deep Link' as NonEmptyStringTrimmed, `Navigating to "${word}"` as NonEmptyStringTrimmed)
        }
      } catch (e: unknown) {
        toast.error(
          'Deep Link Error' as NonEmptyStringTrimmed,
          `Failed to open link: ${unknown_to_errorMessage(e)}` as NonEmptyStringTrimmed,
        )
      }
    }

    // Set up Tauri event listener
    const unlistenPromise = listen<string[]>('deep-link://new-url', event => {
      handleUrl(event.payload[0])
    })

    // Cleanup function
    return () => {
      unlistenPromise.then(unlisten => unlisten())
    }
  }, [setActiveTab, resetNavigation, toast])
}
