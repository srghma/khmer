import { NonEmptyString } from "./non-empty-string"

// Matches Cyrillic, vertical bars (stems), hyphens, and combining accents (u0300-u036f)
// Examples: **май**, **сажá|ть**
// **май**
// **вагон-ресторан**
// **сажá|ть**
const RussianMultiWord_REGEX = /^[\p{Script=Cyrillic}|\-\u0300-\u036f]+$/u

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
  const word = strToRussianMultiWordOrUndefined(value)
  if (!word) throw new Error(`Invalid RussianMultiWord format: '${value}'`)
  return word
}

///////////

// **май** - same as multi but typically strictly one word, though your usage implies similar validation.
// Keeping it distinct as requested, but using the same robust regex for now.
const RussianOneWord_REGEX = /^[\p{Script=Cyrillic}\u0300-\u036f]+$/u

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
  const word = strToRussianOneWordOrUndefined(value)
  if (!word) throw new Error(`Invalid RussianOneWord format: '${value}'`)
  return word
}
