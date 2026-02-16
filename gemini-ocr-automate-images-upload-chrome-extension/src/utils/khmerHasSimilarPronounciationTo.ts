import type { Char } from './char'
import { isCharKhmerNumber } from './khmer-consonants-vovels'
import type { TypedKhmerWord } from './khmer-word'

/**
 * Groups of consonants that are phonetically similar (usually Series A and Series O pairs).
 * We map the O-series (or secondary) variant to the A-series (or primary) variant for comparison.
 */
const CONSONANT_SIMILARITY_PAIRS: [string, string][] = [
  ['ក', 'គ'], // k (A) - k (O)
  ['ខ', 'ឃ'], // kh (A) - kh (O)
  ['ច', 'ជ'], // ch (A) - ch (O)
  ['ឆ', 'ឈ'], // chh (A) - chh (O)
  ['ដ', 'ឌ'], // d (A) - d (O)
  ['ឋ', 'ឍ'], // th (A) - th (O) [Retroflex]
  ['ណ', 'ន'], // n (A) - n (O)
  ['ត', 'ទ'], // t (A) - t (O)
  ['ថ', 'ធ'], // th (A) - th (O) [Dental]
  ['ផ', 'ភ'], // ph (A) - ph (O)
  ['ឡ', 'ល'], // l (A) - l (O)
]

// Create a lookup map for O(1) access
const PRONUNCIATION_MAP = new Map<string, string>()

CONSONANT_SIMILARITY_PAIRS.forEach(([primary, secondary]) => {
  // Map secondary to primary
  PRONUNCIATION_MAP.set(secondary, primary)
  // Ensure primary maps to itself (implicitly handled by default, but good for clarity if needed)
  PRONUNCIATION_MAP.set(primary, primary)
})

/**
 * Normalizes a Khmer char for pronunciation comparison:
 * 1. Returns null if it is a Khmer Number (to be ignored).
 * 2. Returns the 'primary' consonant if it belongs to a pair.
 * 3. Returns the char as-is otherwise (vowels, other consonants).
 */
const normalizeCharForPronunciation = (c: string): string | null => {
  // We cast to Char because we know it comes from a TypedKhmerWord
  if (isCharKhmerNumber(c as Char)) {
    return null
  }
  return PRONUNCIATION_MAP.get(c) || c
}

/**
 * Generates a normalized string string key representing the approximate pronunciation sequence.
 * - Ignores numbers.
 * - Normalizes consonant series pairs (e.g. គ -> ក).
 */
const getPronunciationKey = (word: TypedKhmerWord): string => {
  let key = ''
  for (const char of word) {
    const normalized = normalizeCharForPronunciation(char)
    if (normalized !== null) {
      key += normalized
    }
  }
  return key
}

/**
 * Checks if two Khmer words have similar pronunciation.
 *
 * Criteria:
 * 1. Ignores Khmer Numbers (០-៩).
 * 2. Treats phonetic consonant pairs as identical (e.g., Series A and Series O variants).
 *    - Example: 'k' variants (ក, គ) are treated as equal.
 *    - Example: 'kh' variants (ខ, ឃ) are treated as equal.
 */
export const hasSimilarPronounciationTo = (what: TypedKhmerWord, to: TypedKhmerWord): boolean => {
  if (what === to) return true
  return getPronunciationKey(what) === getPronunciationKey(to)
}
