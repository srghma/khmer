import {
  type ValidNumber,
  validNumber__maxDigitsAfterDot,
  number_isValidNumber,
} from './validNumber.js'
import {
  strToNumberOrUndefined_lenient,
  strToNumberOrUndefined_strict,
} from './validNumber.js'

export type ValidNonNegativeNumber = ValidNumber & {
  readonly __ValidNumberBrand: 'ValidNumber'
}

export function validNumber_isValidNonNegativeNumber(num: ValidNumber): num is ValidNonNegativeNumber {
  return num >= 0
}

export function number_isValidNonNegativeNumber(num: number): num is ValidNonNegativeNumber {
  return number_isValidNumber(num) && validNumber_isValidNonNegativeNumber(num)
}

export function number_throwIfNotValidNonNegativeNumber(num: number): asserts num is ValidNonNegativeNumber {
  if (!number_isValidNonNegativeNumber(num))
    throw new TypeError(
      `Invalid non-negative number: must be ≥ 0 and have ≤20 digits before and ≤10 after dot, got ${num}`,
    )
}

// Converts a number to a non-negative number
export function numberToValidNonNegativeNumberOrUndefined(
  value: number,
  round = true,
  clamp = false,
): ValidNonNegativeNumber | undefined {
  if (typeof value !== 'number') return undefined
  // Check for invalid values BEFORE clamping
  if (!Number.isFinite(value)) return undefined
  let num = value
  if (clamp && num < 0) num = 0
  if (round) num = Number(num.toFixed(validNumber__maxDigitsAfterDot))
  if (num === 0) num = 0 // Normalize -0 to 0
  if (!number_isValidNonNegativeNumber(num)) return undefined
  return num
}

export function number_toValidNonNegativeNumber_unsafe(num: number): ValidNonNegativeNumber {
  return num as ValidNonNegativeNumber
}


// Converts a string to a non-negative number (strict mode)
// e.g. "0" -> 0, "10.5" -> 10.5, "-1" -> undefined, "abc" -> undefined
export function strToNonNegativeNumberOrUndefined_lenient(value: string): ValidNonNegativeNumber | undefined {
  const num = strToNumberOrUndefined_lenient(value)
  if (num === undefined) return undefined
  if (!validNumber_isValidNonNegativeNumber(num)) return undefined
  return num
}

export function strToNonNegativeNumberOrUndefined_strict(value: string): ValidNonNegativeNumber | undefined {
  const num = strToNumberOrUndefined_strict(value)
  if (num === undefined) return undefined
  if (!validNumber_isValidNonNegativeNumber(num)) return undefined
  return num
}

export function strToNonNegativeNumberOrThrow_lenient(value: string): ValidNonNegativeNumber {
  const n = strToNonNegativeNumberOrUndefined_lenient(value)
  if (n === undefined) throw new Error(`Expected non-negative number, got: "${value}"`)
  return n
}

export function strToNonNegativeNumberOrThrow_strict(value: string): ValidNonNegativeNumber {
  const n = strToNonNegativeNumberOrUndefined_strict(value)
  if (n === undefined) throw new Error(`Expected non-negative number, got: "${value}"`)
  return n
}


// Number or string -> ValidNonNegativeNumber
export function strOrNumberToNonNegativeNumberOrUndefined_lenient(
  value: string | number,
): undefined | ValidNonNegativeNumber {
  if (typeof value === 'number') return numberToValidNonNegativeNumberOrUndefined(value, true, false)
  return strToNonNegativeNumberOrUndefined_lenient(value)
}

export function strOrNumberToNonNegativeNumberOrUndefined_strict(
  value: string | number,
): undefined | ValidNonNegativeNumber {
  if (typeof value === 'number') return numberToValidNonNegativeNumberOrUndefined(value, true, false)
  return strToNonNegativeNumberOrUndefined_strict(value)
}

export function strOrNumberToNonNegativeNumberOrThrow_lenient(value: string | number): ValidNonNegativeNumber {
  const n = strOrNumberToNonNegativeNumberOrUndefined_lenient(value)
  if (n === undefined) throw new Error(`Expected non-negative number, got: "${value}"`)
  return n
}

export function strOrNumberToNonNegativeNumberOrThrow_strict(value: string | number): ValidNonNegativeNumber {
  const n = strOrNumberToNonNegativeNumberOrUndefined_strict(value)
  if (n === undefined) throw new Error(`Expected non-negative number, got: "${value}"`)
  return n
}

export function unknownToNonNegativeNumberOrUndefined_lenient(value: unknown): undefined | ValidNonNegativeNumber {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  return strOrNumberToNonNegativeNumberOrUndefined_lenient(value)
}

export function unknownToNonNegativeNumberOrUndefined_strict(value: unknown): undefined | ValidNonNegativeNumber {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  return strOrNumberToNonNegativeNumberOrUndefined_strict(value)
}

export function unknownToNonNegativeNumberOrThrow_lenient(value: unknown): ValidNonNegativeNumber {
  const n = unknownToNonNegativeNumberOrUndefined_lenient(value)
  if (n === undefined) throw new Error(`Expected non-negative number, got: "${value}"`)
  return n
}

export function unknownToNonNegativeNumberOrThrow_strict(value: unknown): ValidNonNegativeNumber {
  const n = unknownToNonNegativeNumberOrUndefined_strict(value)
  if (n === undefined) throw new Error(`Expected non-negative number, got: "${value}"`)
  return n
}
