// Copyright 2025 srghma

import { countDigitsAfterDotAndBeforeDot } from './number/countDigitsBeforeAndAfterDot.js'
import { nOfDigitsBeforeDot } from './number/nOfDigitsBeforeDot.js'

//// IDEA: numbers that can be send to db and db will not throw
// NOTE: there is a db check on ProductAttributeValues that allows only: max 20 decimals before dot, 10 after, no trailing dot

// Types
export type ValidNumber = number & { readonly __ValidNumberBrand: 'ValidNumber' } // ok are 1 or 1.1
export type ValidNonNegativeNumber = ValidNumber & { readonly __ValidNumberBrand: 'ValidNumber' }
export type ValidPercent = ValidNonNegativeNumber & { readonly __ValidPercentBrand: 'ValidPercent' }

export type ValidInt = ValidNumber & { readonly __ValidIntBrand: 'ValidInt' }
export type ValidNonNegativeInt = ValidInt & { readonly __ValidNonNegativeIntBrand: 'ValidNonNegativeInt' }

// global config
export const validNumber__maxDigitsBeforeDot: ValidNonNegativeInt = 20 as ValidNonNegativeInt
export const validNumber__maxDigitsAfterDot: ValidNonNegativeInt = 10 as ValidNonNegativeInt // I want to allow seeing 1.1 and 1.12 and 1.1234567890, but not 1.12345678901

// // Regex with digit limits built in
// export const validNumberRegex = /^-?\d{1,20}(?:\.\d{1,10})?$/
// export const validNonNegativeNumberRegex = /^\d{1,20}(?:\.\d{1,10})?$/
// export const validPercentRegex = /^(?:100(?:\.0{1,10})?|\d{1,2}(?:\.\d{1,10})?)$/
// export const validIntRegex = /^-?\d{1,20}$/
// export const validNonNegativeIntRegex = /^\d{1,20}$/

export function number_isValidNumber(num: number): num is ValidNumber {
  if (!Number.isFinite(num)) return false // is not NaN, Infinity, -Infinity
  const { before, after } = countDigitsAfterDotAndBeforeDot(num)
  return (
    before <= validNumber__maxDigitsBeforeDot && // Q: isnt it always true? isnt js numbers has only 15 digits (dot is moving)? A: no, consider numbers written in scientific notation
    after <= validNumber__maxDigitsAfterDot
  )
}

export function validNumber_isValidNonNegativeNumber(num: ValidNumber): num is ValidNonNegativeNumber {
  return num >= 0
}

export function number_isValidNonNegativeNumber(num: number): num is ValidNonNegativeNumber {
  return number_isValidNumber(num) && validNumber_isValidNonNegativeNumber(num)
}

export function validNonNegativeNumber_isValidPercent(num: ValidNonNegativeNumber): num is ValidPercent {
  return num <= 100
}

export function number_isValidPercent(num: number): num is ValidPercent {
  return number_isValidNonNegativeNumber(num) && validNonNegativeNumber_isValidPercent(num)
}

export function number_isValidInt(num: number): num is ValidInt {
  return Number.isInteger(num) && nOfDigitsBeforeDot(num) <= validNumber__maxDigitsBeforeDot
}

export function validInt_isValidNonNegativeInt(num: ValidInt): num is ValidNonNegativeInt {
  return num >= 0
}

export function number_isValidNonNegativeInt(num: number): num is ValidNonNegativeInt {
  return number_isValidInt(num) && validInt_isValidNonNegativeInt(num)
}

{
  // ===== Tests =====
  const testCases: {
    fn: (n: number) => boolean
    name: string
    cases: [number, boolean][]
  }[] = [
    {
      fn: number_isValidNumber,
      name: 'number_isValidNumber',
      cases: [
        [0, true],
        [1, true],
        [-1, true],
        [1.1, true],
        [1.123456789, true],
        [1234567890123456, true], // max pos by digits
        [-1234567890123456, true], // max neg by digits
        [0.1234567891, true], // max acceptable by digits
        [-0.1234567891, true], // max neg acceptable by digits
        [1.12345678901, false], // too many digits after
        [0.2345678901234567, false],
        [NaN, false],
        [Infinity, false],
        [Number.EPSILON, false],
        [Number.MAX_SAFE_INTEGER, true],
        [Number.MIN_SAFE_INTEGER, true],
        [Number.MAX_VALUE, false],
        [-Number.MAX_VALUE, false],
        [Number.MIN_VALUE, false],
        [-Number.MIN_VALUE, false],
      ],
    },
    {
      fn: number_isValidNonNegativeNumber,
      name: 'number_isValidNonNegativeNumber',
      cases: [
        [0, true],
        [1, true],
        [-1, false],
        [1.1, true],
        [-1.1, false],
      ],
    },
    {
      fn: number_isValidPercent,
      name: 'number_isValidPercent',
      cases: [
        [0, true],
        [50, true],
        [100, true],
        [100.0000000001, false],
        [-1, false],
        [101, false],
      ],
    },
    {
      fn: number_isValidInt,
      name: 'number_isValidInt',
      cases: [
        [0, true],
        [1, true],
        [-1, true],
        [1.1, false],
        [-1.1, false],
      ],
    },
    {
      fn: number_isValidNonNegativeInt,
      name: 'number_isValidNonNegativeInt',
      cases: [
        [0, true],
        [1, true],
        [-1, false],
        [1.1, false],
        [1234567890123456, true],
      ],
    },
  ]

  // Run tests
  for (const { fn, name, cases } of testCases) {
    for (const [n, expected] of cases) {
      const result = fn(n)
      if (result !== expected) {
        console.log(`❌ ${name}: ${n} → ${result} (expected ${expected})`)
      }
    }
  }
}

