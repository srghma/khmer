import { type DictionaryLanguage } from '../types'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

/**
 * Determines dictionary mode based on the script of the text.
 */
export const detectModeFromText = (text: NonEmptyStringTrimmed): DictionaryLanguage | undefined => {
  if (/\p{Script=Khmer}/u.test(text)) return 'km'
  if (/\p{Script=Cyrillic}/u.test(text)) return 'ru'
  if (/[a-zA-Z]/.test(text)) return 'en'
}
