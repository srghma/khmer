import {
  isEnumValue,
  stringToEnumOrUndefined,
  stringToEnumOrThrow,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/enum'

export const ANKI_DIRECTIONS = ['GUESSING_KHMER', 'GUESSING_NON_KHMER'] as const

export type AnkiDirection = (typeof ANKI_DIRECTIONS)[number]

export function isAnkiDirection(value: string): value is AnkiDirection {
  return isEnumValue(value, ANKI_DIRECTIONS)
}

export function stringToAnkiDirectionOrUndefined(value: string): AnkiDirection | undefined {
  return stringToEnumOrUndefined(value, ANKI_DIRECTIONS)
}

export function stringToAnkiDirectionOrThrow(value: string): AnkiDirection {
  return stringToEnumOrThrow(value, ANKI_DIRECTIONS, 'AnkiDirection')
}
export type AnkiGameMode =
  | 'GUESS_NON_KHMER_km'
  | 'GUESS_KHMER_en'
  | 'GUESS_KHMER_ru'
  | 'GUESS_KHMER_km'
  | 'GUESS_NON_KHMER_en'
  | 'GUESS_NON_KHMER_ru'
