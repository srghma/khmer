// Copyright 2023 srghma

import { NonEmptyString } from "./non-empty-string"

// **май**
// **маленьк|ий**
// **улучшить**
// **сажá|ть**
const RussianMultiWord_REGEX = /^[\p{Script=Cyrillic}|]+$/u // TODO: support accent?

export type TypedRussianMultiWord = NonEmptyString & {
  readonly __TypedRussianMultiWordBrand: "TypedRussianMultiWord"
}
export const isRussianMultiWord = (
  value: string,
): value is TypedRussianMultiWord => RussianMultiWord_REGEX.test(value)
export const strToRussianMultiWordOrUndefined = (
  value: string,
): TypedRussianMultiWord | undefined =>
  isRussianMultiWord(value) ? value : undefined
export const strToRussianMultiWordOrThrow = (
  value: string,
): TypedRussianMultiWord => {
  const uuid = strToRussianMultiWordOrUndefined(value)
  if (!uuid) throw new Error(`Invalid RussianMultiWord format: '${value}'`)
  return uuid
}

///////////

// **май**
const RussianOneWord_REGEX = /^[\p{Script=Cyrillic}]+$/u

export type TypedRussianOneWord = NonEmptyString & {
  readonly __TypedRussianMultiWordBrand: "TypedRussianOneWord"
}
export const isRussianOneWord = (value: string): value is TypedRussianOneWord =>
  RussianOneWord_REGEX.test(value)
export const strToRussianOneWordOrUndefined = (
  value: string,
): TypedRussianOneWord | undefined =>
  isRussianOneWord(value) ? value : undefined
export const strToRussianOneWordOrThrow = (
  value: string,
): TypedRussianOneWord => {
  const uuid = strToRussianOneWordOrUndefined(value)
  if (!uuid) throw new Error(`Invalid RussianOneWord format: '${value}'`)
  return uuid
}
