import { useLocation } from 'wouter'
import { useMemo } from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type AppTab, type DictionaryLanguage } from '../types'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'

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
  | { type: 'khmer-complex-table' }

export const useAppMainView = () => {
  const [location] = useLocation()

  const currentView = useMemo((): AppMainView => {
    // console.log('[Router Debug] useAppMainView location:', location)

    // 1. Special routes
    if (location === '/history') return AppMainView__history_list
    if (location === '/favorites') return AppMainView__favorites_list
    if (location === '/settings') return AppMainView__settings
    if (location === '/about') return { type: 'about' }
    if (location === '/khmer_complex_table') return { type: 'khmer-complex-table' }

    const analyzerMatch = location.match(/^\/khmer_analyzer(?:\/(.+))?$/)

    if (analyzerMatch) {
      const text = analyzerMatch[1] ? (decodeURIComponent(analyzerMatch[1]) as NonEmptyStringTrimmed) : undefined

      return { type: 'khmer-analyzer', text }
    }

    // 2. Explicit Detail routes: /{history,favorites}/{en,ru,km}/:word
    const detailListMatch = location.match(/^\/(history|favorites)\/(en|ru|km)\/(.+)$/)

    if (detailListMatch) {
      // console.log('[Router Debug] Matched Detail List Regex:', detailListMatch)
      const type = detailListMatch[1] as 'history' | 'favorites'
      const mode = detailListMatch[2] as DictionaryLanguage
      const word = decodeURIComponent(detailListMatch[3] || '') as NonEmptyStringTrimmed

      return { type, word, mode }
    }

    // 3. Standard Dashboard/Word routes: /en, /ru, /km, /en/:word, etc.
    const langMatch = location.match(/^\/(en|ru|km)(?:\/(.+))?$/)

    if (langMatch) {
      // console.log('[Router Debug] Matched Language/Dashboard Regex:', langMatch)
      const mode = langMatch[1] as DictionaryLanguage
      const word = langMatch[2] ? (decodeURIComponent(langMatch[2]) as NonEmptyStringTrimmed) : undefined

      return { type: 'dashboard', word, mode }
    }

    // console.log('[Router Debug] No match, fallback to Dashboard')

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
      case 'khmer-complex-table':
        return 'settings'
      case 'dashboard':
        return currentView.mode
      default:
        assertNever(currentView)
    }
  }, [currentView])
}
