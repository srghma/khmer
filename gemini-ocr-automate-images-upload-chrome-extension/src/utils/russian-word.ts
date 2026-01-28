import { type NonEmptyString } from './non-empty-string'

///////////

// **май** - same as multi but typically strictly one word, though your usage implies similar validation.
// Keeping it distinct as requested, but using the same robust regex for now.
const RussianOneWord_REGEX = /^\p{Script=Cyrillic}+$/u

export type TypedRussianOneWord = NonEmptyString & {
  readonly __TypedRussianMultiWordBrand: 'TypedRussianOneWord'
}

export const isRussianOneWord = (value: string): value is TypedRussianOneWord => RussianOneWord_REGEX.test(value)

export const strToRussianOneWordOrUndefined = (value: string): TypedRussianOneWord | undefined =>
  isRussianOneWord(value) ? value : undefined

export const strToRussianOneWordOrThrow = (value: string): TypedRussianOneWord => {
  const word = strToRussianOneWordOrUndefined(value)
  if (!word) throw new Error(`Invalid RussianOneWord format: '${value}'`)
  return word
}
