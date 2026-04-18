import { describe, it, expect } from 'vitest'
import {
  numberToValidNonNegativeIntOrUndefined,
  strToNonNegativeIntOrUndefined_lenient,
  strToNonNegativeIntOrUndefined_strict,
  number_isValidNonNegativeInt,
} from './validNonNegativeInt.js'
import { validNonNegativeIntCases } from './test-data.js'

describe('validNonNegativeInt utils', () => {
  describe('number_isValidNonNegativeInt', () => {
    it('should correctly validate non-negative integers', () => {
      for (const [input, expected] of validNonNegativeIntCases) {
        expect(number_isValidNonNegativeInt(input), `Failed for ${input}`).toBe(expected)
      }
    })
  })

  describe('numberToValidNonNegativeIntOrUndefined', () => {
    it('should convert numbers correctly with round and clamp', () => {
      const cases = [
        // Format: [input, round+clamp, round+noclamp, noround+clamp, noround+noclamp]
        [42, 42, 42, 42, 42],
        [0, 0, 0, 0, 0],
        [-0, 0, 0, 0, 0],
        [42.9, 43, 43, undefined, undefined],
        [42.1, 42, 42, undefined, undefined],
        [-10, 0, undefined, 0, undefined],
        [-10.9, 0, undefined, 0, undefined],
        [-10.1, 0, undefined, 0, undefined],
        [NaN, undefined, undefined, undefined, undefined],
        [Infinity, undefined, undefined, undefined, undefined],
        [-Infinity, 0, undefined, 0, undefined],
        [1.1, 1, 1, undefined, undefined],
        [1.9, 2, 2, undefined, undefined],
      ] as const

      for (const [input, expected_TT, expected_TF, expected_FT, expected_FF] of cases) {
        expect(numberToValidNonNegativeIntOrUndefined(input, true, true)).toBe(expected_TT)
        expect(numberToValidNonNegativeIntOrUndefined(input, true, false)).toBe(expected_TF)
        expect(numberToValidNonNegativeIntOrUndefined(input, false, true)).toBe(expected_FT)
        expect(numberToValidNonNegativeIntOrUndefined(input, false, false)).toBe(expected_FF)
      }
    })
  })

  describe('strToNonNegativeIntOrUndefined', () => {
    it('should convert strings correctly', () => {
      const cases = [
        ['42', 42, 42, 42],
        ['  42  ', 42, undefined, undefined],
        ['0042', 42, 42, 42],
        ['42.9', 42, undefined, 43], // parseInt truncates, Number() gives 42.9 (rounded)
        ['42px', 42, undefined, undefined], // parseInt accepts prefix, Number() fails
        ['px42', undefined, undefined, undefined], // both fail
        ['-10', undefined, undefined, 0],
        ['+10', 10, 10, 10],
        ['-10.9', undefined, undefined, 0], // parseInt truncates negative -> 0 in strict
        ['abc', undefined, undefined, undefined],
        ['1.1', 1, undefined, 1],
        ['1.9', 1, undefined, 2],
      ] as const

      for (const [input, expected_lenient, expected_strict_nonrounded, expected_strict_rounded] of cases) {
        expect(strToNonNegativeIntOrUndefined_lenient(input)).toBe(expected_lenient)
        expect(strToNonNegativeIntOrUndefined_strict(input, false)).toBe(expected_strict_nonrounded)
        expect(strToNonNegativeIntOrUndefined_strict(input, true)).toBe(expected_strict_rounded)
      }
    })
  })
})

