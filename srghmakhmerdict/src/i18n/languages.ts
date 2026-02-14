import type { Locales } from './i18n-types'
import { isLocale } from './i18n-util'

export const allLanguages = <T extends Locales[]>(...args: T & ([Locales] extends [T[number]] ? unknown : never)) =>
  args

export const LANGUAGES = allLanguages('en', 'ru', 'uk')

export type LanguagesOrAuto = 'auto' | Locales

export function isLanguagesOrAuto(value: string): value is LanguagesOrAuto {
  return value === 'auto' || isLocale(value)
}

export function stringToLanguagesOrAutoOrThrow(value: string): LanguagesOrAuto {
  if (isLanguagesOrAuto(value)) {
    return value
  }

  throw new Error(`Invalid LanguagesOrAuto value: ${value}`)
}