export const number_inPercentRange = number_isValidPercent

// ===== ASSERTION FUNCTIONS =====

export function number_throwIfNotValidNumber(num: number): asserts num is ValidNumber {
  if (!number_isValidNumber(num))
    throw new TypeError(`Invalid number: must have ≤20 digits before and ≤10 digits after dot, got ${num}`)
}

export function number_throwIfNotValidNonNegativeNumber(num: number): asserts num is ValidNonNegativeNumber {
  if (!number_isValidNonNegativeNumber(num))
    throw new TypeError(
      `Invalid non-negative number: must be ≥ 0 and have ≤20 digits before and ≤10 after dot, got ${num}`,
    )
}

export function number_throwIfNotInPercentRange(num: number): asserts num is ValidPercent {
  if (!number_isValidPercent(num)) throw new TypeError(`Percent must be between 0 and 100 inclusive, got ${num}`)
}

export function number_throwIfNotValidInt(num: number): asserts num is ValidInt {
  if (!number_isValidInt(num))
    throw new TypeError(`Invalid integer: must be whole number with ≤20 digits before dot, got ${num}`)
}

export function number_throwIfNotValidNonNegativeInt(num: number): asserts num is ValidNonNegativeInt {
  if (!number_isValidNonNegativeInt(num))
    throw new TypeError(`Invalid non-negative integer: must be ≥ 0 and whole, got ${num}`)
}

// // ===== NUMBER TO =====

// Converts a number to ValidNumber with rounding
export function numberToValidNumberOrUndefined(value: number, round = true): ValidNumber | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  let num = value
  if (round) num = Number(num.toFixed(validNumber__maxDigitsAfterDot))
  if (!number_isValidNumber(num)) return undefined
  return num
}

