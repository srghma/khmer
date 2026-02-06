import {
  isEnumValue,
  stringToEnumOrUndefined,
  stringToEnumOrThrow,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/enum'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

export const COLORIZATION_MODE = ['segmenter', 'dictionary'] as const

export type ColorizationMode = (typeof COLORIZATION_MODE)[number]

export function isColorizationMode(value: string): value is ColorizationMode {
  return isEnumValue(value, COLORIZATION_MODE)
}

export function stringToColorizationModeOrUndefined(value: string): ColorizationMode | undefined {
  return stringToEnumOrUndefined(value, COLORIZATION_MODE)
}

export function stringToColorizationModeOrThrow(value: string): ColorizationMode {
  return stringToEnumOrThrow(value, COLORIZATION_MODE, 'ColorizationMode')
}

///////////////////////////

export const MAYBE_COLORIZATION_MODE = ['none', 'segmenter', 'dictionary'] as const

export type MaybeColorizationMode = (typeof MAYBE_COLORIZATION_MODE)[number]

export function isMaybeColorizationMode(value: string): value is MaybeColorizationMode {
  return isEnumValue(value, MAYBE_COLORIZATION_MODE)
}

export function stringToMaybeColorizationModeOrUndefined(value: string): MaybeColorizationMode | undefined {
  return stringToEnumOrUndefined(value, MAYBE_COLORIZATION_MODE)
}

export function stringToMaybeColorizationModeOrThrow(value: string): MaybeColorizationMode {
  return stringToEnumOrThrow(value, MAYBE_COLORIZATION_MODE, 'MaybeColorizationMode')
}

//////////////////////////////

export const KHMER_FONT_NAME = ['Default', 'Moul', 'Siemreap', 'Battambang', 'Kantumruy', 'Fasthand'] as const

export type KhmerFontName = (typeof KHMER_FONT_NAME)[number]

export function isKhmerFontName(value: string): value is KhmerFontName {
  return isEnumValue(value, KHMER_FONT_NAME)
}

export function stringToKhmerFontNameOrUndefined(value: string): KhmerFontName | undefined {
  return stringToEnumOrUndefined(value, KHMER_FONT_NAME)
}

export function stringToKhmerFontNameOrThrow(value: string): KhmerFontName {
  return stringToEnumOrThrow(value, KHMER_FONT_NAME, 'KhmerFontName')
}

// export const KHMER_FONT_FAMILY: Record<KhmerFontName, NonEmptyStringTrimmed | undefined> = {
export const KHMER_FONT_FAMILY: { [P in KhmerFontName]: NonEmptyStringTrimmed | undefined } = {
  Default: undefined,
  Moul: '"Moul", serif' as NonEmptyStringTrimmed,
  Siemreap: '"Siemreap", serif' as NonEmptyStringTrimmed,
  Battambang: '"Battambang", cursive' as NonEmptyStringTrimmed,
  Kantumruy: '"Kantumruy Pro", sans-serif' as NonEmptyStringTrimmed,
  Fasthand: '"Fasthand", cursive' as NonEmptyStringTrimmed,
}
