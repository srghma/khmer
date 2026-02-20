import { useState, useEffect, useCallback } from 'react'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { detectModeFromText } from '../../utils/detectModeFromText'
import type { ToTranslateLanguage } from '../../utils/googleTranslate/toTranslateLanguage'

export const useSmartTargetLanguage = (text: string, initialTarget: ToTranslateLanguage) => {
  const [targetLang, setTargetLangState] = useState<ToTranslateLanguage>(initialTarget)
  const [isManualOverride, setIsManualOverride] = useState(false)

  // Wrapper for setting language manually
  const setTargetLangManual = useCallback((lang: ToTranslateLanguage) => {
    setTargetLangState(lang)
    setIsManualOverride(true)
  }, [])

  useEffect(() => {
    const trimmed = text.trim()

    // If text is cleared, reset the manual override flag
    if (!trimmed) {
      setIsManualOverride(false)

      return
    }

    // If the user manually picked a language, don't change it while they are typing
    if (isManualOverride) return

    const mode = detectModeFromText(trimmed as NonEmptyStringTrimmed)

    if (mode === 'km') {
      // If typing Khmer, target should usually be English (non-Khmer)
      if (targetLang === 'km') {
        setTargetLangState('en')
      }
    } else if (mode === 'en' || mode === 'ru' || mode === 'uk') {
      // If typing non-Khmer scripts, target should be Khmer
      if (targetLang !== 'km') {
        setTargetLangState('km')
      }
    }
  }, [text, isManualOverride, targetLang])

  return [targetLang, setTargetLangManual] as const
}
