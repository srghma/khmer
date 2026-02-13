import { useCallback, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAnkiSettings } from './useAnkiSettings'
import { useAnkiRoute } from './useAnkiRoute'
import { type DictionaryLanguage } from '../../types'
import { type FavoriteItem } from '../../db/favorite/item'
import { type NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { type NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useAnkiPulseStore } from './AnkiPulseContext'
import { useSyncExternalStore } from 'react'
import { stringToDictionaryLanguageOrThrow } from '../../types'

export const useAnkiNavigation = (
  allFavorites_splitted: NonEmptyRecord<DictionaryLanguage, NonEmptyArray<FavoriteItem> | undefined> | undefined
) => {
  const [location, setLocation] = useLocation()

  // urlLanguage is now strictly DictionaryLanguage (from URL or fallback to settings)
  const { urlLanguage, selectedId, isSessionFinished } = useAnkiRoute()
  const { language: settingsLanguage, setLanguage: setSettingsLanguage } = useAnkiSettings()

  const pulseStore = useAnkiPulseStore()
  const now = useSyncExternalStore(pulseStore.subscribe, pulseStore.getSnapshot)

  // 1. Sync Logic:
  // If the actual URL has a language that is different from settings, update settings.
  useEffect(() => {
    // Strip prefix to find language
    const relativeLocation = location.replace(/^\/?anki/, '')
    const match = relativeLocation.match(/^\/?([^/]+)?(?:\/([^/]+))?$/)
    const langStr = match?.[1]

    if (langStr) {
      try {
        const lang = stringToDictionaryLanguageOrThrow(langStr)
        if (lang !== settingsLanguage) {
          setSettingsLanguage(lang)
        }
      } catch (e) {
        // ignore invalid lang in URL
      }
    }
  }, [location, settingsLanguage, setSettingsLanguage])

  // 2. Redirect Logic: Handle /anki (no lang) -> /anki/:lang
  useEffect(() => {
    // Check if URL is missing language segment
    const relativeLocation = location.replace(/^\/?anki/, '')
    const match = relativeLocation.match(/^\/?([^/]+)?(?:\/([^/]+))?$/)
    const langStr = match?.[1]

    if (!langStr && urlLanguage) {
      console.log('[useAnkiNavigation] No URL language in path, redirecting to resolved language:', urlLanguage)
      setLocation(`/anki/${urlLanguage}`, { replace: true })
    }
  }, [location, urlLanguage, setLocation])

  // 3. Redirect Logic: Handle /anki/:lang (no word) -> /anki/:lang/:dueWord
  useEffect(() => {
    if (!selectedId && !isSessionFinished && allFavorites_splitted) {
      const favoritesForLang = allFavorites_splitted[urlLanguage]

      if (favoritesForLang) {
        // Find the first due word
        const nextDueItem = favoritesForLang.find(item => item.due <= now)

        if (nextDueItem) {
          console.log('[useAnkiNavigation] Found due word, redirecting:', nextDueItem.word)
          setLocation(`/anki/${urlLanguage}/${encodeURIComponent(nextDueItem.word)}`, { replace: true })
        }
      }
    }
  }, [urlLanguage, selectedId, isSessionFinished, allFavorites_splitted, now, setLocation])

  // 4. Navigation Actions
  const navigateToLanguage = useCallback((lang: DictionaryLanguage) => {
    setLocation(`/anki/${lang}`)
  }, [setLocation])

  const navigateToWord = useCallback((word: NonEmptyStringTrimmed, lang: DictionaryLanguage = settingsLanguage) => {
    const targetPath = `/anki/${lang}/${encodeURIComponent(word)}`

    // If we remain in the same language, REPLACE the history entry
    if (lang === urlLanguage) {
      setLocation(targetPath, { replace: true })
    } else {
      setLocation(targetPath)
    }
  }, [setLocation, settingsLanguage, urlLanguage])

  const navigateToFinished = useCallback((lang: DictionaryLanguage = settingsLanguage) => {
    setLocation(`/anki/${lang}/finished`, { replace: true })
  }, [setLocation, settingsLanguage])

  const exitAnki = useCallback(() => {
    setLocation(`~/${settingsLanguage}`)
  }, [setLocation, settingsLanguage])

  return {
    urlLanguage,
    selectedId,
    isSessionFinished,
    navigateToLanguage,
    navigateToWord,
    navigateToFinished,
    exitAnki
  }
}
