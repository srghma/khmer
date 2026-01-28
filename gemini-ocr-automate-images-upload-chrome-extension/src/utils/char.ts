export type Char = string & { __brandChar: 'Char' }

export function Char_isChar(s: string): s is Char {
  return Array.from(s).length === 1
}

export function Char_mkOrThrow(s: string): Char {
  // Use Array.from to handle surrogate pairs correctly
  const l = Array.from(s).length
  if (l !== 1) throw new Error(`Expected single character, got length ${l}: "${s}"`)
  return s as Char
}

export function Char_mkUnsafe(s: string): Char {
  return s as Char
}

export function CharArray_mkFromString(s: string): readonly Char[] {
  return Array.from(s) as Char[]
}

export function CharArray_mkFromArrayOfStringsUnsafe(s: readonly string[]): readonly Char[] {
  return s as Char[]
}

export const Char_eq = (x: Char, y: Char) => x === y
