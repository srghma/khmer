import {
  isEnumValue,
  stringToEnumOrUndefined,
  stringToEnumOrThrow,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/enum'

export const COLORIZATION_MODE = ['none', 'segmenter', 'dictionary'] as const

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

export const COLOR_PALETTE = [
  '#569cd6', // Blue
  '#4ec9b0', // Soft Green
  '#c586c0', // Pink/Purple
  '#dcdcaa', // Soft Yellow
  '#ce9178', // Orange
] as const
