import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import type { AppToast } from '../providers/ToastProvider'
import type { TranslationFunctions } from '../i18n/i18n-types'
import type { KhmerWordsMap } from '../db/dict'
import type { NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import { detectModeFromText } from './detectModeFromText'

export const KHMER_ANALYZER_PATH = '/khmer_analyzer'
export const KHMER_ANALYZER_PARAM_TEXT = 'text'

/**
 * Constructs the URL for the Khmer Analyzer with the text encoded as a query parameter.
 * Handles encoding and sanitization.
 */
export const makeKhmerAnalyzerUrl = (text: string | undefined | null): string => {
  if (!text || !text.trim()) {
    return KHMER_ANALYZER_PATH
  }

  const params = new URLSearchParams()

  params.set(KHMER_ANALYZER_PARAM_TEXT, text.trim())

  return `${KHMER_ANALYZER_PATH}?${params.toString()}`
}

/**
 * Safe helper to get a specific search param from the window location
 */
export const getUrlSearchParam = (key: string): string | null => {
  const params = new URLSearchParams(window.location.search)

  return params.get(key)
}

export const setLocation_khmerWord_ifInDictionary = (
  word: NonEmptyStringTrimmed,
  km_map: KhmerWordsMap,
  toast: AppToast,
  setLocation: (path: string) => void,
  LL: TranslationFunctions,
): boolean => {
  if (km_map.has(word as TypedContainsKhmer)) {
    setLocation(`~/km/${encodeURIComponent(word)}`)

    return true
  } else {
    toast.error(LL.ANALYZER.WORD_NOT_IN_KHMER_DICTIONARY({ word }))

    return false
  }
}

export const setLocation_enWord_ifInDictionary = (
  word: NonEmptyStringTrimmed,
  en: NonEmptySet<NonEmptyStringTrimmed>,
  toast: AppToast,
  setLocation: (path: string) => void,
  LL: TranslationFunctions,
): boolean => {
  if (en.has(word)) {
    setLocation(`~/en/${encodeURIComponent(word)}`)

    return true
  } else {
    toast.error(LL.ANALYZER.WORD_NOT_IN_ENGLISH_DICTIONARY({ word }))

    return false
  }
}

export const setLocation_ruWord_ifInDictionary = (
  word: NonEmptyStringTrimmed,
  ru: NonEmptySet<NonEmptyStringTrimmed>,
  toast: AppToast,
  setLocation: (path: string) => void,
  LL: TranslationFunctions,
): boolean => {
  if (ru.has(word)) {
    setLocation(`~/ru/${encodeURIComponent(word)}`)

    return true
  } else {
    toast.error(LL.ANALYZER.WORD_NOT_IN_RUSSIAN_DICTIONARY({ word }))

    return false
  }
}

export const setLocation_enOrKmOrRuWord_ifInDictionary_detectModeFromText = (
  word: NonEmptyStringTrimmed,
  km_map: KhmerWordsMap,
  en: NonEmptySet<NonEmptyStringTrimmed>,
  ru: NonEmptySet<NonEmptyStringTrimmed>,
  toast: AppToast,
  setLocation: (path: string) => void,
  LL: TranslationFunctions,
): boolean => {
  const targetMode = detectModeFromText(word)

  if (!targetMode) {
    toast.error('Cannot detect language of the word' as NonEmptyStringTrimmed)

    return false
  }

  switch (targetMode) {
    case 'km':
      return setLocation_khmerWord_ifInDictionary(word, km_map, toast, setLocation, LL)
    case 'en':
      return setLocation_enWord_ifInDictionary(word, en, toast, setLocation, LL)
    case 'ru':
      return setLocation_ruWord_ifInDictionary(word, ru, toast, setLocation, LL)
  }
}
