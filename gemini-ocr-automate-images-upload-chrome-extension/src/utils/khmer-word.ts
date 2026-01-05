// Copyright 2023 srghma

// Khmer Unicode range: U+1780 to U+17FF
const KhmerWord_REGEX = /^[\p{Script=Khmer}]+$/u

// text that contains only khmer letters and no other letters (not even space)

export type TypedKhmerWord = string & { readonly __uuidbrand: "TypedKhmerWord" }
export const isKhmerWord = (value: string): value is TypedKhmerWord =>
  KhmerWord_REGEX.test(value)
export const strToKhmerWordOrUndefined = (
  value: string,
): TypedKhmerWord | undefined => (isKhmerWord(value) ? value : undefined)
export const strToKhmerWordOrThrow = (value: string): TypedKhmerWord => {
  const uuid = strToKhmerWordOrUndefined(value)
  if (!uuid) throw new Error(`Invalid KhmerWord format: '${value}'`)
  return uuid
}

// Split a string into unique Khmer words
export const strToKhmerWords = (value: string): TypedKhmerWord[] => {
  const seen = new Set<string>()

  return (
    value
      // split on one or more non-Khmer chars
      .split(/[^\p{Script=Khmer}]+/u)
      // remove empty fragments
      .filter(Boolean)
      // validate + brand
      .map(strToKhmerWordOrUndefined)
      // keep only valid Khmer words
      .filter((w): w is TypedKhmerWord => !!w)
      // unique, stable order
      .filter((w) => {
        if (seen.has(w)) return false
        seen.add(w)
        return true
      })
  )
}
