import { useCallback, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAnkiSettings } from './useAnkiSettings'
import { useAnkiRoute } from './useAnkiRoute'
import { type DictionaryLanguage } from '../../types'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { stringToDictionaryLanguageOrThrow } from '../../types'

export const useAnkiNavigation = () => {
  const [location, setLocation] = useLocation()

  const { urlLanguage, selectedId } = useAnkiRoute()
  const { language: settingsLanguage, setLanguage: setSettingsLanguage } = useAnkiSettings()

  useEffect(() => {
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

  useEffect(() => {
    const relativeLocation = location.replace(/^\/?anki/, '')
    const match = relativeLocation.match(/^\/?([^/]+)?(?:\/([^/]+))?$/)
    const langStr = match?.[1]

    if (!langStr && urlLanguage) {
      setLocation(`/anki/${urlLanguage}`, { replace: true })
    }
  }, [location, urlLanguage, setLocation])

  const navigateToLanguage = useCallback(
    (lang: DictionaryLanguage) => {
      setLocation(`/anki/${lang}`)
    },
    [setLocation],
  )

  const navigateToWord = useCallback(
    (word: NonEmptyStringTrimmed, lang: DictionaryLanguage = settingsLanguage) => {
      const targetPath = `/anki/${lang}/${encodeURIComponent(word)}`

      if (lang === urlLanguage) {
        setLocation(targetPath, { replace: true })
      } else {
        setLocation(targetPath)
      }
    },
    [setLocation, settingsLanguage, urlLanguage],
  )

  const exitAnki = useCallback(() => {
    setLocation(`~/${settingsLanguage}`)
  }, [setLocation, settingsLanguage])

  return {
    urlLanguage,
    selectedId,
    navigateToLanguage,
    navigateToWord,
    exitAnki,
  }
}

// export const useAnkiAutoRedirect = (
//   allFavorites_splitted: NonEmptyRecord<DictionaryLanguage, NonEmptyArray<FavoriteItem> | undefined> | undefined,
// ) => {
//   const [location, setLocation] = useLocation()
//   const { urlLanguage, selectedId, isSessionFinished } = useAnkiRoute()
//   const pulseStore = useAnkiPulseStore()
//   const now = useSyncExternalStore(pulseStore.subscribe, pulseStore.getSnapshot)

//   console.log('useAnkiAutoRedirect', { location, selectedId, isSessionFinished, allFavorites_splitted })

//   useEffect(() => {
//     if (location === `/` && !selectedId && !isSessionFinished && allFavorites_splitted) {
//       console.log('trying to select first due')
//       const favoritesForLang = allFavorites_splitted[urlLanguage]
//       console.log('favoritesForLang', favoritesForLang)

//       if (favoritesForLang) {
//         const nextDueItem = favoritesForLang.find(item => item.due <= now)
//         console.log('nextDueItem', nextDueItem)

//         if (nextDueItem) {
//           setLocation(`/anki/${urlLanguage}/${encodeURIComponent(nextDueItem.word)}`, { replace: true })
//         }
//       }
//     }
//   }, [urlLanguage, selectedId, isSessionFinished, allFavorites_splitted, now, setLocation])
// }
