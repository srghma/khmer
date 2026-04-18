import { describe, it, expect } from 'vitest'
import {
  numberToValidNonNegativeNumberOrUndefined,
  strToNonNegativeNumberOrUndefined_lenient,
  strToNonNegativeNumberOrUndefined_strict,
  number_isValidNonNegativeNumber,
} from './validNonNegativeNumber.js'
import { validNonNegativeNumberCases } from './test-data.js'

describe('validNonNegativeNumber utils', () => {
  describe('number_isValidNonNegativeNumber', () => {
    it('should correctly validate non-negative numbers', () => {
      for (const [input, expected] of validNonNegativeNumberCases) {
        expect(number_isValidNonNegativeNumber(input), `Failed for ${input}`).toBe(expected)
      }
    })
  })

  describe('numberToValidNonNegativeNumberOrUndefined', () => {
    it('should convert numbers correctly with round and clamp', () => {
      const cases = [
        // Format: [input, round+clamp, round+noclamp, noround+clamp, noround+noclamp]
        [100, 100, 100, 100, 100],
        [100.0, 100, 100, 100, 100],
        [100.1, 100.1, 100.1, 100.1, 100.1],
        [101, 101, 101, 101, 101],
        [-100, 0, undefined, 0, undefined],
        [-10.1, 0, undefined, 0, undefined],
        [-0.5, 0, undefined, 0, undefined],
        [10.1, 10.1, 10.1, 10.1, 10.1],
        [10.11, 10.11, 10.11, 10.11, 10.11],
        [10.111, 10.111, 10.111, 10.111, 10.111],
        [10.1111, 10.1111, 10.1111, 10.1111, 10.1111],
        [10.1115, 10.1115, 10.1115, 10.1115, 10.1115],
        // [10.12345678912, 10.1234567891, 10.1234567891, undefined, undefined],
        [0, 0, 0, 0, 0],
        [-0, 0, 0, 0, 0],
        [NaN, undefined, undefined, undefined, undefined],
        [Infinity, undefined, undefined, undefined, undefined],
        [-Infinity, undefined, undefined, undefined, undefined],
      ] as const

      for (const [input, expected_TT, expected_TF, expected_FT, expected_FF] of cases) {
        expect(numberToValidNonNegativeNumberOrUndefined(input, true, true)).toBe(expected_TT)
        expect(numberToValidNonNegativeNumberOrUndefined(input, true, false)).toBe(expected_TF)
        expect(numberToValidNonNegativeNumberOrUndefined(input, false, true)).toBe(expected_FT)
        expect(numberToValidNonNegativeNumberOrUndefined(input, false, false)).toBe(expected_FF)
      }
    })
  })

  describe('strToNonNegativeNumberOrUndefined', () => {
    it('should convert strings correctly', () => {
      const cases = [
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
      ] as const

      for (const [input, expected_lenient, expected_strict] of cases) {
        expect(strToNonNegativeNumberOrUndefined_lenient(input)).toBe(expected_lenient)
        expect(strToNonNegativeNumberOrUndefined_strict(input)).toBe(expected_strict)
      }
    })
  })
})

// for (const [input, expected_TT, expected_TF, expected_FT, expected_FF] of [
//   // Format: [input, round+clamp, round+noclamp, noround+clamp, noround+noclamp]
//
//   // clean positive numbers
//   [100, 100, 100, 100, 100],
//   [100.0, 100, 100, 100, 100],
//   [100.1, 100.1, 100.1, 100.1, 100.1],
//   [101, 101, 101, 101, 101],
//
//   // negative numbers
//   [-100, 0, undefined, 0, undefined],
//   [-10.1, 0, undefined, 0, undefined],
//   [-0.5, 0, undefined, 0, undefined],
//
//   // decimal precision
//   [10.1, 10.1, 10.1, 10.1, 10.1],
//   [10.11, 10.11, 10.11, 10.11, 10.11],
//   [10.111, 10.111, 10.111, 10.111, 10.111],
//   [10.1111, 10.1111, 10.1111, 10.1111, 10.1111],
//   [10.1115, 10.1115, 10.1115, 10.1115, 10.1115],
//   [10.12345678912, 10.1234567891, 10.1234567891, undefined, undefined],
//
//   // edge cases
//   [0, 0, 0, 0, 0],
//   [-0, 0, 0, 0, 0],
//
//   // invalid
//   [NaN, undefined, undefined, undefined, undefined],
//   [Infinity, undefined, undefined, undefined, undefined],
//   [-Infinity, undefined, undefined, undefined, undefined],
// ] as const) {
//   const result_TT = numberToValidNonNegativeNumberOrUndefined(input, true, true)
//   const result_TF = numberToValidNonNegativeNumberOrUndefined(input, true, false)
//   const result_FT = numberToValidNonNegativeNumberOrUndefined(input, false, true)
//   const result_FF = numberToValidNonNegativeNumberOrUndefined(input, false, false)
//
//   if (result_TT !== expected_TT)
//     console.error(
//       `numberToValidNonNegativeNumberOrUndefined (round=T, clamp=T): for ${input} result=${result_TT} expected=${expected_TT}`,
//     )
//   if (result_TF !== expected_TF)
//     console.error(
//       `numberToValidNonNegativeNumberOrUndefined (round=T, clamp=F): for ${input} result=${result_TF} expected=${expected_TF}`,
//     )
//   if (result_FT !== expected_FT)
//     console.error(
//       `numberToValidNonNegativeNumberOrUndefined (round=F, clamp=T): for ${input} result=${result_FT} expected=${expected_FT}`,
//     )
//   if (result_FF !== expected_FF)
//     console.error(
//       `numberToValidNonNegativeNumberOrUndefined (round=F, clamp=F): for ${input} result=${result_FF} expected=${expected_FF}`,
//     )
// }
// for (const [input, expected_lenient, expected_strict] of [
//   ['100', 100, 100],
//   ['100.0', 100, 100],
//   ['100.1', 100.1, 100.1],
//   ['101', 101, 101],
//   ['px101', undefined, undefined],
//   ['101px', 101, undefined],
//   ['-100', undefined, undefined],
//   ['10.1', 10.1, 10.1],
//   ['10.11', 10.11, 10.11],
//   ['10.111', 10.111, 10.111],
//   ['10.1111', 10.1111, 10.1111],
//   ['10.1115', 10.1115, 10.1115],
// ] as const) {
//   const result_lenient = strToNonNegativeNumberOrUndefined_lenient(input)
//   if (!(result_lenient === expected_lenient))
//     console.error(
//       `strToNonNegativeNumberOrUndefined_lenient -> Assertion failed: Input: "${input}" | Expected: ${expected_lenient} | Got: ${result_lenient}`,
//     )
//   const result_strict = strToNonNegativeNumberOrUndefined_strict(input)
//   if (!(result_strict === expected_strict))
//     console.error(
//       `strToNonNegativeNumberOrUndefined_strict -> Assertion failed: Input: "${input}" | Expected: ${expected_strict} | Got: ${result_strict}`,
//     )
// }
