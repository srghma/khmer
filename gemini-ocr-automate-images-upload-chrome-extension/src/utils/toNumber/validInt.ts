import {
  type ValidNumber,
  // validNumber__maxDigitsBeforeDot
} from './validNumber.js'
// import { nOfDigitsBeforeDot } from '../number/nOfDigitsBeforeDot.js'

export type ValidInt = ValidNumber & { readonly __ValidIntBrand: 'ValidInt' }

export function number_isValidInt(num: number): num is ValidInt {
  // return Number.isInteger(num) && nOfDigitsBeforeDot(num) <= validNumber__maxDigitsBeforeDot // UNCOMMENT ME IF checking length of digits before dot
  return Number.isInteger(num) // COMMENT ME IF checking length of digits before dot
}

export function number_throwIfNotValidInt(num: number): asserts num is ValidInt {
  if (!number_isValidInt(num))
    throw new TypeError(`Invalid integer: must be whole number with ≤20 digits before dot, got ${num}`)
}

// Converts a number to ValidInt
export function numberToValidIntOrUndefined(value: number, round = true): ValidInt | undefined {
  if (typeof value !== 'number') return undefined
  let num = value
  if (round) num = Math.round(num)
  if (num === 0) num = 0 // Normalize -0 to 0
  if (!number_isValidInt(num)) return undefined
  return num
}

export function number_toValidInt_unsafe(num: number): ValidInt {
  return num as ValidInt
}


// lenient - uses parseInt which accepts integer prefixes
export function strToIntOrUndefined_lenient(value: string): ValidInt | undefined {
  // if (typeof value !== 'string') return undefined // enfoced by ts
  const num = parseInt(value, 10)
  // parseInt returns NaN for invalid input
  if (!number_isValidInt(num)) return undefined
  return num
}


// strict - uses Number() which requires entire string to be valid
export function strToIntOrUndefined_strict(value: string, round: boolean = true): ValidInt | undefined {
  // if (typeof value !== 'string') return undefined // enfoced by ts
  // Reject strings with leading/trailing whitespace
  if (value !== value.trim()) return undefined
  // Number() converts empty strings to 0, which we don't want
  if (value === '') return undefined
  let num = Number(value)
  if (round) num = Math.round(num)
  // Check if it's a valid integer (not NaN, Infinity, or decimal)
  if (!number_isValidInt(num)) return undefined
  return num
}

export function strToIntOrThrow_lenient(value: string): ValidInt {
  const n = strToIntOrUndefined_lenient(value)
  if (n === undefined) throw new Error(`Invalid integer: "${value}"`)
  return n
}

export function strToIntOrThrow_strict(value: string, round: boolean = true): ValidInt {
  const n = strToIntOrUndefined_strict(value, round)
  if (n === undefined) throw new Error(`Invalid integer: "${value}"`)
  return n
}


// Number or string -> ValidInt
export function strOrNumberToIntOrUndefined_lenient(value: string | number): undefined | ValidInt {
  if (typeof value === 'number') return numberToValidIntOrUndefined(value, true)
  return strToIntOrUndefined_lenient(value)
}

export function strOrNumberToIntOrUndefined_strict(
  value: string | number,
  round: boolean = true,
): undefined | ValidInt {
  if (typeof value === 'number') return numberToValidIntOrUndefined(value, round)
  return strToIntOrUndefined_strict(value, round)
}

export function strOrNumberToIntOrThrow_lenient(value: string | number): ValidInt {
  const n = strOrNumberToIntOrUndefined_lenient(value)
  if (n === undefined) throw new Error(`Invalid integer: "${value}"`)
  return n
}

export function strOrNumberToIntOrThrow_strict(value: string | number, round: boolean = true): ValidInt {
  const n = strOrNumberToIntOrUndefined_strict(value, round)
  if (n === undefined) throw new Error(`Invalid integer: "${value}"`)
  return n
}

export function unknownToIntOrUndefined_lenient(value: unknown): undefined | ValidInt {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  return strOrNumberToIntOrUndefined_lenient(value)
}

export function unknownToIntOrUndefined_strict(value: unknown, round: boolean = true): undefined | ValidInt {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  return strOrNumberToIntOrUndefined_strict(value, round)
}

export function unknownToIntOrThrow_lenient(value: unknown): ValidInt {
  const n = unknownToIntOrUndefined_lenient(value)
  if (n === undefined) throw new Error(`Invalid integer: "${value}"`)
  return n
}

export function unknownToIntOrThrow_strict(value: unknown, round: boolean = true): ValidInt {
  const n = unknownToIntOrUndefined_strict(value, round)
  if (n === undefined) throw new Error(`Invalid integer: "${value}"`)
  return n
}
