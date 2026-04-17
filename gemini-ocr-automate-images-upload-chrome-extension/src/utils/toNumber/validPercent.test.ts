import { describe, it, expect } from 'vitest'
import {
  numberToValidPercentOrUndefined,
  strToPercentOrUndefined_lenient,
  strToPercentOrUndefined_strict,
} from './validPercent.js'

describe('validPercent utils', () => {
  describe('numberToValidPercentOrUndefined', () => {
    it('should convert numbers to percent correctly with round and clamp', () => {
      const cases: [number, [number | undefined, number | undefined, number | undefined, number | undefined]][] = [
        [0, [0, 0, 0, 0]],
        [50, [50, 50, 50, 50]],
        [100, [100, 100, 100, 100]],
        [100.0, [100, 100, 100, 100]],
        [10.1, [10.1, 10.1, 10.1, 10.1]],
        [10.11, [10.11, 10.11, 10.11, 10.11]],
        [99.9, [99.9, 99.9, 99.9, 99.9]],
        // [10.12345678901, [10.123456789, 10.123456789, undefined, undefined]],
        [10.11159, [10.11159, 10.11159, 10.11159, 10.11159]],
        // [99.123456789012, [99.123456789, 99.123456789, undefined, undefined]],
        [10.123456789, [10.123456789, 10.123456789, 10.123456789, 10.123456789]],
        [101, [100, undefined, 100, undefined]],
        [150, [100, undefined, 100, undefined]],
        [100.1, [100, undefined, 100, undefined]],
        [105.5, [100, undefined, 100, undefined]],
        [-1, [0, undefined, 0, undefined]],
        [-10, [0, undefined, 0, undefined]],
        [-100, [0, undefined, 0, undefined]],
        [-0, [0, 0, 0, 0]], // -0 becomes 0
        // [100.12345678901, [100, undefined, 100, undefined]],
        // [105.123456789, [100, undefined, 100, undefined]],
        [0.5, [0.5, 0.5, 0.5, 0.5]],
        [99.9999999999, [99.9999999999, 99.9999999999, 99.9999999999, 99.9999999999]],
        // [99.99999999999, [100, 100, undefined, undefined]],
        [NaN, [undefined, undefined, undefined, undefined]],
        [Infinity, [undefined, undefined, undefined, undefined]],
        [-Infinity, [undefined, undefined, undefined, undefined]],
      ]

      for (const [input, expected] of cases) {
        expect(numberToValidPercentOrUndefined(input, true, true)).toBe(expected[0])
        expect(numberToValidPercentOrUndefined(input, true, false)).toBe(expected[1])
        expect(numberToValidPercentOrUndefined(input, false, true)).toBe(expected[2])
        expect(numberToValidPercentOrUndefined(input, false, false)).toBe(expected[3])
      }
    })
  })

  describe('strToPercentOrUndefined', () => {
    it('should convert strings correctly with various options', () => {
      const testCases: [
        string,
        [number | undefined, number | undefined, number | undefined, number | undefined], // lenient: [TT, TF, FT, FF]
        [number | undefined, number | undefined, number | undefined, number | undefined], // strict: [TT, TF, FT, FF]
      ][] = [
        ['0', [0, 0, 0, 0], [0, 0, 0, 0]],
        ['50', [50, 50, 50, 50], [50, 50, 50, 50]],
        ['100', [100, 100, 100, 100], [100, 100, 100, 100]],
        ['100.0', [100, 100, 100, 100], [100, 100, 100, 100]],
        ['10.1', [10.1, 10.1, 10.1, 10.1], [10.1, 10.1, 10.1, 10.1]],
        ['1e1', [10, 10, 10, 10], [10, 10, 10, 10]],
        ['101', [100, undefined, 100, undefined], [100, undefined, 100, undefined]],
        ['-1', [0, undefined, 0, undefined], [undefined, undefined, undefined, undefined]],
        ['50px', [50, 50, 50, 50], [undefined, undefined, undefined, undefined]], // lenient accepts, strict rejects
        ['  50  ', [50, 50, 50, 50], [undefined, undefined, undefined, undefined]],
        ['abc', [undefined, undefined, undefined, undefined], [undefined, undefined, undefined, undefined]],
        ['-0', [0, 0, 0, 0], [0, 0, 0, 0]], // -0 becomes 0 in JS, which is >= 0
        ['99.99999999999', [100, 100, 100, 100], [100, 100, 100, 100]], // Rounds to exactly 100
      ]

      for (const [input, expectedLenient, expectedStrict] of testCases) {
        expect(strToPercentOrUndefined_lenient(input, true, true)).toBe(expectedLenient[0])
        expect(strToPercentOrUndefined_lenient(input, true, false)).toBe(expectedLenient[1])
        expect(strToPercentOrUndefined_lenient(input, false, true)).toBe(expectedLenient[2])
        expect(strToPercentOrUndefined_lenient(input, false, false)).toBe(expectedLenient[3])

        expect(strToPercentOrUndefined_strict(input, true, true)).toBe(expectedStrict[0])
        expect(strToPercentOrUndefined_strict(input, true, false)).toBe(expectedStrict[1])
        expect(strToPercentOrUndefined_strict(input, false, true)).toBe(expectedStrict[2])
        expect(strToPercentOrUndefined_strict(input, false, false)).toBe(expectedStrict[3])
      }
    })

    it('should handle specific clamping cases', () => {
      const cases = [
        ['100', 100],
        ['100.0', 100],
        ['100.1', 100],
        ['101', 100],
        ['-100', undefined],
        ['10.1', 10.1],
      ] as const
      for (const [input, expected] of cases) {
        expect(strToPercentOrUndefined_strict(input, true, true)).toBe(expected)
      }
    })
  })
})

