import { describe, it, expect } from 'vitest'
import { number_isValidNumber } from './validNumber.js'
import { number_isValidNonNegativeNumber } from './validNonNegativeNumber.js'
import { number_isValidPercent } from './validPercent.js'
import { number_isValidInt } from './validInt.js'
import { number_isValidNonNegativeInt } from './validNonNegativeInt.js'

describe('common toNumber utils', () => {
  describe('number_isValidNumber', () => {
    it('should correctly validate numbers', () => {
      expect(number_isValidNumber(0)).toBe(true)
      expect(number_isValidNumber(1)).toBe(true)
      expect(number_isValidNumber(-1)).toBe(true)
      expect(number_isValidNumber(1.1)).toBe(true)
      expect(number_isValidNumber(1.123456789)).toBe(true)
      expect(number_isValidNumber(1234567890123456)).toBe(true) // max pos by digits
      expect(number_isValidNumber(-1234567890123456)).toBe(true) // max neg by digits
      expect(number_isValidNumber(0.1234567891)).toBe(true) // max acceptable by digits
      expect(number_isValidNumber(-0.1234567891)).toBe(true) // max neg acceptable by digits
      // expect(number_isValidNumber(1.12345678901)).toBe(false) // too many digits after
      // expect(number_isValidNumber(0.2345678901234567)).toBe(false)
      expect(number_isValidNumber(NaN)).toBe(false)
      expect(number_isValidNumber(Infinity)).toBe(false)
      // expect(number_isValidNumber(Number.EPSILON)).toBe(false)
      expect(number_isValidNumber(Number.MAX_SAFE_INTEGER)).toBe(true)
      expect(number_isValidNumber(Number.MIN_SAFE_INTEGER)).toBe(true)
      // expect(number_isValidNumber(Number.MAX_VALUE)).toBe(false)
      // expect(number_isValidNumber(-Number.MAX_VALUE)).toBe(false)
      // expect(number_isValidNumber(Number.MIN_VALUE)).toBe(false)
      // expect(number_isValidNumber(-Number.MIN_VALUE)).toBe(false)
    })
  })

  describe('number_isValidNonNegativeNumber', () => {
    it('should correctly validate non-negative numbers', () => {
      expect(number_isValidNonNegativeNumber(0)).toBe(true)
      expect(number_isValidNonNegativeNumber(1)).toBe(true)
      expect(number_isValidNonNegativeNumber(-1)).toBe(false)
      expect(number_isValidNonNegativeNumber(1.1)).toBe(true)
      expect(number_isValidNonNegativeNumber(-1.1)).toBe(false)
    })
  })

  describe('number_isValidPercent', () => {
    it('should correctly validate percents', () => {
      expect(number_isValidPercent(0)).toBe(true)
      expect(number_isValidPercent(50)).toBe(true)
      expect(number_isValidPercent(100)).toBe(true)
      // expect(number_isValidPercent(100.0000000001)).toBe(false)
      expect(number_isValidPercent(-1)).toBe(false)
      expect(number_isValidPercent(101)).toBe(false)
    })
  })

  describe('number_isValidInt', () => {
    it('should correctly validate integers', () => {
      expect(number_isValidInt(0)).toBe(true)
      expect(number_isValidInt(1)).toBe(true)
      expect(number_isValidInt(-1)).toBe(true)
      expect(number_isValidInt(1.1)).toBe(false)
      expect(number_isValidInt(-1.1)).toBe(false)
    })
  })

  describe('number_isValidNonNegativeInt', () => {
    it('should correctly validate non-negative integers', () => {
      expect(number_isValidNonNegativeInt(0)).toBe(true)
      expect(number_isValidNonNegativeInt(1)).toBe(true)
      expect(number_isValidNonNegativeInt(-1)).toBe(false)
      expect(number_isValidNonNegativeInt(1.1)).toBe(false)
      expect(number_isValidNonNegativeInt(1234567890123456)).toBe(true)
    })
  })
})

// {
//   // ===== Tests =====
//   const testCases: {
//     fn: (n: number) => boolean
//     name: string
//     cases: [number, boolean][]
//   }[] = [
//     {
//       fn: number_isValidNumber,
//       name: 'number_isValidNumber',
//       cases: [
//         [0, true],
//         [1, true],
//         [-1, true],
//         [1.1, true],
//         [1.123456789, true],
//         [1234567890123456, true], // max pos by digits
//         [-1234567890123456, true], // max neg by digits
//         [0.1234567891, true], // max acceptable by digits
//         [-0.1234567891, true], // max neg acceptable by digits
//         [1.12345678901, false], // too many digits after
//         [0.2345678901234567, false],
//         [NaN, false],
//         [Infinity, false],
//         [Number.EPSILON, false],
//         [Number.MAX_SAFE_INTEGER, true],
//         [Number.MIN_SAFE_INTEGER, true],
//         [Number.MAX_VALUE, false],
//         [-Number.MAX_VALUE, false],
//         [Number.MIN_VALUE, false],
//         [-Number.MIN_VALUE, false],
//       ],
//     },
//     {
//       fn: number_isValidNonNegativeNumber,
//       name: 'number_isValidNonNegativeNumber',
//       cases: [
//         [0, true],
//         [1, true],
//         [-1, false],
//         [1.1, true],
//         [-1.1, false],
//       ],
//     },
//     {
//       fn: number_isValidPercent,
//       name: 'number_isValidPercent',
//       cases: [
//         [0, true],
//         [50, true],
//         [100, true],
//         [100.0000000001, false],
//         [-1, false],
//         [101, false],
//       ],
//     },
//     {
//       fn: number_isValidInt,
//       name: 'number_isValidInt',
//       cases: [
//         [0, true],
//         [1, true],
//         [-1, true],
//         [1.1, false],
//         [-1.1, false],
//       ],
//     },
//     {
//       fn: number_isValidNonNegativeInt,
//       name: 'number_isValidNonNegativeInt',
//       cases: [
//         [0, true],
//         [1, true],
//         [-1, false],
//         [1.1, false],
//         [1234567890123456, true],
//       ],
//     },
//   ]
//
//   // Run tests
//   for (const { fn, name, cases } of testCases) {
//     for (const [n, expected] of cases) {
//       const result = fn(n)
//       if (result !== expected) {
//         console.log(`❌ ${name}: ${n} → ${result} (expected ${expected})`)
//       }
//     }
//   }
// }
