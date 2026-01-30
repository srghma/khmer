import {
  isEnumValue,
  stringToEnumOrThrow,
  stringToEnumOrUndefined,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/enum'

// ==========================================
// DictionaryLanguage
// ==========================================

export const DICTIONARY_LANGUAGES = ['en', 'km', 'ru'] as const

export type DictionaryLanguage = (typeof DICTIONARY_LANGUAGES)[number]

export function isDictionaryLanguage(value: string): value is DictionaryLanguage {
  return isEnumValue(value, DICTIONARY_LANGUAGES)
}

export function stringToDictionaryLanguageOrUndefined(value: string): DictionaryLanguage | undefined {
  return stringToEnumOrUndefined(value, DICTIONARY_LANGUAGES)
}

export function stringToDictionaryLanguageOrThrow(value: string): DictionaryLanguage {
  return stringToEnumOrThrow(value, DICTIONARY_LANGUAGES, 'DictionaryLanguage')
}

// ==========================================
// Tab_NonLanguage
// ==========================================

export const APP_TAB_NON_LANGUAGES = ['history', 'favorites', 'settings'] as const

export type AppTab_NonLanguage = (typeof APP_TAB_NON_LANGUAGES)[number]

export function isAppTabNonLanguage(value: string): value is AppTab_NonLanguage {
  return isEnumValue(value, APP_TAB_NON_LANGUAGES)
}

// ==========================================
// Tab (Union)
// ==========================================

export const APP_TABS = [...DICTIONARY_LANGUAGES, ...APP_TAB_NON_LANGUAGES] as const

export type AppTab = DictionaryLanguage | AppTab_NonLanguage

export function isAppTab(value: string): value is AppTab {
  return isDictionaryLanguage(value) || isAppTabNonLanguage(value)
}

export function stringToAppTabOrUndefined(value: string): AppTab | undefined {
  return stringToEnumOrUndefined(value, APP_TABS)
}

export function stringToAppTabOrThrow(value: string): AppTab {
  return stringToEnumOrThrow(value, APP_TABS, 'AppTab')
}

// ==========================================
// EnglishKhmerCom_Images_Mode
// ==========================================

export const ENGLISH_KHMER_COM_IMAGES_MODES = ['online', 'offline'] as const

export type EnglishKhmerCom_Images_Mode = (typeof ENGLISH_KHMER_COM_IMAGES_MODES)[number]

export function isEnglishKhmerComImagesMode(value: string): value is EnglishKhmerCom_Images_Mode {
  return isEnumValue(value, ENGLISH_KHMER_COM_IMAGES_MODES)
}

export function stringToEnglishKhmerComImagesModeOrUndefined(value: string): EnglishKhmerCom_Images_Mode | undefined {
  return stringToEnumOrUndefined(value, ENGLISH_KHMER_COM_IMAGES_MODES)
}

export function stringToEnglishKhmerComImagesModeOrThrow(value: string): EnglishKhmerCom_Images_Mode {
  return stringToEnumOrThrow(value, ENGLISH_KHMER_COM_IMAGES_MODES, 'EnglishKhmerCom_Images_Mode')
}
