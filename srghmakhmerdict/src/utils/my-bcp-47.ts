import {
  isEnumValue,
  stringToEnumOrUndefined,
  stringToEnumOrThrow,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/enum'
import type { DictionaryLanguage } from '../types'
import type { ToTranslateLanguage } from './googleTranslate/toTranslateLanguage'

// TODO: use https://github.com/zhangfisher/bcp47-language-tags/blob/master/src/types.ts ?

export const BCP47_LANGUAGE_TAG_NAMES = ['km-KH', 'ru-RU', 'en-US', 'uk-UA'] as const

export type BCP47LanguageTagName = (typeof BCP47_LANGUAGE_TAG_NAMES)[number]

export function isBCP47LanguageTagName(value: string): value is BCP47LanguageTagName {
  return isEnumValue(value, BCP47_LANGUAGE_TAG_NAMES)
}

export function stringToBCP47LanguageTagNameOrUndefined(value: string): BCP47LanguageTagName | undefined {
  return stringToEnumOrUndefined(value, BCP47_LANGUAGE_TAG_NAMES)
}

export function stringToBCP47LanguageTagNameOrThrow(value: string): BCP47LanguageTagName {
  return stringToEnumOrThrow(value, BCP47_LANGUAGE_TAG_NAMES, 'BCP47LanguageTagName')
}

export const map_ToTranslateLanguage_to_BCP47LanguageTagName: Record<ToTranslateLanguage, BCP47LanguageTagName> = {
  km: 'km-KH',
  ru: 'ru-RU',
  en: 'en-US',
  uk: 'uk-UA',
}

export const map_DictionaryLanguage_to_BCP47LanguageTagName: Record<DictionaryLanguage, BCP47LanguageTagName> =
  map_ToTranslateLanguage_to_BCP47LanguageTagName
