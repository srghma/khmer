import {
  isEnumValue,
  stringToEnumOrUndefined,
  stringToEnumOrThrow,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/enum'
import type { DictionaryLanguage } from '../../types'

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
  | 'km:GUESSING_NON_KHMER'
  | 'en:GUESSING_KHMER'
  | 'ru:GUESSING_KHMER'
  | 'km:GUESSING_KHMER'
  | 'en:GUESSING_NON_KHMER'
  | 'ru:GUESSING_NON_KHMER'

export function languageAndDirectionToAnkiGameMode(
  language: DictionaryLanguage,
  direction: AnkiDirection,
): AnkiGameMode {
  return `${language}:${direction}` as AnkiGameMode
}

export function ankiGameModeToLanguageAndDirection(mode: AnkiGameMode): [DictionaryLanguage, AnkiDirection] {
  const [language, direction] = mode.split(':') as [DictionaryLanguage, AnkiDirection]

  return [language, direction]
}
