import {
  type ValidInt,
  number_isValidInt,
  strToIntOrUndefined_lenient,
  strToIntOrUndefined_strict,
} from './validInt.js'

export type ValidNonNegativeInt = ValidInt & {
  readonly __ValidNonNegativeIntBrand: 'ValidNonNegativeInt'
}

export function validInt_isValidNonNegativeInt(num: ValidInt): num is ValidNonNegativeInt {
  return num >= 0
}

export function number_isValidNonNegativeInt(num: number): num is ValidNonNegativeInt {
  return number_isValidInt(num) && validInt_isValidNonNegativeInt(num)
}

export function number_throwIfNotValidNonNegativeInt(num: number): asserts num is ValidNonNegativeInt {
  if (!number_isValidNonNegativeInt(num))
    throw new TypeError(`Invalid non-negative integer: must be ≥ 0 and whole, got ${num}`)
}

// Converts a number to ValidNonNegativeInt
export function numberToValidNonNegativeIntOrUndefined(
  value: number,
  round = true,
  clamp = false,
): ValidNonNegativeInt | undefined {
  if (typeof value !== 'number') return undefined
  let num = value
  if (clamp && num < 0) num = 0
  if (round) num = Math.round(num)
  if (num === 0) num = 0 // Normalize -0 to 0
  if (!number_isValidNonNegativeInt(num)) return undefined
  return num
}


// lenient - uses parseInt which accepts integer prefixes
export function strToNonNegativeIntOrUndefined_lenient(value: string): ValidNonNegativeInt | undefined {
  const num = strToIntOrUndefined_lenient(value)
  if (num === undefined) return undefined
  if (!validInt_isValidNonNegativeInt(num)) return undefined
  return num
}

// Returns positive integer or undefined if invalid
export function strToNonNegativeIntOrUndefined_strict(
  value: string,
  round: boolean = true,
): ValidNonNegativeInt | undefined {
  let num = strToIntOrUndefined_strict(value, round)
  if (num === undefined) return undefined
  if (round && num < 0) num = 0 as ValidInt // clamp negative to zero
  if (!validInt_isValidNonNegativeInt(num)) return undefined
  return num
}

export function strToNonNegativeIntOrThrow_lenient(value: string): ValidNonNegativeInt {
  const n = strToNonNegativeIntOrUndefined_lenient(value)
  if (n === undefined) throw new Error(`Expected non-negative integer, got: "${value}"`)
  return n
}

export function strToNonNegativeIntOrThrow_strict(value: string, round: boolean = true): ValidNonNegativeInt {
  const n = strToNonNegativeIntOrUndefined_strict(value, round)
  if (n === undefined) throw new Error(`Expected non-negative integer, got: "${value}"`)
  return n
}


// Number or string -> ValidNonNegativeInt
export function strOrNumberToNonNegativeIntOrUndefined_lenient(
  value: string | number,
): undefined | ValidNonNegativeInt {
  if (typeof value === 'number') return numberToValidNonNegativeIntOrUndefined(value, true, false)
  return strToNonNegativeIntOrUndefined_lenient(value)
}

export function strOrNumberToNonNegativeIntOrUndefined_strict(
  value: string | number,
  round: boolean = true,
): undefined | ValidNonNegativeInt {
  if (typeof value === 'number') return numberToValidNonNegativeIntOrUndefined(value, round, false)
  return strToNonNegativeIntOrUndefined_strict(value, round)
}

export function strOrNumberToNonNegativeIntOrThrow_lenient(value: string | number): ValidNonNegativeInt {
  const n = strOrNumberToNonNegativeIntOrUndefined_lenient(value)
  if (n === undefined) throw new Error(`Expected non-negative integer, got: "${value}"`)
  return n
}

export function strOrNumberToNonNegativeIntOrThrow_strict(
  value: string | number,
  round: boolean = true,
): ValidNonNegativeInt {
  const n = strOrNumberToNonNegativeIntOrUndefined_strict(value, round)
  if (n === undefined) throw new Error(`Expected non-negative integer, got: "${value}"`)
  return n
}

export function unknownToNonNegativeIntOrUndefined_lenient(value: unknown): undefined | ValidNonNegativeInt {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  return strOrNumberToNonNegativeIntOrUndefined_lenient(value)
}

export function unknownToNonNegativeIntOrUndefined_strict(
  value: unknown,
  round: boolean = true,
): undefined | ValidNonNegativeInt {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  return strOrNumberToNonNegativeIntOrUndefined_strict(value, round)
}

export function unknownToNonNegativeIntOrThrow_lenient(value: unknown): ValidNonNegativeInt {
  const n = unknownToNonNegativeIntOrUndefined_lenient(value)
  if (n === undefined) throw new Error(`Expected non-negative integer, got: "${value}"`)
  return n
}

export function unknownToNonNegativeIntOrThrow_strict(value: unknown, round: boolean = true): ValidNonNegativeInt {
  const n = unknownToNonNegativeIntOrUndefined_strict(value, round)
  if (n === undefined) throw new Error(`Expected non-negative integer, got: "${value}"`)
  return n
}
