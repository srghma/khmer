import { describe, it, expect } from 'vitest'
import {
  numberToValidNumberOrUndefined,
  strToNumberOrUndefined_lenient,
  strToNumberOrUndefined_strict,
} from './validNumber.js'

describe('validNumber utils', () => {
  describe('numberToValidNumberOrUndefined', () => {
    it('should convert numbers correctly', () => {
      const cases = [
        [42, 42, 42],
        [42.5, 42.5, 42.5],
        [0, 0, 0],
        [-0, 0, 0],
        [42.9, 42.9, 42.9],
        [0.5, 0.5, 0.5],
        [-10, -10, -10],
        [-10.9, -10.9, -10.9],
        [NaN, undefined, undefined],
        [Infinity, undefined, undefined],
        [-Infinity, undefined, undefined],
        [1.1, 1.1, 1.1],
        [1.11, 1.11, 1.11],
        [1.111, 1.111, 1.111],
        [1.1111, 1.1111, 1.1111],
        [1.1234567891, 1.1234567891, 1.1234567891],
        // [1.12345678912, undefined, 1.1234567891],
        [1.1119, 1.1119, 1.1119],
        // [1.12345678919, undefined, 1.1234567892],
        [100.0, 100, 100],
      ] as const

      for (const [input, expected_nonrounded, expected_rounded] of cases) {
        expect(numberToValidNumberOrUndefined(input, false)).toBe(expected_nonrounded)
        expect(numberToValidNumberOrUndefined(input, true)).toBe(expected_rounded)
      }
    })
  })

  describe('strToNumberOrUndefined', () => {
    it('should convert strings correctly', () => {
      const cases = [
        ['42', 42, 42],
        ['42.5', 42.5, 42.5],
        ['  42  ', 42, undefined],
        ['  42.5  ', 42.5, undefined],
        ['0042', 42, 42],
        ['0042.5', 42.5, 42.5],
        ['42.9', 42.9, 42.9],
        ['.5', 0.5, 0.5],
        ['0.5', 0.5, 0.5],
        ['42.', 42, 42],
        ['1e2', 100, 100],
        ['1.5e2', 150, 150],
        ['1e-2', 0.01, 0.01],
        ['42px', 42, undefined], // parseFloat accepts prefix, Number() fails
        ['42.5px', 42.5, undefined],
        ['px42', undefined, undefined], // both fail
        ['', undefined, undefined],
        ['   ', undefined, undefined],
        ['-10', -10, -10],
        ['+10', 10, 10],
        ['-10.9', -10.9, -10.9],
        ['+10.9', 10.9, 10.9],
        ['abc', undefined, undefined],
        ['Infinity', undefined, undefined],
        ['-Infinity', undefined, undefined],
        ['NaN', undefined, undefined],
        ['0', 0, 0],
        ['-0', 0, 0],
        ['0.0', 0, 0],
        ['1.2.3', 1.2, undefined], // parseFloat stops at second dot
        ['1.1', 1.1, 1.1],
        ['1.11', 1.11, 1.11],
        ['1.111', 1.111, 1.111],
        ['1.1111', 1.1111, 1.1111],
        ['1.1234567891', 1.1234567891, 1.1234567891],
        // ['1.12345678912', 1.1234567891, 1.1234567891],
        ['1.1119', 1.1119, 1.1119],
        // ['1.12345678919', 1.1234567892, 1.1234567892],
        ['100.0', 100, 100],
      ] as const

      for (const [input, expectedLenient, expectedStrict] of cases) {
        expect(strToNumberOrUndefined_lenient(input)).toBe(expectedLenient)
        expect(strToNumberOrUndefined_strict(input)).toBe(expectedStrict)
      }
    })
  })
})

