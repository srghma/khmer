import {
  type ValidNonNegativeNumber,
  number_isValidNonNegativeNumber,
  validNumber_isValidNonNegativeNumber,
} from './validNonNegativeNumber.js'
import {
  validNumber__maxDigitsAfterDot,
  strToNumberOrUndefined_lenient,
  strToNumberOrUndefined_strict,
} from './validNumber.js'

export type ValidPercent = ValidNonNegativeNumber & {
  readonly __ValidPercentBrand: 'ValidPercent'
}

export function validNonNegativeNumber_isValidPercent(num: ValidNonNegativeNumber): num is ValidPercent {
  return num <= 100
}

export function number_isValidPercent(num: number): num is ValidPercent {
  return number_isValidNonNegativeNumber(num) && validNonNegativeNumber_isValidPercent(num)
}

export const number_inPercentRange = number_isValidPercent

export function number_throwIfNotInPercentRange(num: number): asserts num is ValidPercent {
  if (!number_isValidPercent(num)) throw new TypeError(`Percent must be between 0 and 100 inclusive, got ${num}`)
}

// Converts a number to ValidPercent (0-100)
export function numberToValidPercentOrUndefined(value: number, round = true, clamp = true): ValidPercent | undefined {
  // Check for invalid values BEFORE clamping
  if (!Number.isFinite(value)) return undefined
  let num = value
  if (clamp) num = Math.min(100, Math.max(0, num)) // Clamp first if enabled
  if (round) num = Number(num.toFixed(validNumber__maxDigitsAfterDot)) // Then round if enabled
  if (num === 0) num = 0 // Normalize -0 to 0
  if (!number_isValidPercent(num)) return undefined
  return num
}

export function number_toValidPercent_unsafe(num: number): ValidPercent {
  return num as ValidPercent
}

export function strToPercentOrUndefined_lenient(value: string, round = true, clamp = true): ValidPercent | undefined {
  let num: number | undefined = strToNumberOrUndefined_lenient(value)
  if (num === undefined) return undefined
  if (clamp) num = Math.min(100, Math.max(0, num)) // Clamp first if enabled
  if (round) num = Number(num.toFixed(validNumber__maxDigitsAfterDot)) // Then round if enabled
  if (!number_isValidPercent(num)) return undefined // Check if it's a valid percent after transformations
  return num
}

export function strToPercentOrUndefined_strict(value: string, round = true, clamp = true): ValidPercent | undefined {
  const num = strToNumberOrUndefined_strict(value)
  if (num === undefined) return undefined
  if (!validNumber_isValidNonNegativeNumber(num)) return undefined
  let result: number = num
  if (clamp) result = Math.min(100, Math.max(0, result)) // Clamp first if enabled
  if (round) result = Number(result.toFixed(validNumber__maxDigitsAfterDot)) // Then round if enabled
  if (!number_isValidPercent(result)) return undefined // Check if it's a valid percent after transformations
  return result
}

export function strToPercentOrThrow_lenient(value: string, round = true, clamp = true): ValidPercent {
  const n = strToPercentOrUndefined_lenient(value, round, clamp)
  if (n === undefined) throw new Error(`Invalid percent: "${value}"`)
  return n
}

export function strToPercentOrThrow_strict(value: string, round = true, clamp = true): ValidPercent {
  const n = strToPercentOrUndefined_strict(value, round, clamp)
  if (n === undefined) throw new Error(`Invalid percent: "${value}"`)
  return n
}


// Number or string -> ValidPercent
export function strOrNumberToPercentOrUndefined_lenient(
  value: string | number,
  round = true,
  clamp = true,
): undefined | ValidPercent {
  if (typeof value === 'number') return numberToValidPercentOrUndefined(value, round, clamp)
  return strToPercentOrUndefined_lenient(value, round, clamp)
}

export function strOrNumberToPercentOrUndefined_strict(
  value: string | number,
  round = true,
  clamp = true,
): undefined | ValidPercent {
  if (typeof value === 'number') return numberToValidPercentOrUndefined(value, round, clamp)
  return strToPercentOrUndefined_strict(value, round, clamp)
}

export function strOrNumberToPercentOrThrow_lenient(value: string | number, round = true, clamp = true): ValidPercent {
  const n = strOrNumberToPercentOrUndefined_lenient(value, round, clamp)
  if (n === undefined) throw new Error(`Invalid percent: "${value}"`)
  return n
}

export function strOrNumberToPercentOrThrow_strict(value: string | number, round = true, clamp = true): ValidPercent {
  const n = strOrNumberToPercentOrUndefined_strict(value, round, clamp)
  if (n === undefined) throw new Error(`Invalid percent: "${value}"`)
  return n
}

export function unknownToPercentOrUndefined_lenient(
  value: unknown,
  round = true,
  clamp = true,
): undefined | ValidPercent {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  return strOrNumberToPercentOrUndefined_lenient(value, round, clamp)
}

export function unknownToPercentOrUndefined_strict(
  value: unknown,
  round = true,
  clamp = true,
): undefined | ValidPercent {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  return strOrNumberToPercentOrUndefined_strict(value, round, clamp)
}

export function unknownToPercentOrThrow_lenient(value: unknown, round = true, clamp = true): ValidPercent {
  const n = unknownToPercentOrUndefined_lenient(value, round, clamp)
  if (n === undefined) throw new Error(`Invalid percent: "${value}"`)
  return n
}

export function unknownToPercentOrThrow_strict(value: unknown, round = true, clamp = true): ValidPercent {
  const n = unknownToPercentOrUndefined_strict(value, round, clamp)
  if (n === undefined) throw new Error(`Invalid percent: "${value}"`)
  return n
}


///////////////////////

////////////////////////////
// Other utils
////////////////////////////

export function percentOf(part: ValidNonNegativeNumber, whole: ValidNonNegativeNumber): ValidPercent {
  // dividing two non-negative numbers always yields non-negative
  const pct = (part / whole) * 100
  return pct as ValidPercent
}
