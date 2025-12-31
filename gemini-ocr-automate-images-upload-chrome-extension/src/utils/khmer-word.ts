// Copyright 2023 srghma

// Khmer Unicode range: U+1780 to U+17FF
const KhmerWord_REGEX = /^[\p{Script=Khmer}\s.-]+$/u

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
