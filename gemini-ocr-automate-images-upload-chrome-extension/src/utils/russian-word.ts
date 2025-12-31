// Copyright 2023 srghma

const RussianWord_REGEX = /^[\p{Script=Cyrillic}\s.-|]+$/u

export type TypedRussianWord = string & {
  readonly __uuidbrand: "TypedRussianWord"
}
export const isRussianWord = (value: string): value is TypedRussianWord =>
  RussianWord_REGEX.test(value)
export const strToRussianWordOrUndefined = (
  value: string,
): TypedRussianWord | undefined => (isRussianWord(value) ? value : undefined)
export const strToRussianWordOrThrow = (value: string): TypedRussianWord => {
  const uuid = strToRussianWordOrUndefined(value)
  if (!uuid) throw new Error(`Invalid RussianWord format: '${value}'`)
  return uuid
}
