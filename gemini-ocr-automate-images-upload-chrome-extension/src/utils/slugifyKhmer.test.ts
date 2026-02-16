import { describe, it, expect } from 'vitest'
import { slugify, transform } from './slugifyKhmer'

describe('Khmer Transliteration', () => {
  it('should handle simple first series consonants', () => {
    const result = Array.from(transform('ក')).join('')
    expect(result).toBe('ka')
  })

  it('should handle second series consonants', () => {
    const result = Array.from(transform('គ')).join('')
    expect(result).toBe('ko')
  })

  it('should apply vowels correctly based on series', () => {
    // កា (First series + vowel AA) -> ka
    expect(Array.from(transform('កា')).join('')).toBe('ka')
    // គា (Second series + vowel AA) -> kea
    expect(Array.from(transform('គា')).join('')).toBe('kea')
  })

  it('should handle Bantak', () => {
    // This depends on your vowelEntries mapping
    const result = Array.from(transform('កត់')).join('')
    expect(result).toBe('kat')
  })

  it('should handle clusters (subscripts)', () => {
    // ខ្មែរ (Kh + subscript m + vowel ae)
    const result = slugify('ខ្មែរ')
    expect(result).toBe('khmeaer')
  })

  it('should slugify multiple words', () => {
    const result = slugify('ភាសាខ្មែរ')
    // ភាសា (pheasa) - ខ្មែរ (khmae)
    expect(result).toBe('pheasakhmeaer')
  })

  it('should handle mixed characters and spaces', () => {
    const result = slugify('សួស្តី Hello')
    expect(result).toContain('suostei')
    expect(result).toContain('Hello')
  })
})
