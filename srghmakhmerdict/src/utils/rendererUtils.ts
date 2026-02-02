import { type DictionaryLanguage } from '../types'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

/**
 * Determines dictionary mode based on the script of the text.
 */
export const detectModeFromText = (
  text: NonEmptyStringTrimmed,
  currentMode: DictionaryLanguage,
): DictionaryLanguage => {
  if (/\p{Script=Khmer}/u.test(text)) return 'km'
  if (/\p{Script=Cyrillic}/u.test(text)) return 'ru'
  if (/[a-zA-Z]/.test(text)) return 'en'

  return currentMode
}

/**
 * Parses a Wiki HREF to extract the search term.
 * e.g., "/wiki/Hello#Etymology" -> "Hello"
 */
export const extractWikiTerm = (href: string): NonEmptyStringTrimmed | undefined => {
  const rawPath = href.replace(/^\/wiki\//, '').split('#')[0] ?? ''

  try {
    const decoded = decodeURIComponent(rawPath)

    return String_toNonEmptyString_orUndefined_afterTrim(decoded)
  } catch {
    return undefined
  }
}