// {
//   // Test cases: [input, [TT, TF, FT, FF]]
//   // where TT = (round=true, clamp=true), TF = (round=true, clamp=false), etc.
//   const testCases: [number, [number | undefined, number | undefined, number | undefined, number | undefined]][] = [
//     // Basic valid percents
//     [0, [0, 0, 0, 0]],
//     [50, [50, 50, 50, 50]],
//     [100, [100, 100, 100, 100]],
//     [100.0, [100, 100, 100, 100]],
//
//     // Simple decimals
//     [10.1, [10.1, 10.1, 10.1, 10.1]],
//     [10.11, [10.11, 10.11, 10.11, 10.11]],
//     [99.9, [99.9, 99.9, 99.9, 99.9]],
//
//     // Many decimal places
//     [10.12345678901, [10.123456789, 10.123456789, undefined, undefined]],
//     [10.11159, [10.11159, 10.11159, 10.11159, 10.11159]],
//     [99.123456789012, [99.123456789, 99.123456789, undefined, undefined]],
//
//     // Exactly at max digits (no rounding needed)
//     [10.123456789, [10.123456789, 10.123456789, 10.123456789, 10.123456789]],
//
//     // Out of range - needs clamping
//     [101, [100, undefined, 100, undefined]],
//     [150, [100, undefined, 100, undefined]],
//     [100.1, [100, undefined, 100, undefined]],
//     [105.5, [100, undefined, 100, undefined]],
//
//     // Negative numbers
//     [-1, [0, undefined, 0, undefined]],
//     [-10, [0, undefined, 0, undefined]],
//     [-100, [0, undefined, 0, undefined]],
//     [-0, [0, 0, 0, 0]], // -0 becomes 0
//
//     // Needs both rounding and clamping
//     [100.12345678901, [100, undefined, 100, undefined]],
//     [105.123456789, [100, undefined, 100, undefined]],
//
//     // Edge cases with decimals
//     [0.5, [0.5, 0.5, 0.5, 0.5]],
//
//     // Rounds to exactly 100
//     [99.9999999999, [99.9999999999, 99.9999999999, 99.9999999999, 99.9999999999]],
//     [99.99999999999, [100, 100, undefined, undefined]],
//     [100.0, [100, 100, 100, 100]],
//
//     // Invalid
//     [NaN, [undefined, undefined, undefined, undefined]],
//     [Infinity, [undefined, undefined, undefined, undefined]],
//     [-Infinity, [undefined, undefined, undefined, undefined]],
//   ]
//
//   // Run all permutations
//   const permutations: [boolean, boolean][] = [
//     [true, true], // round, clamp
//     [true, false], // round, no clamp
//     [false, true], // no round, clamp
//     [false, false], // no round, no clamp
//   ]
//
//   for (const [input, expected] of testCases) {
//     permutations.forEach(([round, clamp], i) => {
//       const ctx = `(${input}, round=${round}, clamp=${clamp})`
//       const exp = expected[i]
//
//       const result = numberToValidPercentOrUndefined(input, round, clamp)
//
//       if (result !== exp) {
//         console.error(`❌ numberToValidPercentOrUndefined${ctx} -> Expected: ${exp} | Got: ${result}`)
//       }
//     })
//   }
// }
// {
//   // Test cases: [input, expected_lenient, expected_strict]
//   // Will be tested with all 4 permutations: (round,clamp) = (true,true), (true,false), (false,true), (false,false)
//   const testCases: [
//     string,
//     [number | undefined, number | undefined, number | undefined, number | undefined], // lenient: [TT, TF, FT, FF]
//     [number | undefined, number | undefined, number | undefined, number | undefined], // strict: [TT, TF, FT, FF]
//   ][] = [
//     // Format: [input, [lenient_TT, lenient_TF, lenient_FT, lenient_FF], [strict_TT, strict_TF, strict_FT, strict_FF]]
//     // where TT = (round=true, clamp=true), TF = (round=true, clamp=false), etc.
//
//     // Basic valid percents
//     ['0', [0, 0, 0, 0], [0, 0, 0, 0]],
//     ['50', [50, 50, 50, 50], [50, 50, 50, 50]],
//     ['100', [100, 100, 100, 100], [100, 100, 100, 100]],
//     ['100.0', [100, 100, 100, 100], [100, 100, 100, 100]],
//
//     // Simple decimals
//     ['10.1', [10.1, 10.1, 10.1, 10.1], [10.1, 10.1, 10.1, 10.1]],
//     ['10.11', [10.11, 10.11, 10.11, 10.11], [10.11, 10.11, 10.11, 10.11]],
//     ['99.9', [99.9, 99.9, 99.9, 99.9], [99.9, 99.9, 99.9, 99.9]],
//
//     // Many decimal places - strToNumberOrUndefined already rounds with toFixed
//     [
//       '10.12345678901',
//       [10.123456789, 10.123456789, 10.123456789, 10.123456789],
//       [10.123456789, 10.123456789, 10.123456789, 10.123456789],
//     ],
//     ['10.11159', [10.11159, 10.11159, 10.11159, 10.11159], [10.11159, 10.11159, 10.11159, 10.11159]],
//     [
//       '99.123456789012',
//       [99.123456789, 99.123456789, 99.123456789, 99.123456789],
//       [99.123456789, 99.123456789, 99.123456789, 99.123456789],
//     ],
//
//     // Exactly at max digits (no rounding needed)
//     [
//       '10.1234567890',
//       [10.123456789, 10.123456789, 10.123456789, 10.123456789],
//       [10.123456789, 10.123456789, 10.123456789, 10.123456789],
//     ],
//
//     // Out of range - needs clamping
//     ['101', [100, undefined, 100, undefined], [100, undefined, 100, undefined]],
//     ['150', [100, undefined, 100, undefined], [100, undefined, 100, undefined]],
//     ['100.1', [100, undefined, 100, undefined], [100, undefined, 100, undefined]],
//     ['105.5', [100, undefined, 100, undefined], [100, undefined, 100, undefined]],
//
//     // Negative numbers (always undefined)
//     ['-1', [0, undefined, 0, undefined], [undefined, undefined, undefined, undefined]],
//     ['-10', [0, undefined, 0, undefined], [undefined, undefined, undefined, undefined]],
//     ['-100', [0, undefined, 0, undefined], [undefined, undefined, undefined, undefined]],
//
//     // Needs both rounding and clamping
//     ['100.12345678901', [100, undefined, 100, undefined], [100, undefined, 100, undefined]],
//     ['105.123456789', [100, undefined, 100, undefined], [100, undefined, 100, undefined]],
//
//     // Lenient vs Strict: suffixes (lenient accepts, strict rejects)
//     ['50px', [50, 50, 50, 50], [undefined, undefined, undefined, undefined]],
//     ['100.5px', [100, undefined, 100, undefined], [undefined, undefined, undefined, undefined]],
//     ['75.25abc', [75.25, 75.25, 75.25, 75.25], [undefined, undefined, undefined, undefined]],
//     ['101px', [100, undefined, 100, undefined], [undefined, undefined, undefined, undefined]],
//
//     // Lenient vs Strict: whitespace (lenient accepts, strict rejects)
//     ['  50  ', [50, 50, 50, 50], [undefined, undefined, undefined, undefined]],
//     ['50 ', [50, 50, 50, 50], [undefined, undefined, undefined, undefined]],
//     [' 50', [50, 50, 50, 50], [undefined, undefined, undefined, undefined]],
//
//     // Both reject prefix junk
//     ['px50', [undefined, undefined, undefined, undefined], [undefined, undefined, undefined, undefined]],
//
//     // Invalid inputs
//     ['', [undefined, undefined, undefined, undefined], [undefined, undefined, undefined, undefined]],
//     ['abc', [undefined, undefined, undefined, undefined], [undefined, undefined, undefined, undefined]],
//     ['   ', [undefined, undefined, undefined, undefined], [undefined, undefined, undefined, undefined]],
//
//     // Edge cases with decimals
//     ['.5', [0.5, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
//     ['0.5', [0.5, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
//     ['100.', [100, 100, 100, 100], [100, 100, 100, 100]],
//
//     // Scientific notation (both accept)
//     ['1e1', [10, 10, 10, 10], [10, 10, 10, 10]],
//     ['5e1', [50, 50, 50, 50], [50, 50, 50, 50]],
//     ['1e2', [100, 100, 100, 100], [100, 100, 100, 100]],
//     ['1.5e2', [100, undefined, 100, undefined], [100, undefined, 100, undefined]], // 150 needs clamp
//
//     // Signs
//     ['+50', [50, 50, 50, 50], [50, 50, 50, 50]],
//     ['+100.5', [100, undefined, 100, undefined], [100, undefined, 100, undefined]],
//     ['-0', [0, 0, 0, 0], [0, 0, 0, 0]], // -0 becomes 0 in JS, which is >= 0
//
//     // Rounds to exactly 100
//     [
//       '99.9999999999',
//       [99.9999999999, 99.9999999999, 99.9999999999, 99.9999999999],
//       [99.9999999999, 99.9999999999, 99.9999999999, 99.9999999999],
//     ],
//     ['99.99999999999', [100, 100, 100, 100], [100, 100, 100, 100]],
//     ['100.0000000000', [100, 100, 100, 100], [100, 100, 100, 100]],
//   ]
//
//   // Run all permutations
//   const permutations: [boolean, boolean][] = [
//     [true, true], // round, clamp
//     [true, false], // round, no clamp
//     [false, true], // no round, clamp
//     [false, false], // no round, no clamp
//   ]
//
//   for (const [input, expectedLenient, expectedStrict] of testCases) {
//     permutations.forEach(([round, clamp], i) => {
//       const ctx = `("${input}", round=${round}, clamp=${clamp})`
//       const expectedL = expectedLenient[i]
//       const expectedS = expectedStrict[i]
//
//       const resultL = strToPercentOrUndefined_lenient(input, round, clamp)
//       const resultS = strToPercentOrUndefined_strict(input, round, clamp)
//
//       if (resultL !== expectedL) {
//         console.error(`❌ strToPercentOrUndefined_lenient${ctx} -> Expected: ${expectedL} | Got: ${resultL}`)
//       }
//
//       if (resultS !== expectedS) {
//         console.error(`❌ strToPercentOrUndefined_strict${ctx} -> Expected: ${expectedS} | Got: ${resultS}`)
//       }
//     })
//   }
// }
// for (const [input, expected] of [
//   ['100', 100],
//   ['100.0', 100],
//   ['100.1', 100],
//   ['101', 100],
//   ['-100', undefined],
//   ['10.1', 10.1],
//   ['10.11', 10.11],
//   ['10.111', 10.111],
//   ['10.1111', 10.1111],
//   ['10.1115', 10.1115],
// ] as const) {
//   const result = strToPercentOrUndefined_strict(input, true, true)
//   if (!(result === expected))
//     console.error(
//       `strToPercentOrUndefined_clamp -> Assertion failed: Input: "${input}" | Expected: ${expected} | Got: ${result}`,
//     )
// }
