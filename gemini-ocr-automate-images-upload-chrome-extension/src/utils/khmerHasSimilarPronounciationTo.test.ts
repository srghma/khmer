import { describe, it, expect } from 'vitest'
import { hasSimilarPronounciationTo } from './khmerHasSimilarPronounciationTo' // Adjust path as needed
import { strToKhmerWordOrThrow } from './khmer-word'

// Helper to make test cases cleaner
const w = (s: string) => strToKhmerWordOrThrow(s)

describe('hasSimilarPronounciationTo', () => {
  it('should return true for identical words', () => {
    expect(hasSimilarPronounciationTo(w('កម្ពុជា'), w('កម្ពុជា'))).toBe(true)
  })

  it('should ignore Khmer numbers in the comparison', () => {
    // "Ka" vs "Ka" + "1"
    expect(hasSimilarPronounciationTo(w('ក'), w('ក១'))).toBe(true)
    // "Khom" vs "2" + "Khom"
    expect(hasSimilarPronounciationTo(w('ខ្ញុំ'), w('២ខ្ញុំ'))).toBe(true)
    // Number only vs empty (Technically empty isn't a KhmerWord via Regex usually, but if valid)
    // Testing purely ignoring numbers inside words:
    expect(hasSimilarPronounciationTo(w('ឆ្នាំ២០២៤'), w('ឆ្នាំ'))).toBe(true)
  })

  it('should treat "k" variants (ក/គ) as similar', () => {
    // Direct consonant comparison
    expect(hasSimilarPronounciationTo(w('ក'), w('គ'))).toBe(true)
    // With vowels
    expect(hasSimilarPronounciationTo(w('កា'), w('គា'))).toBe(true)
  })

  it('should treat "kh" variants (ខ/ឃ) as similar', () => {
    expect(hasSimilarPronounciationTo(w('ខ'), w('ឃ'))).toBe(true)
    expect(hasSimilarPronounciationTo(w('ខេមរា'), w('ឃេមរា'))).toBe(true)
  })

  it('should treat "ch" variants (ច/ជ) as similar', () => {
    expect(hasSimilarPronounciationTo(w('ច'), w('ជ'))).toBe(true)
  })

  it('should treat "chh" variants (ឆ/ឈ) as similar', () => {
    expect(hasSimilarPronounciationTo(w('ឆ'), w('ឈ'))).toBe(true)
  })

  it('should treat "t" variants (ត/ទ) as similar', () => {
    expect(hasSimilarPronounciationTo(w('ត'), w('ទ'))).toBe(true)
  })

  it('should treat "th" variants (ថ/ធ) as similar', () => {
    expect(hasSimilarPronounciationTo(w('ថ'), w('ធ'))).toBe(true)
  })

  it('should treat "ph" variants (ផ/ភ) as similar', () => {
    expect(hasSimilarPronounciationTo(w('ផ'), w('ភ'))).toBe(true)
  })

  it('should treat "l" variants (ឡ/ល) as similar', () => {
    expect(hasSimilarPronounciationTo(w('ឡ'), w('ល'))).toBe(true)
  })

  it('should treat "n" variants (ណ/ន) as similar', () => {
    expect(hasSimilarPronounciationTo(w('ណ'), w('ន'))).toBe(true)
  })

  it('should NOT return true for distinct consonants', () => {
    // k vs kh
    expect(hasSimilarPronounciationTo(w('ក'), w('ខ'))).toBe(false)
    // t vs d
    expect(hasSimilarPronounciationTo(w('ត'), w('ដ'))).toBe(false)
    // p vs m
    expect(hasSimilarPronounciationTo(w('ព'), w('ម'))).toBe(false)
  })

  it('should handle complex words with mixed variations', () => {
    // ក (k-a) + ខ (kh-a) vs គ (k-o) + ឃ (kh-o)
    expect(hasSimilarPronounciationTo(w('កខ'), w('គឃ'))).toBe(true)

    // Testing ignoring numbers + normalized consonant
    // ក១ (ka-1) vs គ (ko)
    expect(hasSimilarPronounciationTo(w('ក១'), w('គ'))).toBe(true)
  })
})
