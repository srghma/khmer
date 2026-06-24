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
  | { type: 'note-edit'; word: NonEmptyStringTrimmed; mode: DictionaryLanguage }
  | typeof AppMainView__history_list
  | typeof AppMainView__favorites_list
  | typeof AppMainView__settings
  | { type: 'about' }
  | { type: 'khmer-analyzer'; text?: NonEmptyStringTrimmed }

export const useAppMainView = () => {
  const [location] = useLocation()

  const currentView = useMemo((): AppMainView => {
    let result: AppMainView = { type: 'dashboard', mode: 'en' }

    // 1. Special routes
    if (location === '/history') result = AppMainView__history_list
    else if (location === '/favorites') result = AppMainView__favorites_list
    else if (location === '/settings') result = AppMainView__settings
    else if (location === '/about') result = { type: 'about' }
    else if (location === '/khmer_analyzer') {
      const rawText = getUrlSearchParam(KHMER_ANALYZER_PARAM_TEXT)
      const text = String_toNonEmptyString_orUndefined_afterTrim(rawText || '')

      result = { type: 'khmer-analyzer', text }
    } else if (location.startsWith('/notes/')) {
      const match = location.match(/^\/notes\/(en|ru|km)\/(.+)$/)

      if (match) {
        const mode = stringToDictionaryLanguageOrThrow(match[1] ?? '')
        const rawWord = tryDecode(match[2] || '')
        const word = String_toNonEmptyString_orUndefined_afterTrim(rawWord)

        if (word) {
          result = { type: 'note-edit', word, mode }
        }
      }
    } else {
      // 2. Explicit Detail routes: /{history,favorites}/{en,ru,km}/:word
      const detailListMatch = location.match(/^\/(history|favorites)\/(en|ru|km)\/(.+)$/)

      if (detailListMatch) {
        const type = detailListMatch[1] as 'history' | 'favorites'
        const modeStr = detailListMatch[2] ?? ''
        const mode = stringToDictionaryLanguageOrUndefined(modeStr)

        if (!mode) {
          result = { type: 'dashboard', mode: 'en' }
        } else {
          const rawWord = tryDecode(detailListMatch[3] || '')
          const word = String_toNonEmptyString_orUndefined_afterTrim(rawWord)

          if (!word) {
            result = { type: 'dashboard', mode: 'en' }
          } else {
            result = { type, word, mode }
          }
        }
      } else {
        // 3. Standard Dashboard/Word routes: /en, /ru, /km, /en/:word, etc.
        const langMatch = location.match(/^\/(en|ru|km)(?:\/(.+))?$/)

        if (langMatch) {
          const mode = stringToDictionaryLanguageOrThrow(langMatch[1] ?? '')
          const rawWord = langMatch[2] ? tryDecode(langMatch[2]) : ''
          const word = String_toNonEmptyString_orUndefined_afterTrim(rawWord)

          result = { type: 'dashboard', word, mode }
        } else {
          result = { type: 'dashboard', mode: 'en' }
        }
      }
    }

    return result
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
      case 'note-edit':
        return currentView.mode
      case 'dashboard':
        return currentView.mode
      default:
        assertNever(currentView)
    }
  }, [currentView])
}
