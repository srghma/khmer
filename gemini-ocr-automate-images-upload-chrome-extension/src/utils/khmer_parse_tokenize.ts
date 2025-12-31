import { Array_matchMany } from './array_match'
import { type Char } from './char'
import {
  EXTRA_CONSONANTS,
  INDEPENDENT_VOWELS,
  VOWEL_COMBINATIONS,
  CONSONANTS,
  VOWELS,
  DIACRITICS,
  type CharKhmerConsonant,
  type CharKhmerVowel,
  type CharKhmerIndependentVowel,
  type CharKhmerDiacritic,
  unsafe_char_toCharKhmerExtraConsonant,
  unsafe_char_toCharKhmerVowelCombination,
} from './khmer-consonants-vovels'
import type { CharKhmerGroup } from './khmer-consonants-vovels-groups'
import { Array_toNonEmptyArray_orThrow, type NonEmptyArray } from './non-empty-array'

export type Token =
  | { type: 'SPACE'; v: NonEmptyArray<Char> }
  | { type: 'UNKNOWN'; v: NonEmptyArray<Char> }
  | CharKhmerGroup

// Internal intermediate state to track what has been tokenized and what is still raw text
type TokenSegment = Token | { type: 'PENDING'; v: NonEmptyArray<Char> }

function createKhmerToken_Char_mkOrThrow(chars: readonly Char[]): any {
  // Use Array.from to handle surrogate pairs correctly
  const l = chars.length
  if (l !== 1) throw new Error(`Expected single character, got length ${l}: "${chars}"`)
  return chars[0] as Char
}

// Helper to convert CharKhmerGroup type strings to the group structure
const createKhmerToken = (type: CharKhmerGroup['type'], chars: readonly Char[]): CharKhmerGroup => {
  switch (type) {
    case 'consonant':
      return { type: 'consonant', v: createKhmerToken_Char_mkOrThrow(chars) as CharKhmerConsonant }
    case 'vowel':
      return { type: 'vowel', v: createKhmerToken_Char_mkOrThrow(chars) as CharKhmerVowel }
    case 'independent_vowel':
      return { type: 'independent_vowel', v: createKhmerToken_Char_mkOrThrow(chars) as CharKhmerIndependentVowel }
    case 'diacritic':
      return { type: 'diacritic', v: createKhmerToken_Char_mkOrThrow(chars) as CharKhmerDiacritic }
    case 'extra_consonant':
      return { type: 'extra_consonant', v: unsafe_char_toCharKhmerExtraConsonant(chars) }
    case 'vowel_combination':
      return { type: 'vowel_combination', v: unsafe_char_toCharKhmerVowelCombination(chars) }
  }
}

// Helper to apply a dictionary to all PENDING segments
const applyLayer = (
  segments: TokenSegment[],
  patterns: readonly (readonly Char[])[],
  tokenType: CharKhmerGroup['type'],
): TokenSegment[] => {
  return segments.flatMap((seg: TokenSegment) => {
    // If already a finalized Token, keep it as is
    if (seg.type !== 'PENDING') return [seg]

    // If PENDING, try to match against the current patterns
    const matchResults = Array_matchMany(patterns, seg.v)

    // Map the match results back to Segments
    return matchResults.map((res): TokenSegment => {
      if (res.t === 'matched') {
        // Found a match! Convert to specific Token type
        return createKhmerToken(tokenType, res.word)
      } else {
        // Still not matched, keep as PENDING for the next layer
        return { type: 'PENDING', v: Array_toNonEmptyArray_orThrow(res.otherSentencePart) }
      }
    })
  })
}

// ['ស', '្', 'រ', '្', 'ត', 'ី'] =>
// first detect EXTRA_CONSONANTS (several consecutive chars)
// then VOWEL_COMBINATIONS (several consecutive chars)
// then CONSONANTS
// then VOWELS
export const tokenize = (text: readonly Char[]): readonly Token[] => {
  // 1. Initial State: The whole text is one PENDING segment
  let segments: TokenSegment[] = [{ type: 'PENDING', v: Array_toNonEmptyArray_orThrow(text) }]

  // 1. Extra Consonants (Complex clusters involving diacritics)
  segments = applyLayer(
    segments,
    EXTRA_CONSONANTS.map(x => x.letters),
    'extra_consonant',
  )

  // 2. Independent Vowels
  segments = applyLayer(
    segments,
    INDEPENDENT_VOWELS.map(x => [x.letters]),
    'independent_vowel',
  )

  // 3. Vowel Combinations
  segments = applyLayer(
    segments,
    VOWEL_COMBINATIONS.map(x => x.letters),
    'vowel_combination',
  )

  // 4. Standard Consonants
  segments = applyLayer(
    segments,
    CONSONANTS.map(x => [x.letter]),
    'consonant',
  )

  // 5. Standard Vowels
  segments = applyLayer(
    segments,
    VOWELS.map(x => [x.letter]),
    'vowel',
  )

  // 6. Diacritics
  segments = applyLayer(
    segments,
    DIACRITICS.map(x => [x.symbol]),
    'diacritic',
  )

  return segments.flatMap((seg): Token[] => {
    // Already finalized tokens pass through
    if (seg.type !== 'PENDING') return [seg]

    // Process the remaining raw characters
    const results: Token[] = []
    for (const char of seg.v) {
      if (char === ' ') {
        results.push({ type: 'SPACE', v: Array_toNonEmptyArray_orThrow([char]) })
      } else {
        // Fallback for symbols, numbers, or characters not in our definitions
        results.push({ type: 'UNKNOWN', v: Array_toNonEmptyArray_orThrow([char]) })
      }
    }
    return results
  })
}
