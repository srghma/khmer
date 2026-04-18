import { countDigitsAfterDotAndBeforeDot } from '../number/countDigitsBeforeAndAfterDot.js'
import { nOfDigitsBeforeDot } from '../number/nOfDigitsBeforeDot.js'

//// IDEA: numbers that can be send to db and db will not throw
// NOTE: there is a db check on ProductAttributeValues that allows only: max 20 decimals before dot, 10 after, no trailing dot

// Types
export type ValidNumber = number & {
  readonly __ValidNumberBrand: 'ValidNumber'
} // ok are 1 or 1.1

// global config
export const validNumber__maxDigitsBeforeDot = 20 as number
export const validNumber__maxDigitsAfterDot = 10 as number // I want to allow seeing 1.1 and 1.12 and 1.1234567890, but not 1.12345678901

export function number_isValidNumber(num: number): num is ValidNumber {
  if (!Number.isFinite(num)) return false // is not NaN, Infinity, -Infinity
  // const { before, after } = countDigitsAfterDotAndBeforeDot(num) // UNCOMMENT ME IF checking length of digits before or after dot
  return true // COMMENT ME IF checking length of digits before or after dot
  /* // UNCOMMENT ME IF checking length of digits before or after dot
  return (
    before <= validNumber__maxDigitsBeforeDot && // UNCOMMENT ME IF checking length of digits before dot
    after <= validNumber__maxDigitsAfterDot // UNCOMMENT ME IF checking length of digits after dot
  )
  */ // UNCOMMENT ME IF checking length of digits before or after dot
}

export function number_throwIfNotValidNumber(num: number): asserts num is ValidNumber {
  if (!number_isValidNumber(num))
    throw new TypeError(`Invalid number: must have ≤20 digits before and ≤10 digits after dot, got ${num}`)
}

// // ===== NUMBER TO =====

// Converts a number to ValidNumber with rounding
export function numberToValidNumberOrUndefined(value: number, round = true): ValidNumber | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  let num = value
  if (round) num = Number(num.toFixed(validNumber__maxDigitsAfterDot))
  if (num === 0) num = 0 // Normalize -0 to 0
  if (!number_isValidNumber(num)) return undefined
  return num
}

export function number_toValidNumber_unsafe(num: number): ValidNumber {
  return num as ValidNumber
}

// ===== STR TO =====

// lenient - uses parseFloat which accepts number prefixes
export function strToNumberOrUndefined_lenient(value: string): ValidNumber | undefined {
  // if (typeof value !== 'string') return undefined // enfoced by ts
  let num = parseFloat(value)
  // parseFloat returns NaN for invalid input
  num = Number(num.toFixed(validNumber__maxDigitsAfterDot))
  if (!number_isValidNumber(num)) return undefined
  return num
}

// strict - uses Number() which requires entire string to be valid
export function strToNumberOrUndefined_strict(value: string): ValidNumber | undefined {
  // if (typeof value !== 'string') return undefined // enfoced by ts
  // Reject strings with leading/trailing whitespace
  if (value !== value.trim()) return undefined
  // Number() converts empty strings to 0, which we don't want
  if (value === '') return undefined
  let num = Number(value)
  num = Number(num.toFixed(validNumber__maxDigitsAfterDot))
  // Check if it's a valid number (not NaN, Infinity, -Infinity)
  if (!number_isValidNumber(num)) return undefined
  return num
}


/////////////////

export function strToNumberOrThrow_lenient(value: string): ValidNumber {
  const n = strToNumberOrUndefined_lenient(value)
  if (n === undefined) throw new Error(`Invalid number: "${value}"`)
  return n
}

export function strToNumberOrThrow_strict(value: string): ValidNumber {
  const n = strToNumberOrUndefined_strict(value)
  if (n === undefined) throw new Error(`Invalid number: "${value}"`)
  return n
}


// ===== STR OR NUMBER TO =====

export function strOrNumberToNumberOrUndefined_lenient(value: string | number): undefined | ValidNumber {
  if (typeof value === 'number') return numberToValidNumberOrUndefined(value, true)
  return strToNumberOrUndefined_lenient(value)
}

export function strOrNumberToNumberOrUndefined_strict(value: string | number): undefined | ValidNumber {
  if (typeof value === 'number') return numberToValidNumberOrUndefined(value, true)
  return strToNumberOrUndefined_strict(value)
}

export function strOrNumberToNumberOrThrow_lenient(value: string | number): ValidNumber {
  const n = strOrNumberToNumberOrUndefined_lenient(value)
  if (n === undefined) throw new Error(`Invalid number: "${value}"`)
  return n
}

export function strOrNumberToNumberOrThrow_strict(value: string | number): ValidNumber {
  const n = strOrNumberToNumberOrUndefined_strict(value)
  if (n === undefined) throw new Error(`Invalid number: "${value}"`)
  return n
}


// ===== Unknown TO =====

export function unknownToNumberOrUndefined_lenient(value: unknown): undefined | ValidNumber {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  return strOrNumberToNumberOrUndefined_lenient(value)
}

export function unknownToNumberOrUndefined_strict(value: unknown): undefined | ValidNumber {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  return strOrNumberToNumberOrUndefined_strict(value)
}

export function unknownToNumberOrThrow_lenient(value: unknown): ValidNumber {
  const n = unknownToNumberOrUndefined_lenient(value)
  if (n === undefined) throw new Error(`Invalid number: "${value}"`)
  return n
}

export function unknownToNumberOrThrow_strict(value: unknown): ValidNumber {
  const n = unknownToNumberOrUndefined_strict(value)
  if (n === undefined) throw new Error(`Invalid number: "${value}"`)
  return n
}
