// Copyright 2023 srghma

// Khmer Unicode range: U+1780 to U+17FF
export const TypedNonKhmer_REGEX = /^[^\p{Script=Khmer}]+$/u

// text that contains only khmer letters and no other letters (not even space)

export type TypedNonKhmer = string & {
  readonly __uuidbrand: 'TypedNonKhmer'
}
export const isTypedNonKhmer = (value: string): value is TypedNonKhmer => TypedNonKhmer_REGEX.test(value)
export const strToTypedNonKhmerOrUndefined = (value: string): TypedNonKhmer | undefined =>
  isTypedNonKhmer(value) ? value : undefined
export const strToTypedNonKhmerOrThrow = (value: string): TypedNonKhmer => {
  const uuid = strToTypedNonKhmerOrUndefined(value)
  if (!uuid) throw new Error(`Invalid TypedNonKhmer format: '${value}'`)
  return uuid
}
