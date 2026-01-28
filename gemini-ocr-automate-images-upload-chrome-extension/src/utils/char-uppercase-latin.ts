import { type Char } from './char'

export const CharUppercaseLatin_REGEX = /^[A-Z]$/

export type CharUppercaseLatin = Char & { __brandCharUppercaseLatin: 'CharUppercaseLatin' }
export const unsafe_char_toCharUppercaseLatin = (c: Char) => c as CharUppercaseLatin

export const isCharUppercaseLatin = (value: Char): value is CharUppercaseLatin => CharUppercaseLatin_REGEX.test(value)

export const charToCharUppercaseLatinOrUndefined = (value: Char): CharUppercaseLatin | undefined =>
  isCharUppercaseLatin(value) ? value : undefined

export const charToCharUppercaseLatinOrThrow = (value: Char): CharUppercaseLatin => {
  const c = charToCharUppercaseLatinOrUndefined(value)
  if (!c) throw new Error(`Invalid CharUppercaseLatin format: '${value}'`)
  return c
}

export const charToCharUppercaseLatinOrThrow__allowLowercase = (value: Char): CharUppercaseLatin => {
  const c = charToCharUppercaseLatinOrUndefined(value.toUpperCase() as Char)
  if (!c) throw new Error(`Invalid CharUppercaseLatin format: '${value}'`)
  return c
}
