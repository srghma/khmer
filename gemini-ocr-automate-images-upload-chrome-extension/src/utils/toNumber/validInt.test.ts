import { describe, it, expect } from 'vitest'
import {
  numberToValidIntOrUndefined,
  strToIntOrUndefined_lenient,
  strToIntOrUndefined_strict,
} from './validInt.js'

describe('validInt utils', () => {
  describe('numberToValidIntOrUndefined', () => {
    it('should convert numbers correctly', () => {
      const cases = [
        [42, 42, 42],
        [0, 0, 0],
        [-0, 0, 0],
        [42.9, undefined, 43],
        [42.1, undefined, 42],
        [42.5, undefined, 43], // rounds to nearest even (banker's rounding)
        [-10, -10, -10],
        [-10.9, undefined, -11],
        [-10.1, undefined, -10],
        [NaN, undefined, undefined],
        [Infinity, undefined, undefined],
        [-Infinity, undefined, undefined],
        [1.1, undefined, 1],
        [1.9, undefined, 2],
      ] as const

      for (const [input, expected_nonrounded, expected_rounded] of cases) {
        expect(numberToValidIntOrUndefined(input, false)).toBe(expected_nonrounded)
        expect(numberToValidIntOrUndefined(input, true)).toBe(expected_rounded)
      }
    })
  })

  describe('strToIntOrUndefined', () => {
    it('should convert strings correctly', () => {
      const cases = [
        ['42', 42, 42, 42],
        ['  42  ', 42, undefined, undefined],
        ['0042', 42, 42, 42],
        ['42.9', 42, undefined, 43], // parseInt truncates, Number() gives 42.9 (not int)
        ['42px', 42, undefined, undefined], // parseInt accepts prefix, Number() fails
        ['px42', undefined, undefined, undefined], // both fail
        ['', undefined, undefined, undefined],
        ['   ', undefined, undefined, undefined],
        ['-10', -10, -10, -10],
        ['+10', 10, 10, 10],
        ['-10.9', -10, undefined, -11], // parseInt truncates
        ['abc', undefined, undefined, undefined],
        ['1.1', 1, undefined, 1],
        ['1.9', 1, undefined, 2],
      ] as const

      for (const [input, expected_lenient, expected_strict_nonrounded, expected_strict_rounded] of cases) {
        expect(strToIntOrUndefined_lenient(input)).toBe(expected_lenient)
        expect(strToIntOrUndefined_strict(input, false)).toBe(expected_strict_nonrounded)
        expect(strToIntOrUndefined_strict(input, true)).toBe(expected_strict_rounded)
      }
    })
  })
})

// for (const [input, expected_nonrounded, expected_rounded] of [
//   // clean integers
//   [42, 42, 42],
//   [0, 0, 0],
//   [-0, 0, 0],
//
//   // decimals
//   [42.9, undefined, 43],
//   [42.1, undefined, 42],
//   [42.5, undefined, 43], // rounds to nearest even (banker's rounding)
//
//   // sign handling
//   [-10, -10, -10],
//   [-10.9, undefined, -11],
//   [-10.1, undefined, -10],
//
//   // invalid
//   [NaN, undefined, undefined],
//   [Infinity, undefined, undefined],
//   [-Infinity, undefined, undefined],
//
//   // edge cases
//   [1.1, undefined, 1],
//   [1.11, undefined, 1],
//   [1.111, undefined, 1],
//   [1.1111, undefined, 1],
//   [1.1119, undefined, 1],
//   [1.9999, undefined, 2],
//   [1.9, undefined, 2],
// ] as const) {
//   const result_nonrounded = numberToValidIntOrUndefined(input, false)
//   const result_rounded = numberToValidIntOrUndefined(input, true)
//
//   if (result_nonrounded !== expected_nonrounded)
//     console.error(
//       `numberToValidIntOrUndefined (round=false): for ${input} result=${result_nonrounded} expected=${expected_nonrounded}`,
//     )
//   if (result_rounded !== expected_rounded)
//     console.error(
//       `numberToValidIntOrUndefined (round=true): for ${input} result=${result_rounded} expected=${expected_rounded}`,
//     )
// }
// for (const [input, expected_lenient, expected_strict_nonrounded, expected_strict_rounded] of [
//   // clean numbers
//   ['42', 42, 42, 42],
//   ['  42  ', 42, undefined, undefined],
//   ['0042', 42, 42, 42],
//   // decimal
//   ['42.9', 42, undefined, 43], // parseInt truncates, Number() gives 42.9 (not int)
//   // trailing junk
//   ['42px', 42, undefined, undefined], // parseInt accepts prefix, Number() fails
//   // prefix junk
//   ['px42', undefined, undefined, undefined], // both fail
//   // empty / whitespace
//   ['', undefined, undefined, undefined],
//   ['   ', undefined, undefined, undefined],
//   // sign handling
//   ['-10', -10, -10, -10],
//   ['+10', 10, 10, 10],
//   ['-10.9', -10, undefined, -11], // parseInt truncates
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
//   const result_lenient = strToIntOrUndefined_lenient(input)
//   const result_strict_nonrounded = strToIntOrUndefined_strict(input, false)
//   const result_strict_rounded = strToIntOrUndefined_strict(input, true)
//   if (result_lenient !== expected_lenient)
//     console.error(`strToIntOrUndefined_lenient: for "${input}" result=${result_lenient} expected=${expected_lenient}`)
//   if (result_strict_nonrounded !== expected_strict_nonrounded)
//     console.error(
//       `strToIntOrUndefined_strict: for "${input}" result=${result_strict_nonrounded} expected=${expected_strict_nonrounded}`,
//     )
//   if (result_strict_rounded !== expected_strict_rounded)
//     console.error(
//       `strToIntOrUndefined_strict rounded: for "${input}" result=${result_strict_rounded} expected=${expected_strict_rounded}`,
//     )
// }
