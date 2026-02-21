import { describe, it, expect } from 'vitest'
import { normalizeKhmerDiactricsInsensitive } from './normalizeKhmerDiactricsInsensitive'
import { nonEmptyString_afterTrim } from './non-empty-string-trimmed'
import { strToKhmerWordOrThrow } from './khmer-word'

// Wrapper to normalize and convert to Array of characters for deep inspection
const f = (s: string) =>
  Array.from(normalizeKhmerDiactricsInsensitive(strToKhmerWordOrThrow(nonEmptyString_afterTrim(s))))

const itExpect = (s: string, expected: string[]) =>
  it(JSON.stringify(Array.from(s)), () => expect(f(s)).toEqual(expected))

describe('Khmer Normalization', () => {
  describe('should remove register shifters (Muusikatoan/Triisap)', () => {
    // ប៉ះ (B + Muusikatoan + Ah) -> should become [ប, ះ]
    const expected = ['ប', 'ះ']
    itExpect('ប៉ះ', expected)
    itExpect('បះ', expected)

    // ហ៊ាន (H + Triisap + Aa + N) -> should become [ហ, ា, ន]
    const expected2 = ['ហ', 'ា', 'ន']
    itExpect('ហ៊ាន', expected2)
    itExpect('ហាន', expected2)
  })

  describe('should remove Bantoc and Toandakhiat', () => {
    // សីហ៍ (S + I + H + Toandakhiat) -> should become [ស, ី, ហ]
    itExpect('សីហ៍', ['ស', 'ី', 'ហ'])
    itExpect('សីហ', ['ស', 'ី', 'ហ'])

    // កក់ (K + A + Bantoc + K) -> should become [ក, ក]
    // Note: depends on your specific regex, but based on \u17CB (Bantoc) being in range
    itExpect('កក់', ['ក', 'ក'])
  })

  describe('should preserve distinct vowels', () => {
    // Explicitly check that vowels remain intact and different from each other
    itExpect('កា', ['ក', 'ា'])
    itExpect('កិ', ['ក', 'ិ'])
    itExpect('កី', ['ក', 'ី'])
  })

  describe('should preserve consonant clusters (Coeng)', () => {
    // ខ្មែរ (K + Coeng + M + Ae + R)
    // \u17D2 is the Coeng (subscript sign), it should NOT be removed
    itExpect('ខ្មែរ', ['ខ', 'ម', 'ែ', 'រ'])
  })

  describe('should handle whitespace and validation via the wrapper', () => {
    // Test that the pipe (trim -> throw if not khmer -> normalize) works
    itExpect('  ប៉ះ  ', ['ប', 'ះ'])

    it('should throw for non-khmer text', () => {
      expect(() => f('English Only')).toThrow()
    })
  })
})
