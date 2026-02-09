import { describe, it, expect } from 'vitest'
import { khmerSentenceToWords_usingDictionary } from './khmer_segmentation'
import { strToKhmerWordOrThrow } from './khmer-word'

const K = strToKhmerWordOrThrow

// Common dictionary words used in the doc examples
const WORD_PLOV = K('ផ្លូវ')
const WORD_KAKVENG_KA = K('កខ្វេងក') // As per doc comment example segmentation
const WORD_KVAK = K('ខ្វាក់')

describe('khmerSentenceToWords_usingDictionary', () => {
  // Dictionary setup matching the "known words" from the examples
  const dict = new Set([WORD_PLOV, WORD_KAKVENG_KA, WORD_KVAK])
  // Fix: Wrap .has in an arrow function to preserve 'this' context of the Set
  const dictHas = (s: any) => dict.has(s)

  it('segments correctly when all words are in dictionary (Longest Match)', () => {
    // Doc: 'ផ្លូវកខ្វេងកខ្វាក់' => ['ផ្លូវ', 'កខ្វេងក', 'ខ្វាក់']
    const input = K('ផ្លូវកខ្វេងកខ្វាក់')
    const result = khmerSentenceToWords_usingDictionary(input, dictHas)

    expect(result).toEqual([WORD_PLOV, WORD_KAKVENG_KA, WORD_KVAK])
  })

  it('prioritizes longest match in dictionary', () => {
    // Setup: Dict has "AB" and "A". Input "AB". Should match "AB".
    const wordA = K('ក')
    const wordB = K('ខ')
    const wordAB = K('កខ')

    const overlapDict = new Set([wordA, wordB, wordAB])

    const input = K('កខ')
    const result = khmerSentenceToWords_usingDictionary(input, s => overlapDict.has(s))

    expect(result).toEqual([wordAB])
  })

  it('falls back to shortest match if longest not available', () => {
    // Setup: Dict has "A", "B". Input "AB". Should match "A", "B".
    const wordA = K('ក')
    const wordB = K('ខ')

    const simpleDict = new Set([wordA, wordB])

    const input = K('កខ')
    const result = khmerSentenceToWords_usingDictionary(input, s => simpleDict.has(s))

    expect(result).toEqual([wordA, wordB])
  })

  it("correctly splits 'មិនចេះចប់' as one token when both 'មិន' and 'មិនចេះចប់' are in dict", () => {
    const wordMin = K('មិន')
    const wordMinChehJob = K('មិនចេះចប់')

    const dict = new Set([wordMin, wordMinChehJob])
    const input = K('មិនចេះចប់')

    const result = khmerSentenceToWords_usingDictionary(input, s => dict.has(s))

    expect(result).toEqual([wordMinChehJob])
  })
})
