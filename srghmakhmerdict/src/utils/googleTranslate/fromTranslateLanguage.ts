import {
  stringToEnumOrUndefinedUsingCustomChecker,
  stringToEnumOrThrowUsingCustomChecker,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/enum'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import {
  isToTranslateLanguage,
  ToTranslateLanguage_codeNameRecord,
  type ToTranslateLanguage,
} from './toTranslateLanguage'

// ==========================================
// From
// ==========================================

export type FromTranslateLanguage = ToTranslateLanguage | 'auto'

export function isFromTranslateLanguage(value: string): value is FromTranslateLanguage {
  return value === 'auto' || isToTranslateLanguage(value)
}

export function stringFromFromTranslateLanguageOrUndefined(value: string): FromTranslateLanguage | undefined {
  return stringToEnumOrUndefinedUsingCustomChecker(value, isFromTranslateLanguage)
}

export function stringFromFromTranslateLanguageOrThrow(value: string): FromTranslateLanguage {
  return stringToEnumOrThrowUsingCustomChecker(value, isFromTranslateLanguage, 'FromTranslateLanguage')
}

export const getTranslateLanguageName = (code: FromTranslateLanguage): NonEmptyStringTrimmed =>
  code === 'auto'
    ? ('Auto-detect' as NonEmptyStringTrimmed)
    : (ToTranslateLanguage_codeNameRecord[code] as NonEmptyStringTrimmed)
