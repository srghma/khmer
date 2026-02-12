import { useLocation } from 'wouter'
import { useMemo } from 'react'
import { stringToDictionaryLanguageOrThrow, type DictionaryLanguage } from '../../types'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

export interface AnkiRouteParams {
  urlLanguage: DictionaryLanguage | undefined
  selectedId: NonEmptyStringTrimmed | undefined
  isSessionFinished: boolean
}

export const useAnkiRoute = (): AnkiRouteParams => {
  const [location] = useLocation()

  return useMemo(() => {
    // Regex matches:
    // /anki -> groups: [undefined, undefined]
    // /anki/en -> groups: ['en', undefined]
    // /anki/en/word -> groups: ['en', 'word']
    const match = location.match(/^\/anki(?:\/([^/]+))?(?:\/([^/]+))?$/)

    if (!match) {
      return {
        urlLanguage: undefined,
        selectedId: undefined,
        isSessionFinished: false,
      }
    }

    const langStr = match[1]
    const cardIdStr = match[2]

    const urlLanguage = langStr ? stringToDictionaryLanguageOrThrow(langStr) : undefined
    const isSessionFinished = cardIdStr === 'finished'
    const selectedId =
      cardIdStr && !isSessionFinished ? (decodeURIComponent(cardIdStr) as NonEmptyStringTrimmed) : undefined

    return {
      urlLanguage,
      selectedId,
      isSessionFinished,
    }
  }, [location])
}
