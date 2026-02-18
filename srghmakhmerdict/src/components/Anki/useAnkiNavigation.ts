import { useCallback } from 'react'
import { useLocation } from 'wouter'
import { type DictionaryLanguage } from '../../types'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useAnkiRoute } from './useAnkiRoute'
import { useAnkiSettings } from './useAnkiSettings'

export const useAnkiNavigation = () => {
  const [, setLocation] = useLocation()
  const route = useAnkiRoute()
  const { language: settingsLanguage } = useAnkiSettings()

  // Derive the current language from route (falls back to settings)
  const urlLanguage: DictionaryLanguage = route.t === 'word' ? route.urlLanguage : settingsLanguage
  const selectedId: NonEmptyStringTrimmed | undefined = route.t === 'word' ? route.selectedId : undefined

  const navigateToLanguage = useCallback(
    (lang: DictionaryLanguage) => {
      setLocation(`~/anki/${lang}`)
    },
    [setLocation],
  )

  const navigateToWord = useCallback(
    (wordId: NonEmptyStringTrimmed) => {
      setLocation(`~/anki/${urlLanguage}/${wordId}`)
    },
    [setLocation, urlLanguage],
  )

  const exitAnki = useCallback(() => {
    setLocation(`~/${settingsLanguage}`)
  }, [setLocation, settingsLanguage])

  const navigateToImport = useCallback(() => {
    setLocation(`~/anki/settings/import`)
  }, [setLocation])

  const navigateToExport = useCallback(() => {
    setLocation(`~/anki/settings/export`)
  }, [setLocation])

  const navigateToSettings = useCallback(() => {
    // Navigates to root settings (Menu)
    setLocation(`~/anki/settings`)
  }, [setLocation])

  return {
    route,
    urlLanguage,
    selectedId,
    navigateToLanguage,
    navigateToWord,
    exitAnki,
    navigateToImport,
    navigateToExport,
    navigateToSettings,
  }
}
