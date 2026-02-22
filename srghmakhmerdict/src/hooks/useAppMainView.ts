import { tryDecode } from '../utils/tryDecode'
import { useLocation } from 'wouter'
import { useMemo } from 'react'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import {
  stringToDictionaryLanguageOrThrow,
  stringToDictionaryLanguageOrUndefined,
  type AppTab,
  type DictionaryLanguage,
} from '../types'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { getUrlSearchParam, KHMER_ANALYZER_PARAM_TEXT } from '../utils/url-navigation'

const AppMainView__history_list = { type: 'history-list' } as const
const AppMainView__favorites_list = { type: 'favorites-list' } as const
const AppMainView__settings = { type: 'settings' } as const

export type AppMainView =
  | { type: 'history'; word: NonEmptyStringTrimmed; mode: DictionaryLanguage }
  | { type: 'favorites'; word: NonEmptyStringTrimmed; mode: DictionaryLanguage }
  | { type: 'dashboard'; word?: NonEmptyStringTrimmed; mode: DictionaryLanguage }
  | typeof AppMainView__history_list
  | typeof AppMainView__favorites_list
  | typeof AppMainView__settings
  | { type: 'about' }
  | { type: 'khmer-analyzer'; text?: NonEmptyStringTrimmed }

export const useAppMainView = () => {
  const [location] = useLocation()

  const currentView = useMemo((): AppMainView => {
    // 1. Special routes
    if (location === '/history') return AppMainView__history_list
    if (location === '/favorites') return AppMainView__favorites_list
    if (location === '/settings') return AppMainView__settings
    if (location === '/about') return { type: 'about' }

    if (location === '/khmer_analyzer') {
      const rawText = getUrlSearchParam(KHMER_ANALYZER_PARAM_TEXT)
      const text = String_toNonEmptyString_orUndefined_afterTrim(rawText || '')

      return { type: 'khmer-analyzer', text }
    }

    // 2. Explicit Detail routes: /{history,favorites}/{en,ru,km}/:word
    const detailListMatch = location.match(/^\/(history|favorites)\/(en|ru|km)\/(.+)$/)

    if (detailListMatch) {
      const type = detailListMatch[1] as 'history' | 'favorites'

      // Safe parsing of Language
      const modeStr = detailListMatch[2] ?? ''
      const mode = stringToDictionaryLanguageOrUndefined(modeStr)

      if (!mode) {
        // Fallback if language code is invalid
        return { type: 'dashboard', mode: 'en' }
      }

      // Safe parsing of Word
      const rawWord = tryDecode(detailListMatch[3] || '')
      const word = String_toNonEmptyString_orUndefined_afterTrim(rawWord)

      if (!word) {
        // If word is empty after trim, fallback to dashboard
        return { type: 'dashboard', mode: 'en' }
      }

      return { type, word, mode }
    }

    // 3. Standard Dashboard/Word routes: /en, /ru, /km, /en/:word, etc.
    const langMatch = location.match(/^\/(en|ru|km)(?:\/(.+))?$/)

    if (langMatch) {
      const mode = stringToDictionaryLanguageOrThrow(langMatch[1] ?? '')

      const rawWord = langMatch[2] ? tryDecode(langMatch[2]) : ''
      const word = String_toNonEmptyString_orUndefined_afterTrim(rawWord)

      return { type: 'dashboard', word, mode }
    }

    return { type: 'dashboard', mode: 'en' }
  }, [location])

  return currentView
}

export const useAppActiveTab = () => {
  const currentView = useAppMainView()

  return useMemo((): AppTab => {
    switch (currentView.type) {
      case 'history':
      case 'history-list':
        return 'history'
      case 'favorites':
      case 'favorites-list':
        return 'favorites'
      case 'settings':
      case 'about':
      case 'khmer-analyzer':
        return 'settings'
      case 'dashboard':
        return currentView.mode
      default:
        assertNever(currentView)
    }
  }, [currentView])
}
