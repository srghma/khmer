import { useLocation } from 'wouter'
import { useMemo } from 'react'
import { stringToDictionaryLanguageOrThrow, type DictionaryLanguage } from '../../types'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useAnkiSettings } from './useAnkiSettings'

export interface AnkiRouteParams {
  urlLanguage: DictionaryLanguage
  selectedId: NonEmptyStringTrimmed | undefined
  isSessionFinished: boolean
}

export const useAnkiRoute = (): AnkiRouteParams => {
  const [location] = useLocation()
  const { language: settingsLanguage } = useAnkiSettings()

  return useMemo(() => {
    // Since we are likely in a nested route, but useLocation returns absolute path,
    // we should strip the /anki prefix if it exists to parse relative parts.
    const relativeLocation = location.replace(/^\/?anki/, '')

    // Match relative parts: /:lang?/:word?
    // Examples (relative):
    // '' or '/' -> lang: undefined, card: undefined
    // '/en' -> lang: en, card: undefined
    // '/en/word' -> lang: en, card: word
    const match = relativeLocation.match(/^\/?([^/]+)?(?:\/([^/]+))?$/)

    if (!match) {
      console.error('[useAnkiRoute] Invalid route format:', { location, relativeLocation })
      throw new Error(`Invalid Anki route format: ${location}`)
    }

    const langStr = match[1]
    const cardIdStr = match[2]

    let urlLanguage: DictionaryLanguage

    if (langStr) {
      urlLanguage = stringToDictionaryLanguageOrThrow(langStr)
    } else {
      // Fallback to settings if language is missing from URL
      urlLanguage = settingsLanguage
    }

    const isSessionFinished = cardIdStr === 'finished'
    const selectedId =
      cardIdStr && !isSessionFinished ? (decodeURIComponent(cardIdStr) as NonEmptyStringTrimmed) : undefined

    return {
      urlLanguage,
      selectedId,
      isSessionFinished,
    }
  }, [location, settingsLanguage])
}
