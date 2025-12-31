import { describe, it, expect } from 'vitest'
import { extractKeysEn, extractKeysRu } from './keyExtractionGeneric'
import { nonEmptyString_afterTrim } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

// Helper to cast string to our branded type for testing
const T = nonEmptyString_afterTrim

describe('extractKeysGeneric', () => {
  describe('English (en)', () => {
    it('extracts first two letters from standard word', () => {
      expect(extractKeysEn(T('Apple'))).toEqual(['A', 'P'])
    })

    it('extracts one letter if length is 1', () => {
      expect(extractKeysEn(T('a'))).toEqual(['A', undefined])
    })

    it('extracts case insensitively', () => {
      expect(extractKeysEn(T('apple'))).toEqual(['A', 'P'])
    })

    it('ignores non-latin prefixes', () => {
      expect(extractKeysEn(T('123Apple'))).toEqual(['A', 'P'])
    })

    it('returns undefineds if no valid characters found', () => {
      expect(extractKeysEn(T('123'))).toEqual(undefined)
    })
  })

  describe('Russian (ru)', () => {
    it('extracts first two Cyrillic letters', () => {
      expect(extractKeysRu(T('Привет'))).toEqual(['П', 'Р'])
    })

    it('ignores Latin or numbers', () => {
      expect(extractKeysRu(T('123DaПривет'))).toEqual(['П', 'Р'])
    })
  })
})
