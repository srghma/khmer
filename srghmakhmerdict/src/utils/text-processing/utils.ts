import {
  isEnumValue,
  stringToEnumOrUndefined,
  stringToEnumOrThrow,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/enum'

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
