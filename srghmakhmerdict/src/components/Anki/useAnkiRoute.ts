import { useLocation } from 'wouter'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage, DICTIONARY_LANGUAGES } from '../../types'
import { useAnkiSettings } from './useAnkiSettings'

export type AnkiSettingsSubPage = 'import' | 'export'

export type AnkiRouteParams =
  | { t: 'word'; urlLanguage: DictionaryLanguage; selectedId: NonEmptyStringTrimmed | undefined }
  | { t: 'settings'; subPage: AnkiSettingsSubPage | undefined }

export const useAnkiRoute = (): AnkiRouteParams => {
  const [location] = useLocation()
  const { language: settingsLanguage } = useAnkiSettings()

  // Strip leading /anki prefix
  const relativeLocation = location.replace(/^\/anki/, '')

  // Handle /anki, /anki/, or empty after /anki
  if (!relativeLocation || relativeLocation === '/') {
    return {
      t: 'word',
      urlLanguage: settingsLanguage,
      selectedId: undefined,
    }
  }

  const pathParts = relativeLocation.split('/').filter(Boolean)
  const firstPart = pathParts[0]

  // Handle /anki/settings...
  if (firstPart === 'settings') {
    const sub = pathParts[1]

    if (sub === 'import') return { t: 'settings', subPage: 'import' }
    if (sub === 'export') return { t: 'settings', subPage: 'export' }

    // /anki/settings -> subPage undefined (Menu view on mobile)
    return { t: 'settings', subPage: undefined }
  }

  // Handle /anki/:lang/:word?
  const lang = DICTIONARY_LANGUAGES.find(l => l === firstPart)

  if (lang) {
    const rawWord = pathParts[1]
    const word = rawWord ? String_toNonEmptyString_orUndefined_afterTrim(decodeURIComponent(rawWord)) : undefined

    return { t: 'word', urlLanguage: lang, selectedId: word }
  }

  // Default fallback
  return {
    t: 'word',
    urlLanguage: settingsLanguage,
    selectedId: undefined,
  }
}
