import { type Char } from './char'

export const CharUppercaseCyrillic_REGEX = /^[\u0410-\u042F\u0401]$/

export type CharUppercaseCyrillic = Char & { __brandCharUppercaseCyrillic: 'CharUppercaseCyrillic' }
export const unsafe_char_toCharUppercaseCyrillic = (c: Char) => c as CharUppercaseCyrillic

export const isCharUppercaseCyrillic = (value: Char): value is CharUppercaseCyrillic =>
  CharUppercaseCyrillic_REGEX.test(value)

export const charToCharUppercaseCyrillicOrUndefined = (value: Char): CharUppercaseCyrillic | undefined =>
  isCharUppercaseCyrillic(value) ? value : undefined

export const charToCharUppercaseCyrillicOrThrow = (value: Char): CharUppercaseCyrillic => {
  const c = charToCharUppercaseCyrillicOrUndefined(value)
  if (!c) throw new Error(`Invalid CharUppercaseCyrillic format: '${value}'`)
  return c
}

export const charToCharUppercaseCyrillicOrThrow__allowLowercase = (value: Char): CharUppercaseCyrillic => {
  const c = charToCharUppercaseCyrillicOrUndefined(value.toUpperCase() as Char)
  if (!c) throw new Error(`Invalid CharUppercaseCyrillic format: '${value}'`)
  return c
}
