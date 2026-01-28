import { describe, it, expect } from 'vitest'
import { extractKeysKhmer } from './keyExtractionKhmer'
import { nonEmptyString_afterTrim } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

// Helper to cast string to our branded type for testing
const T = nonEmptyString_afterTrim

describe('extractKeysKhmer', () => {
  describe('Khmer (km)', () => {
    it('extracts simple consecutive consonants', () => {
      // ក (Ka), ខ (Kha)
      expect(extractKeysKhmer(T('កខ'))).toEqual({
        type: 'khmer_word',
        firstChar: { type: 'consonant', v: 'ក' },
        secondChar: { type: 'consonant', v: 'ខ' },
      })
    })

    it('extracts single consonant', () => {
      expect(extractKeysKhmer(T('ក'))).toEqual({
        type: 'khmer_word',
        firstChar: { type: 'consonant', v: 'ក' },
        secondChar: undefined,
      })
    })

    it('handles subscript consonants (Coeng)', () => {
      // ខ្ញុំ (Khnhom) starts with ខ (Kho).
      // The second character is ្ (Coeng U+17D2).
      // The third character is ញ (Nho).
      // The fourth is ុំ (Vowel Om).
      // We expect L1=ខ, L2=ញ (skipping Coeng).
      expect(extractKeysKhmer(T('ខ្ញុំ'))).toEqual({
        type: 'khmer_word',
        firstChar: { type: 'consonant', v: 'ខ' },
        secondChar: { type: 'consonant', v: 'ញ' },
      })
    })

    it('handles subscript when word ends abruptly (edge case)', () => {
      // ខ + ្ (Kho + Coeng) -> Invalid word really, but L2 should be undefined or handle gracefully
      // Filtering Coeng removes the last char, so it behaves like single consonant
      expect(extractKeysKhmer(T('ខ្'))).toEqual({
        type: 'khmer_word',
        firstChar: { type: 'consonant', v: 'ខ' },
        secondChar: undefined,
      })
    })

    it('extracts consonant and dependent vowel as L2 if not subscript', () => {
      // កា (Ka + aa)
      expect(extractKeysKhmer(T('កា'))).toEqual({
        type: 'khmer_word',
        firstChar: { type: 'consonant', v: 'ក' },
        secondChar: { type: 'vowel', v: 'ា' },
      })
    })

    it('extracts vowel combination (2 chars)', () => {
      // កុំ (Kom) = ក + ុ +
      expect(extractKeysKhmer(T('កុំ'))).toEqual({
        type: 'khmer_word',
        firstChar: { type: 'consonant', v: 'ក' },
        secondChar: { type: 'vowel_combination', v: ['ុ', 'ំ'] },
      })
    })

    it('extracts vowel combination (1 char)', () => {
      // កំ (Kam) = ក +
      expect(extractKeysKhmer(T('កំ'))).toEqual({
        type: 'khmer_word',
        firstChar: { type: 'consonant', v: 'ក' },
        secondChar: { type: 'vowel_combination', v: ['ំ'] },
      })
    })
  })
})
