import { describe, it, expect } from 'vitest'
import { khmerToRussian as khmerToRussian_ } from './khmerToRussian'
import { nonEmptyString_afterTrim } from './non-empty-string-trimmed'
import { strToContainsKhmerOrThrow } from './string-contains-khmer-char'

const khmerToRussian = (s: string) => khmerToRussian_(strToContainsKhmerOrThrow(nonEmptyString_afterTrim(s)))

describe('khmerToRussian', () => {
  it('transliterates basic consonants with inherent vowels', () => {
    expect(khmerToRussian('ក')).toBe('ка')
    expect(khmerToRussian('គ')).toBe('ко')
    expect(khmerToRussian('ច')).toBe('тя')
    expect(khmerToRussian('ជ')).toBe('тё')
  })

  it('suppresses inherent vowel when explicit vowel is present', () => {
    expect(khmerToRussian('កា')).toBe('ка') // k + a
    expect(khmerToRussian('គា')).toBe('кеа') // k + ea
    expect(khmerToRussian('កូ')).toBe('коу') // k + ou
    expect(khmerToRussian('គូ')).toBe('ку') // k + u
  })

  it('handles "ទូ" (tu) and "តូ" (tou)', () => {
    expect(khmerToRussian('ទូ')).toBe('ту')
    expect(khmerToRussian('តូ')).toBe('тоу')
  })

  it('handles "ភាសា" (peasa)', () => {
    // ភ (pho) + ា (ea) = пхеа
    // ស (sa) + ា (a) = са
    expect(khmerToRussian('ភាសា')).toBe('пхеаса')
  })

  it('handles clusters with subscripts like "ខ្មែរ"', () => {
    // ខ (kha) -> кх
    // ្ម (m) -> м
    // ែ (trans_a: 'ае', trans_o: 'э') -> ае (series A)
    // រ (ro) -> р (final)
    // Result: кхмаер
    expect(khmerToRussian('ខ្មែរ')).toBe('кхмаер')
  })

  it('handles complex words like "ផ្លូវ" (plov)', () => {
    // ផ (pha) -> пх
    // ្ល (lo) -> л
    // ូ (ou/u) -> оу (series A from ផ)
    // វ (vo) -> в (final)
    // Result: пхлоув
    expect(khmerToRussian('ផ្លូវ')).toBe('пхлоув')
  })

  it('handles "សរ" (sa)', () => {
    // ស (sa) + រ (ro) -> сар
    expect(khmerToRussian('សរ')).toBe('сар')
  })

  it('handles spaces between words', () => {
    expect(khmerToRussian('ក ខ')).toBe('ка кха')
  })

  it('handles independent vowels', () => {
    expect(khmerToRussian('ឥ')).toBe('э, и')
    expect(khmerToRussian('ឦ')).toBe('эй')
  })

  it('handles vowel combinations', () => {
    expect(khmerToRussian('កំ')).toBe('кам')
    expect(khmerToRussian('គំ')).toBe('кум')
  })

  it('handles standalone diacritics and edge cases', () => {
    // ៈ (yukoălpĭntŭ) - when alone, should return the original character
    // since it has no standalone pronunciation
    expect(khmerToRussian('ៈ')).toBe(undefined)
  })
})