// // Test cases
// for (const [input, expected_nonrounded, expected_rounded] of [
//   // clean numbers
//   [42, 42, 42],
//   [42.5, 42.5, 42.5],
//   [0, 0, 0],
//   [-0, 0, 0],
//
//   // decimal variations
//   [42.9, 42.9, 42.9],
//   [0.5, 0.5, 0.5],
//
//   // sign handling
//   [-10, -10, -10],
//   [-10.9, -10.9, -10.9],
//
//   // invalid
//   [NaN, undefined, undefined],
//   [Infinity, undefined, undefined],
//   [-Infinity, undefined, undefined],
//
//   // test max validNumber__maxDigitsAfterDot
//   [1.1, 1.1, 1.1],
//   [1.11, 1.11, 1.11],
//   [1.111, 1.111, 1.111],
//   [1.1111, 1.1111, 1.1111],
//   [1.1234567891, 1.1234567891, 1.1234567891],
//   [1.12345678912, undefined, 1.1234567891],
//   [1.1119, 1.1119, 1.1119],
//   [1.12345678919, undefined, 1.1234567892],
//   [100.0, 100, 100],
// ] as const) {
//   const result_nonrounded = numberToValidNumberOrUndefined(input, false)
//   const result_rounded = numberToValidNumberOrUndefined(input, true)
//
//   if (result_nonrounded !== expected_nonrounded)
//     console.error(
//       `numberToValidNumberOrUndefined (round=false): for ${input} result=${result_nonrounded} expected=${expected_nonrounded}`,
//     )
//   if (result_rounded !== expected_rounded)
//     console.error(
//       `numberToValidNumberOrUndefined (round=true): for ${input} result=${result_rounded} expected=${expected_rounded}`,
//     )
// }
// // Test cases
// for (const [input, expected_strToNumberOrUndefined_lenient, expected_strToNumberOrUndefined_strict] of [
//   // clean numbers
//   ['42', 42, 42],
//   ['42.5', 42.5, 42.5],
//   ['  42  ', 42, undefined],
//   ['  42.5  ', 42.5, undefined],
//   ['0042', 42, 42],
//   ['0042.5', 42.5, 42.5],
//   // decimal variations
//   ['42.9', 42.9, 42.9],
//   ['.5', 0.5, 0.5],
//   ['0.5', 0.5, 0.5],
//   ['42.', 42, 42],
//   // scientific notation
//   ['1e2', 100, 100],
//   ['1.5e2', 150, 150],
//   ['1e-2', 0.01, 0.01],
//   // trailing junk
//   ['42px', 42, undefined], // parseFloat accepts prefix, Number() fails
//   ['42.5px', 42.5, undefined],
//   // prefix junk
//   ['px42', undefined, undefined], // both fail
//   // empty / whitespace
//   ['', undefined, undefined],
//   ['   ', undefined, undefined],
//   // sign handling
//   ['-10', -10, -10],
//   ['+10', 10, 10],
//   ['-10.9', -10.9, -10.9],
//   ['+10.9', 10.9, 10.9],
//   // invalid
//   ['abc', undefined, undefined],
//   ['Infinity', undefined, undefined],
//   ['-Infinity', undefined, undefined],
//   ['NaN', undefined, undefined],
//   // edge cases
//   ['0', 0, 0],
//   ['-0', 0, 0],
//   ['0.0', 0, 0],
//   // multiple dots
//   ['1.2.3', 1.2, undefined], // parseFloat stops at second dot
//   // test max validNumber__maxDigitsAfterDot
//   ['1.1', 1.1, 1.1],
//   ['1.11', 1.11, 1.11],
//   ['1.111', 1.111, 1.111],
//   ['1.1111', 1.1111, 1.1111],
//   ['1.1234567891', 1.1234567891, 1.1234567891],
//   ['1.12345678912', 1.1234567891, 1.1234567891],
//   ['1.1119', 1.1119, 1.1119],
//   ['1.12345678919', 1.1234567892, 1.1234567892],
//   ['100.0', 100, 100],
// ] as const) {
//   const result_lenient = strToNumberOrUndefined_lenient(input)
//   const result_strict = strToNumberOrUndefined_strict(input)
//
//   if (result_lenient !== expected_strToNumberOrUndefined_lenient)
//     console.error(
//       `strToNumberOrUndefined_lenient: for "${input}" result=${result_lenient} expected=${expected_strToNumberOrUndefined_lenient}`,
//     )
//   if (result_strict !== expected_strToNumberOrUndefined_strict)
//     console.error(
//       `strToNumberOrUndefined_strict: for "${input}" result=${result_strict} expected=${expected_strToNumberOrUndefined_strict}`,
//     )
// }