// Test cases
for (const [input, expected_nonrounded, expected_rounded] of [
  // clean numbers
  [42, 42, 42],
  [42.5, 42.5, 42.5],
  [0, 0, 0],
  [-0, 0, 0],

  // decimal variations
  [42.9, 42.9, 42.9],
  [0.5, 0.5, 0.5],

  // sign handling
  [-10, -10, -10],
  [-10.9, -10.9, -10.9],

  // invalid
  [NaN, undefined, undefined],
  [Infinity, undefined, undefined],
  [-Infinity, undefined, undefined],

  // test max validNumber__maxDigitsAfterDot
  [1.1, 1.1, 1.1],
  [1.11, 1.11, 1.11],
  [1.111, 1.111, 1.111],
  [1.1111, 1.1111, 1.1111],
  [1.1234567891, 1.1234567891, 1.1234567891],
  [1.12345678912, undefined, 1.1234567891],
  [1.1119, 1.1119, 1.1119],
  [1.12345678919, undefined, 1.1234567892],
  [100.0, 100, 100],
] as const) {
  const result_nonrounded = numberToValidNumberOrUndefined(input, false)
  const result_rounded = numberToValidNumberOrUndefined(input, true)

  if (result_nonrounded !== expected_nonrounded)
    console.error(
      `numberToValidNumberOrUndefined (round=false): for ${input} result=${result_nonrounded} expected=${expected_nonrounded}`,
    )
  if (result_rounded !== expected_rounded)
    console.error(
      `numberToValidNumberOrUndefined (round=true): for ${input} result=${result_rounded} expected=${expected_rounded}`,
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
  if (!number_isValidNonNegativeNumber(num)) return undefined
  return num
}

for (const [input, expected_TT, expected_TF, expected_FT, expected_FF] of [
  // Format: [input, round+clamp, round+noclamp, noround+clamp, noround+noclamp]

  // clean positive numbers
  [100, 100, 100, 100, 100],
  [100.0, 100, 100, 100, 100],
  [100.1, 100.1, 100.1, 100.1, 100.1],
  [101, 101, 101, 101, 101],

  // negative numbers
  [-100, 0, undefined, 0, undefined],
  [-10.1, 0, undefined, 0, undefined],
  [-0.5, 0, undefined, 0, undefined],

  // decimal precision
  [10.1, 10.1, 10.1, 10.1, 10.1],
  [10.11, 10.11, 10.11, 10.11, 10.11],
  [10.111, 10.111, 10.111, 10.111, 10.111],
  [10.1111, 10.1111, 10.1111, 10.1111, 10.1111],
  [10.1115, 10.1115, 10.1115, 10.1115, 10.1115],
  [10.12345678912, 10.1234567891, 10.1234567891, undefined, undefined],

  // edge cases
  [0, 0, 0, 0, 0],
  [-0, 0, 0, 0, 0],

  // invalid
  [NaN, undefined, undefined, undefined, undefined],
  [Infinity, undefined, undefined, undefined, undefined],
  [-Infinity, undefined, undefined, undefined, undefined],
] as const) {
  const result_TT = numberToValidNonNegativeNumberOrUndefined(input, true, true)
  const result_TF = numberToValidNonNegativeNumberOrUndefined(input, true, false)
  const result_FT = numberToValidNonNegativeNumberOrUndefined(input, false, true)
  const result_FF = numberToValidNonNegativeNumberOrUndefined(input, false, false)

  if (result_TT !== expected_TT)
    console.error(
      `numberToValidNonNegativeNumberOrUndefined (round=T, clamp=T): for ${input} result=${result_TT} expected=${expected_TT}`,
    )
  if (result_TF !== expected_TF)
    console.error(
      `numberToValidNonNegativeNumberOrUndefined (round=T, clamp=F): for ${input} result=${result_TF} expected=${expected_TF}`,
    )
  if (result_FT !== expected_FT)
    console.error(
      `numberToValidNonNegativeNumberOrUndefined (round=F, clamp=T): for ${input} result=${result_FT} expected=${expected_FT}`,
    )
  if (result_FF !== expected_FF)
    console.error(
      `numberToValidNonNegativeNumberOrUndefined (round=F, clamp=F): for ${input} result=${result_FF} expected=${expected_FF}`,
    )
}

// Converts a number to ValidPercent (0-100)
export function numberToValidPercentOrUndefined(value: number, round = true, clamp = true): ValidPercent | undefined {
  // Check for invalid values BEFORE clamping
  if (!Number.isFinite(value)) return undefined
  let num = value
  if (clamp) num = Math.min(100, Math.max(0, num)) // Clamp first if enabled
  if (round) num = Number(num.toFixed(validNumber__maxDigitsAfterDot)) // Then round if enabled
  if (!number_isValidPercent(num)) return undefined
  return num
}

{
  // Test cases: [input, [TT, TF, FT, FF]]
  // where TT = (round=true, clamp=true), TF = (round=true, clamp=false), etc.
  const testCases: [number, [number | undefined, number | undefined, number | undefined, number | undefined]][] = [
    // Basic valid percents
    [0, [0, 0, 0, 0]],
    [50, [50, 50, 50, 50]],
    [100, [100, 100, 100, 100]],
    [100.0, [100, 100, 100, 100]],

    // Simple decimals
    [10.1, [10.1, 10.1, 10.1, 10.1]],
    [10.11, [10.11, 10.11, 10.11, 10.11]],
    [99.9, [99.9, 99.9, 99.9, 99.9]],

    // Many decimal places
    [10.12345678901, [10.123456789, 10.123456789, undefined, undefined]],
    [10.11159, [10.11159, 10.11159, 10.11159, 10.11159]],
    [99.123456789012, [99.123456789, 99.123456789, undefined, undefined]],

    // Exactly at max digits (no rounding needed)
    [10.123456789, [10.123456789, 10.123456789, 10.123456789, 10.123456789]],

    // Out of range - needs clamping
    [101, [100, undefined, 100, undefined]],
    [150, [100, undefined, 100, undefined]],
    [100.1, [100, undefined, 100, undefined]],
    [105.5, [100, undefined, 100, undefined]],

    // Negative numbers
    [-1, [0, undefined, 0, undefined]],
    [-10, [0, undefined, 0, undefined]],
    [-100, [0, undefined, 0, undefined]],
    [-0, [0, 0, 0, 0]], // -0 becomes 0

    // Needs both rounding and clamping
    [100.12345678901, [100, undefined, 100, undefined]],
    [105.123456789, [100, undefined, 100, undefined]],

    // Edge cases with decimals
    [0.5, [0.5, 0.5, 0.5, 0.5]],

    // Rounds to exactly 100
    [99.9999999999, [99.9999999999, 99.9999999999, 99.9999999999, 99.9999999999]],
    [99.99999999999, [100, 100, undefined, undefined]],
    [100.0, [100, 100, 100, 100]],

    // Invalid
    [NaN, [undefined, undefined, undefined, undefined]],
    [Infinity, [undefined, undefined, undefined, undefined]],
    [-Infinity, [undefined, undefined, undefined, undefined]],
  ]

  // Run all permutations
  const permutations: [boolean, boolean][] = [
    [true, true], // round, clamp
    [true, false], // round, no clamp
    [false, true], // no round, clamp
    [false, false], // no round, no clamp
  ]

  for (const [input, expected] of testCases) {
    permutations.forEach(([round, clamp], i) => {
      const ctx = `(${input}, round=${round}, clamp=${clamp})`
      const exp = expected[i]

      const result = numberToValidPercentOrUndefined(input, round, clamp)

      if (result !== exp) {
        console.error(`❌ numberToValidPercentOrUndefined${ctx} -> Expected: ${exp} | Got: ${result}`)
      }
    })
  }
}

// Converts a number to ValidInt
export function numberToValidIntOrUndefined(value: number, round = true): ValidInt | undefined {
  if (typeof value !== 'number') return undefined
  let num = value
  if (round) num = Math.round(num)
  if (!number_isValidInt(num)) return undefined
  return num
}

for (const [input, expected_nonrounded, expected_rounded] of [
  // clean integers
  [42, 42, 42],
  [0, 0, 0],
  [-0, 0, 0],

  // decimals
  [42.9, undefined, 43],
  [42.1, undefined, 42],
  [42.5, undefined, 43], // rounds to nearest even (banker's rounding)

  // sign handling
  [-10, -10, -10],
  [-10.9, undefined, -11],
  [-10.1, undefined, -10],

  // invalid
  [NaN, undefined, undefined],
  [Infinity, undefined, undefined],
  [-Infinity, undefined, undefined],

  // edge cases
  [1.1, undefined, 1],
  [1.11, undefined, 1],
  [1.111, undefined, 1],
  [1.1111, undefined, 1],
  [1.1119, undefined, 1],
  [1.9999, undefined, 2],
  [1.9, undefined, 2],
] as const) {
  const result_nonrounded = numberToValidIntOrUndefined(input, false)
  const result_rounded = numberToValidIntOrUndefined(input, true)

  if (result_nonrounded !== expected_nonrounded)
    console.error(
      `numberToValidIntOrUndefined (round=false): for ${input} result=${result_nonrounded} expected=${expected_nonrounded}`,
    )
  if (result_rounded !== expected_rounded)
    console.error(
      `numberToValidIntOrUndefined (round=true): for ${input} result=${result_rounded} expected=${expected_rounded}`,
    )
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
  if (!number_isValidNonNegativeInt(num)) return undefined
  return num
}

for (const [input, expected_TT, expected_TF, expected_FT, expected_FF] of [
  // Format: [input, round+clamp, round+noclamp, noround+clamp, noround+noclamp]

  // clean integers
  [42, 42, 42, 42, 42],
  [0, 0, 0, 0, 0],
  [-0, 0, 0, 0, 0],

  // decimals
  [42.9, 43, 43, undefined, undefined],
  [42.1, 42, 42, undefined, undefined],

  // negative numbers
  [-10, 0, undefined, 0, undefined],
  [-10.9, 0, undefined, 0, undefined],
  [-10.1, 0, undefined, 0, undefined],

  // invalid
  [NaN, undefined, undefined, undefined, undefined],
  [Infinity, undefined, undefined, undefined, undefined],
  [-Infinity, 0, undefined, 0, undefined],

  // edge cases
  [1.1, 1, 1, undefined, undefined],
  [1.11, 1, 1, undefined, undefined],
  [1.111, 1, 1, undefined, undefined],
  [1.1111, 1, 1, undefined, undefined],
  [1.1119, 1, 1, undefined, undefined],
  [1.9999, 2, 2, undefined, undefined],
  [1.9, 2, 2, undefined, undefined],
] as const) {
  const result_TT = numberToValidNonNegativeIntOrUndefined(input, true, true)
  const result_TF = numberToValidNonNegativeIntOrUndefined(input, true, false)
  const result_FT = numberToValidNonNegativeIntOrUndefined(input, false, true)
  const result_FF = numberToValidNonNegativeIntOrUndefined(input, false, false)

  if (result_TT !== expected_TT)
    console.error(
      `numberToValidNonNegativeIntOrUndefined (round=T, clamp=T): for ${input} result=${result_TT} expected=${expected_TT}`,
    )
  if (result_TF !== expected_TF)
    console.error(
      `numberToValidNonNegativeIntOrUndefined (round=T, clamp=F): for ${input} result=${result_TF} expected=${expected_TF}`,
    )
  if (result_FT !== expected_FT)
    console.error(
      `numberToValidNonNegativeIntOrUndefined (round=F, clamp=T): for ${input} result=${result_FT} expected=${expected_FT}`,
    )
  if (result_FF !== expected_FF)
    console.error(
      `numberToValidNonNegativeIntOrUndefined (round=F, clamp=F): for ${input} result=${result_FF} expected=${expected_FF}`,
    )
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

// Test cases
for (const [input, expected_strToNumberOrUndefined_lenient, expected_strToNumberOrUndefined_strict] of [
  // clean numbers
  ['42', 42, 42],
  ['42.5', 42.5, 42.5],
  ['  42  ', 42, undefined],
  ['  42.5  ', 42.5, undefined],
  ['0042', 42, 42],
  ['0042.5', 42.5, 42.5],
  // decimal variations
  ['42.9', 42.9, 42.9],
  ['.5', 0.5, 0.5],
  ['0.5', 0.5, 0.5],
  ['42.', 42, 42],
  // scientific notation
  ['1e2', 100, 100],
  ['1.5e2', 150, 150],
  ['1e-2', 0.01, 0.01],
  // trailing junk
  ['42px', 42, undefined], // parseFloat accepts prefix, Number() fails
  ['42.5px', 42.5, undefined],
  // prefix junk
  ['px42', undefined, undefined], // both fail
  // empty / whitespace
  ['', undefined, undefined],
  ['   ', undefined, undefined],
  // sign handling
  ['-10', -10, -10],
  ['+10', 10, 10],
  ['-10.9', -10.9, -10.9],
  ['+10.9', 10.9, 10.9],
  // invalid
  ['abc', undefined, undefined],
  ['Infinity', undefined, undefined],
  ['-Infinity', undefined, undefined],
  ['NaN', undefined, undefined],
  // edge cases
  ['0', 0, 0],
  ['-0', 0, 0],
  ['0.0', 0, 0],
  // multiple dots
  ['1.2.3', 1.2, undefined], // parseFloat stops at second dot
  // test max validNumber__maxDigitsAfterDot
  ['1.1', 1.1, 1.1],
  ['1.11', 1.11, 1.11],
  ['1.111', 1.111, 1.111],
  ['1.1111', 1.1111, 1.1111],
  ['1.1234567891', 1.1234567891, 1.1234567891],
  ['1.12345678912', 1.1234567891, 1.1234567891],
  ['1.1119', 1.1119, 1.1119],
  ['1.12345678919', 1.1234567892, 1.1234567892],
  ['100.0', 100, 100],
] as const) {
  const result_lenient = strToNumberOrUndefined_lenient(input)
  const result_strict = strToNumberOrUndefined_strict(input)

  if (result_lenient !== expected_strToNumberOrUndefined_lenient)
    console.error(
      `strToNumberOrUndefined_lenient: for "${input}" result=${result_lenient} expected=${expected_strToNumberOrUndefined_lenient}`,
    )
  if (result_strict !== expected_strToNumberOrUndefined_strict)
    console.error(
      `strToNumberOrUndefined_strict: for "${input}" result=${result_strict} expected=${expected_strToNumberOrUndefined_strict}`,
    )
}

export function strToNonNegativeNumberOrUndefined_lenient(value: string): ValidNonNegativeNumber | undefined {
  const num = strToNumberOrUndefined_lenient(value)
  if (num === undefined) return undefined
  if (!validNumber_isValidNonNegativeNumber(num)) return undefined
  return num
}

// Converts a string to a non-negative number (strict mode)
// e.g. "0" -> 0, "10.5" -> 10.5, "-1" -> undefined, "abc" -> undefined
export function strToNonNegativeNumberOrUndefined_strict(value: string): ValidNonNegativeNumber | undefined {
  const num = strToNumberOrUndefined_strict(value)
  if (num === undefined) return undefined
  if (!validNumber_isValidNonNegativeNumber(num)) return undefined
  return num
}

for (const [input, expected_lenient, expected_strict] of [
  ['100', 100, 100],
  ['100.0', 100, 100],
  ['100.1', 100.1, 100.1],
  ['101', 101, 101],
  ['px101', undefined, undefined],
  ['101px', 101, undefined],
  ['-100', undefined, undefined],
  ['10.1', 10.1, 10.1],
  ['10.11', 10.11, 10.11],
  ['10.111', 10.111, 10.111],
  ['10.1111', 10.1111, 10.1111],
  ['10.1115', 10.1115, 10.1115],
] as const) {
  const result_lenient = strToNonNegativeNumberOrUndefined_lenient(input)
  if (!(result_lenient === expected_lenient))
    console.error(
      `strToNonNegativeNumberOrUndefined_lenient -> Assertion failed: Input: "${input}" | Expected: ${expected_lenient} | Got: ${result_lenient}`,
    )
  const result_strict = strToNonNegativeNumberOrUndefined_strict(input)
  if (!(result_strict === expected_strict))
    console.error(
      `strToNonNegativeNumberOrUndefined_strict -> Assertion failed: Input: "${input}" | Expected: ${expected_strict} | Got: ${result_strict}`,
    )
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

{
  // Test cases: [input, expected_lenient, expected_strict]
  // Will be tested with all 4 permutations: (round,clamp) = (true,true), (true,false), (false,true), (false,false)
  const testCases: [
    string,
    [number | undefined, number | undefined, number | undefined, number | undefined], // lenient: [TT, TF, FT, FF]
    [number | undefined, number | undefined, number | undefined, number | undefined], // strict: [TT, TF, FT, FF]
  ][] = [
    // Format: [input, [lenient_TT, lenient_TF, lenient_FT, lenient_FF], [strict_TT, strict_TF, strict_FT, strict_FF]]
    // where TT = (round=true, clamp=true), TF = (round=true, clamp=false), etc.

    // Basic valid percents
    ['0', [0, 0, 0, 0], [0, 0, 0, 0]],
    ['50', [50, 50, 50, 50], [50, 50, 50, 50]],
    ['100', [100, 100, 100, 100], [100, 100, 100, 100]],
    ['100.0', [100, 100, 100, 100], [100, 100, 100, 100]],

    // Simple decimals
    ['10.1', [10.1, 10.1, 10.1, 10.1], [10.1, 10.1, 10.1, 10.1]],
    ['10.11', [10.11, 10.11, 10.11, 10.11], [10.11, 10.11, 10.11, 10.11]],
    ['99.9', [99.9, 99.9, 99.9, 99.9], [99.9, 99.9, 99.9, 99.9]],

    // Many decimal places - strToNumberOrUndefined already rounds with toFixed
    [
      '10.12345678901',
      [10.123456789, 10.123456789, 10.123456789, 10.123456789],
      [10.123456789, 10.123456789, 10.123456789, 10.123456789],
    ],
    ['10.11159', [10.11159, 10.11159, 10.11159, 10.11159], [10.11159, 10.11159, 10.11159, 10.11159]],
    [
      '99.123456789012',
      [99.123456789, 99.123456789, 99.123456789, 99.123456789],
      [99.123456789, 99.123456789, 99.123456789, 99.123456789],
    ],

    // Exactly at max digits (no rounding needed)
    [
      '10.1234567890',
      [10.123456789, 10.123456789, 10.123456789, 10.123456789],
      [10.123456789, 10.123456789, 10.123456789, 10.123456789],
    ],

    // Out of range - needs clamping
    ['101', [100, undefined, 100, undefined], [100, undefined, 100, undefined]],
    ['150', [100, undefined, 100, undefined], [100, undefined, 100, undefined]],
    ['100.1', [100, undefined, 100, undefined], [100, undefined, 100, undefined]],
    ['105.5', [100, undefined, 100, undefined], [100, undefined, 100, undefined]],

    // Negative numbers (always undefined)
    ['-1', [0, undefined, 0, undefined], [undefined, undefined, undefined, undefined]],
    ['-10', [0, undefined, 0, undefined], [undefined, undefined, undefined, undefined]],
    ['-100', [0, undefined, 0, undefined], [undefined, undefined, undefined, undefined]],

    // Needs both rounding and clamping
    ['100.12345678901', [100, undefined, 100, undefined], [100, undefined, 100, undefined]],
    ['105.123456789', [100, undefined, 100, undefined], [100, undefined, 100, undefined]],

    // Lenient vs Strict: suffixes (lenient accepts, strict rejects)
    ['50px', [50, 50, 50, 50], [undefined, undefined, undefined, undefined]],
    ['100.5px', [100, undefined, 100, undefined], [undefined, undefined, undefined, undefined]],
    ['75.25abc', [75.25, 75.25, 75.25, 75.25], [undefined, undefined, undefined, undefined]],
    ['101px', [100, undefined, 100, undefined], [undefined, undefined, undefined, undefined]],

    // Lenient vs Strict: whitespace (lenient accepts, strict rejects)
    ['  50  ', [50, 50, 50, 50], [undefined, undefined, undefined, undefined]],
    ['50 ', [50, 50, 50, 50], [undefined, undefined, undefined, undefined]],
    [' 50', [50, 50, 50, 50], [undefined, undefined, undefined, undefined]],

    // Both reject prefix junk
    ['px50', [undefined, undefined, undefined, undefined], [undefined, undefined, undefined, undefined]],

    // Invalid inputs
    ['', [undefined, undefined, undefined, undefined], [undefined, undefined, undefined, undefined]],
    ['abc', [undefined, undefined, undefined, undefined], [undefined, undefined, undefined, undefined]],
    ['   ', [undefined, undefined, undefined, undefined], [undefined, undefined, undefined, undefined]],

    // Edge cases with decimals
    ['.5', [0.5, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
    ['0.5', [0.5, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
    ['100.', [100, 100, 100, 100], [100, 100, 100, 100]],

    // Scientific notation (both accept)
    ['1e1', [10, 10, 10, 10], [10, 10, 10, 10]],
    ['5e1', [50, 50, 50, 50], [50, 50, 50, 50]],
    ['1e2', [100, 100, 100, 100], [100, 100, 100, 100]],
    ['1.5e2', [100, undefined, 100, undefined], [100, undefined, 100, undefined]], // 150 needs clamp

    // Signs
    ['+50', [50, 50, 50, 50], [50, 50, 50, 50]],
    ['+100.5', [100, undefined, 100, undefined], [100, undefined, 100, undefined]],
    ['-0', [0, 0, 0, 0], [0, 0, 0, 0]], // -0 becomes 0 in JS, which is >= 0

    // Rounds to exactly 100
    [
      '99.9999999999',
      [99.9999999999, 99.9999999999, 99.9999999999, 99.9999999999],
      [99.9999999999, 99.9999999999, 99.9999999999, 99.9999999999],
    ],
    ['99.99999999999', [100, 100, 100, 100], [100, 100, 100, 100]],
    ['100.0000000000', [100, 100, 100, 100], [100, 100, 100, 100]],
  ]

  // Run all permutations
  const permutations: [boolean, boolean][] = [
    [true, true], // round, clamp
    [true, false], // round, no clamp
    [false, true], // no round, clamp
    [false, false], // no round, no clamp
  ]

  for (const [input, expectedLenient, expectedStrict] of testCases) {
    permutations.forEach(([round, clamp], i) => {
      const ctx = `("${input}", round=${round}, clamp=${clamp})`
      const expectedL = expectedLenient[i]
      const expectedS = expectedStrict[i]

      const resultL = strToPercentOrUndefined_lenient(input, round, clamp)
      const resultS = strToPercentOrUndefined_strict(input, round, clamp)

      if (resultL !== expectedL) {
        console.error(`❌ strToPercentOrUndefined_lenient${ctx} -> Expected: ${expectedL} | Got: ${resultL}`)
      }

      if (resultS !== expectedS) {
        console.error(`❌ strToPercentOrUndefined_strict${ctx} -> Expected: ${expectedS} | Got: ${resultS}`)
      }
    })
  }
}

for (const [input, expected] of [
  ['100', 100],
  ['100.0', 100],
  ['100.1', 100],
  ['101', 100],
  ['-100', undefined],
  ['10.1', 10.1],
  ['10.11', 10.11],
  ['10.111', 10.111],
  ['10.1111', 10.1111],
  ['10.1115', 10.1115],
] as const) {
  const result = strToPercentOrUndefined_strict(input, true, true)
  if (!(result === expected))
    console.error(
      `strToPercentOrUndefined_clamp -> Assertion failed: Input: "${input}" | Expected: ${expected} | Got: ${result}`,
    )
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

for (const [input, expected_lenient, expected_strict_nonrounded, expected_strict_rounded] of [
  // clean numbers
  ['42', 42, 42, 42],
  ['  42  ', 42, undefined, undefined],
  ['0042', 42, 42, 42],
  // decimal
  ['42.9', 42, undefined, 43], // parseInt truncates, Number() gives 42.9 (not int)
  // trailing junk
  ['42px', 42, undefined, undefined], // parseInt accepts prefix, Number() fails
  // prefix junk
  ['px42', undefined, undefined, undefined], // both fail
  // empty / whitespace
  ['', undefined, undefined, undefined],
  ['   ', undefined, undefined, undefined],
  // sign handling
  ['-10', -10, -10, -10],
  ['+10', 10, 10, 10],
  ['-10.9', -10, undefined, -11], // parseInt truncates
  // invalid
  ['abc', undefined, undefined, undefined],
  // test max validNumber__maxDigitsAfterDot
  ['1.1', 1, undefined, 1],
  ['1.11', 1, undefined, 1],
  ['1.111', 1, undefined, 1],
  ['1.1111', 1, undefined, 1],
  ['1.1119', 1, undefined, 1],
  ['1.9999', 1, undefined, 2],
  ['1.9', 1, undefined, 2],
] as const) {
  const result_lenient = strToIntOrUndefined_lenient(input)
  const result_strict_nonrounded = strToIntOrUndefined_strict(input, false)
  const result_strict_rounded = strToIntOrUndefined_strict(input, true)
  if (result_lenient !== expected_lenient)
    console.error(`strToIntOrUndefined_lenient: for "${input}" result=${result_lenient} expected=${expected_lenient}`)
  if (result_strict_nonrounded !== expected_strict_nonrounded)
    console.error(
      `strToIntOrUndefined_strict: for "${input}" result=${result_strict_nonrounded} expected=${expected_strict_nonrounded}`,
    )
  if (result_strict_rounded !== expected_strict_rounded)
    console.error(
      `strToIntOrUndefined_strict rounded: for "${input}" result=${result_strict_rounded} expected=${expected_strict_rounded}`,
    )
}

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

for (const [input, expected_lenient, expected_strict_nonrounded, expected_strict_rounded] of [
  // clean numbers
  ['42', 42, 42, 42],
  ['  42  ', 42, undefined, undefined],
  ['0042', 42, 42, 42],
  // decimal
  ['42.9', 42, undefined, 43], // parseInt truncates, Number() gives 42.9 (rounded)
  // trailing junk
  ['42px', 42, undefined, undefined], // parseInt accepts prefix, Number() fails
  // prefix junk
  ['px42', undefined, undefined, undefined], // both fail
  // empty / whitespace
  ['', undefined, undefined, undefined],
  ['   ', undefined, undefined, undefined],
  // sign handling
  ['-10', undefined, undefined, 0],
  ['+10', 10, 10, 10],
  ['-10.9', undefined, undefined, 0], // parseInt truncates negative -> 0 in strict
  // invalid
  ['abc', undefined, undefined, undefined],
  // test max validNumber__maxDigitsAfterDot
  ['1.1', 1, undefined, 1],
  ['1.11', 1, undefined, 1],
  ['1.111', 1, undefined, 1],
  ['1.1111', 1, undefined, 1],
  ['1.1119', 1, undefined, 1],
  ['1.9999', 1, undefined, 2],
  ['1.9', 1, undefined, 2],
] as const) {
  const result_lenient = strToNonNegativeIntOrUndefined_lenient(input)
  const result_strict_nonrounded = strToNonNegativeIntOrUndefined_strict(input, false)
  const result_strict_rounded = strToNonNegativeIntOrUndefined_strict(input, true)
  if (result_lenient !== expected_lenient)
    console.error(
      `strToNonNegativeIntOrUndefined_lenient: for "${input}" result=${result_lenient} expected=${expected_lenient}`,
    )
  if (result_strict_nonrounded !== expected_strict_nonrounded)
    console.error(
      `strToNonNegativeIntOrUndefined_strict: for "${input}" result=${result_strict_nonrounded} expected=${expected_strict_nonrounded}`,
    )
  if (result_strict_rounded !== expected_strict_rounded)
    console.error(
      `strToNonNegativeIntOrUndefined_strict rounded: for "${input}" result=${result_strict_rounded} expected=${expected_strict_rounded}`,
    )
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

// ===== STR OR NUMBER TO =====

// Number or string -> ValidNumber
export function strOrNumberToNumberOrUndefined_lenient(value: string | number): undefined | ValidNumber {
  if (typeof value === 'number') return numberToValidNumberOrUndefined(value, true)
  return strToNumberOrUndefined_lenient(value)
}

export function strOrNumberToNumberOrUndefined_strict(value: string | number): undefined | ValidNumber {
  if (typeof value === 'number') return numberToValidNumberOrUndefined(value, true)
  return strToNumberOrUndefined_strict(value)
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

///////////////////////

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

// ===== Unknown TO =====

export function unknownToNumberOrUndefined_lenient(value: unknown): undefined | ValidNumber {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  return strOrNumberToNumberOrUndefined_lenient(value)
}

export function unknownToNumberOrUndefined_strict(value: unknown): undefined | ValidNumber {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  return strOrNumberToNumberOrUndefined_strict(value)
}

export function unknownToNonNegativeNumberOrUndefined_lenient(value: unknown): undefined | ValidNonNegativeNumber {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  return strOrNumberToNonNegativeNumberOrUndefined_lenient(value)
}

export function unknownToNonNegativeNumberOrUndefined_strict(value: unknown): undefined | ValidNonNegativeNumber {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  return strOrNumberToNonNegativeNumberOrUndefined_strict(value)
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

export function unknownToIntOrUndefined_lenient(value: unknown): undefined | ValidInt {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  return strOrNumberToIntOrUndefined_lenient(value)
}

export function unknownToIntOrUndefined_strict(value: unknown, round: boolean = true): undefined | ValidInt {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  return strOrNumberToIntOrUndefined_strict(value, round)
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

///////////////////////

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