// for (const [input, expected_TT, expected_TF, expected_FT, expected_FF] of [
//   // Format: [input, round+clamp, round+noclamp, noround+clamp, noround+noclamp]
//
//   // clean integers
//   [42, 42, 42, 42, 42],
//   [0, 0, 0, 0, 0],
//   [-0, 0, 0, 0, 0],
//
//   // decimals
//   [42.9, 43, 43, undefined, undefined],
//   [42.1, 42, 42, undefined, undefined],
//
//   // negative numbers
//   [-10, 0, undefined, 0, undefined],
//   [-10.9, 0, undefined, 0, undefined],
//   [-10.1, 0, undefined, 0, undefined],
//
//   // invalid
//   [NaN, undefined, undefined, undefined, undefined],
//   [Infinity, undefined, undefined, undefined, undefined],
//   [-Infinity, 0, undefined, 0, undefined],
//
//   // edge cases
//   [1.1, 1, 1, undefined, undefined],
//   [1.11, 1, 1, undefined, undefined],
//   [1.111, 1, 1, undefined, undefined],
//   [1.1111, 1, 1, undefined, undefined],
//   [1.1119, 1, 1, undefined, undefined],
//   [1.9999, 2, 2, undefined, undefined],
//   [1.9, 2, 2, undefined, undefined],
// ] as const) {
//   const result_TT = numberToValidNonNegativeIntOrUndefined(input, true, true)
//   const result_TF = numberToValidNonNegativeIntOrUndefined(input, true, false)
//   const result_FT = numberToValidNonNegativeIntOrUndefined(input, false, true)
//   const result_FF = numberToValidNonNegativeIntOrUndefined(input, false, false)
//
//   if (result_TT !== expected_TT)
//     console.error(
//       `numberToValidNonNegativeIntOrUndefined (round=T, clamp=T): for ${input} result=${result_TT} expected=${expected_TT}`,
//     )
//   if (result_TF !== expected_TF)
//     console.error(
//       `numberToValidNonNegativeIntOrUndefined (round=T, clamp=F): for ${input} result=${result_TF} expected=${expected_TF}`,
//     )
//   if (result_FT !== expected_FT)
//     console.error(
//       `numberToValidNonNegativeIntOrUndefined (round=F, clamp=T): for ${input} result=${result_FT} expected=${expected_FT}`,
//     )
//   if (result_FF !== expected_FF)
//     console.error(
//       `numberToValidNonNegativeIntOrUndefined (round=F, clamp=F): for ${input} result=${result_FF} expected=${expected_FF}`,
//     )
// }
// for (const [input, expected_lenient, expected_strict_nonrounded, expected_strict_rounded] of [
//   // clean numbers
//   ['42', 42, 42, 42],
//   ['  42  ', 42, undefined, undefined],
//   ['0042', 42, 42, 42],
//   // decimal
//   ['42.9', 42, undefined, 43], // parseInt truncates, Number() gives 42.9 (rounded)
//   // trailing junk
//   ['42px', 42, undefined, undefined], // parseInt accepts prefix, Number() fails
//   // prefix junk
//   ['px42', undefined, undefined, undefined], // both fail
//   // empty / whitespace
//   ['', undefined, undefined, undefined],
//   ['   ', undefined, undefined, undefined],
//   // sign handling
//   ['-10', undefined, undefined, 0],
//   ['+10', 10, 10, 10],
//   ['-10.9', undefined, undefined, 0], // parseInt truncates negative -> 0 in strict
//   // invalid
//   ['abc', undefined, undefined, undefined],
//   // test max validNumber__maxDigitsAfterDot
//   ['1.1', 1, undefined, 1],
//   ['1.11', 1, undefined, 1],
//   ['1.111', 1, undefined, 1],
//   ['1.1111', 1, undefined, 1],
//   ['1.1119', 1, undefined, 1],
//   ['1.9999', 1, undefined, 2],
//   ['1.9', 1, undefined, 2],
// ] as const) {
//   const result_lenient = strToNonNegativeIntOrUndefined_lenient(input)
//   const result_strict_nonrounded = strToNonNegativeIntOrUndefined_strict(input, false)
//   const result_strict_rounded = strToNonNegativeIntOrUndefined_strict(input, true)
//   if (result_lenient !== expected_lenient)
//     console.error(
//       `strToNonNegativeIntOrUndefined_lenient: for "${input}" result=${result_lenient} expected=${expected_lenient}`,
//     )
//   if (result_strict_nonrounded !== expected_strict_nonrounded)
//     console.error(
//       `strToNonNegativeIntOrUndefined_strict: for "${input}" result=${result_strict_nonrounded} expected=${expected_strict_nonrounded}`,
//     )
//   if (result_strict_rounded !== expected_strict_rounded)
//     console.error(
//       `strToNonNegativeIntOrUndefined_strict rounded: for "${input}" result=${result_strict_rounded} expected=${expected_strict_rounded}`,
//     )
// }
