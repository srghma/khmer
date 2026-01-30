import { type TypedKhmerWord } from './khmer-word'
import { Array_toNonEmptyArray_orThrow, type NonEmptyArray } from './non-empty-array'
import type { NonEmptyStringTrimmed } from './non-empty-string-trimmed'

const nativeSegmenter = new Intl.Segmenter('km', { granularity: 'word' })

/**
'ផ្លូវកខ្វេងកខ្វាក់'
=>['ផ្លូវ', 'កខ្វេងក', 'ខ្វាក់']
'ផ្លូវ កខ្វេងកខ្វាក់' (impossible)
=>['ផ្លូវ', ' ', 'កខ្វេងក', 'ខ្វាក់']
'ផ្លូវ  កខ្វេងកខ្វាក់' (impossible)
=>['ផ្លូវ', '  ', 'កខ្វេងក', 'ខ្វាក់']
'ផ្លូវ  tst កខ្វេងកខ្វាក់' (impossible)
=>['ផ្លូវ', '  ', 'tst', ' ', 'កខ្វេងក', 'ខ្វាក់']
'ផ្លូវ  tstកខ្វេងកខ្វាក់' (impossible)
=>['ផ្លូវ', '  ', 'tstកខ្វេងក', 'ខ្វាក់']
*/
export function khmerSentenceToWords_usingSegmenter(str: TypedKhmerWord): NonEmptyArray<TypedKhmerWord> {
  return Array_toNonEmptyArray_orThrow(Array.from(nativeSegmenter.segment(str)).map(s => s.segment as TypedKhmerWord))
}

// --- Dictionary Approach ---

/**
khmerSentenceToWords_usingDictionary('ផ្លូវកខ្វេងកខ្វាក់', new Set(khmerSentenceToWords_usingSegmenter('ផ្លូវកខ្វេងកខ្វាក់')))
(3) ['ផ្លូវ', 'កខ្វេងក', 'ខ្វាក់']
khmerSentenceToWords_usingDictionary('ផ្លូវ កខ្វេងកខ្វាក់', new Set(khmerSentenceToWords_usingSegmenter('ផ្លូវកខ្វេងកខ្វាក់'))) (impossible)
(4) ['ផ្លូវ', ' ', 'កខ្វេងក', 'ខ្វាក់']
khmerSentenceToWords_usingDictionary('ផ្លូវ  កខ្វេងកខ្វាក់', new Set(khmerSentenceToWords_usingSegmenter('ផ្លូវកខ្វេងកខ្វាក់'))) (impossible)
(5) ['ផ្លូវ', ' ', ' ', 'កខ្វេងក', 'ខ្វាក់']
khmerSentenceToWords_usingDictionary('ផ្លូវ  tst កខ្វេងកខ្វាក់', new Set(khmerSentenceToWords_usingSegmenter('ផ្លូវកខ្វេងកខ្វាក់'))) (impossible)
(9) ['ផ្លូវ', ' ', ' ', 't', 's', 't', ' ', 'កខ្វេងក', 'ខ្វាក់']
khmerSentenceToWords_usingDictionary('ផ្លូវ  tstកខ្វេងកខ្វាក់', new Set(khmerSentenceToWords_usingSegmenter('ផ្លូវកខ្វេងកខ្វាក់'))) (impossible)
(8) ['ផ្លូវ', ' ', ' ', 't', 's', 't', 'កខ្វេងក', 'ខ្វាក់']
 */
export const khmerSentenceToWords_usingDictionary = (
  str: TypedKhmerWord,
  dict: { has: (s: NonEmptyStringTrimmed) => boolean },
): NonEmptyArray<TypedKhmerWord> => {
  const chars = Array.from(str) as TypedKhmerWord[]
  const result: TypedKhmerWord[] = []

  // "Imperative Core" for performance/clarity, wrapped in a pure function
  let i = 0
  while (i < chars.length) {
    // Functional approach to finding the longest match at current position
    // We create a window from current position forward
    const match = findLongestDictionaryMatch(chars, i, dict)

    if (match) {
      result.push(match.word as TypedKhmerWord)
      i += match.length
    } else {
      // No match, consume one character (unknown)
      result.push(chars[i] as TypedKhmerWord)
      i++
    }
  }

  return Array_toNonEmptyArray_orThrow(result)
}

// Helper: Find longest prefix in dictionary starting at index
const findLongestDictionaryMatch = (
  chars: TypedKhmerWord[],
  startIndex: number,
  dict: { has: (s: NonEmptyStringTrimmed) => boolean },
): { word: string; length: number } | undefined => {
  let currentString = ''
  let bestMatch: { word: string; length: number } | undefined = undefined

  // Scan forward
  for (let j = startIndex; j < chars.length; j++) {
    currentString += chars[j]
    if (dict.has(currentString as TypedKhmerWord)) {
      bestMatch = { word: currentString, length: j - startIndex + 1 }
    }
  }

  return bestMatch
}
