import { Array_startsWith } from './array'
import { type Char, Char_eq } from './char'
import {
  type CharKhmerConsonant,
  type CharKhmerVowel,
  type CharKhmerIndependentVowel,
  type CharKhmerDiacritic,
  isCharKhmerIndependentVowel,
  isCharKhmerConsonant,
  isCharKhmerVowel,
  isCharKhmerDiacritic,
  type CharKhmerExtraConsonant,
  type CharKhmerVowelCombination,
  isCharKhmerExtraConsonants,
  isCharKhmerVowelCombination,
  EXTRA_CONSONANTS,
  VOWEL_COMBINATIONS,
} from './khmer-consonants-vovels'

export type CharKhmerGroup_OneChar =
  | { type: 'consonant'; v: CharKhmerConsonant }
  | { type: 'vowel'; v: CharKhmerVowel }
  | { type: 'independent_vowel'; v: CharKhmerIndependentVowel }
  | { type: 'diacritic'; v: CharKhmerDiacritic }

export const detectCharKhmer_oneChar = (c: Char): CharKhmerGroup_OneChar | undefined => {
  if (isCharKhmerIndependentVowel(c)) return { type: 'independent_vowel', v: c }
  if (isCharKhmerConsonant(c)) return { type: 'consonant', v: c }
  if (isCharKhmerVowel(c)) return { type: 'vowel', v: c }
  if (isCharKhmerDiacritic(c)) return { type: 'diacritic', v: c }
  return undefined
}

//////////////////////

export type CharKhmerGroup_ArrayOfChars =
  | { type: 'extra_consonant'; v: CharKhmerExtraConsonant }
  | { type: 'vowel_combination'; v: CharKhmerVowelCombination }

export const detectCharKhmer_arrayOfChars = (cs: readonly Char[]): CharKhmerGroup_ArrayOfChars | undefined => {
  if (isCharKhmerExtraConsonants(cs)) return { type: 'extra_consonant', v: cs }
  if (isCharKhmerVowelCombination(cs)) return { type: 'vowel_combination', v: cs }
  return undefined
}

//////////////////////

export type CharKhmerGroup = CharKhmerGroup_ArrayOfChars | CharKhmerGroup_OneChar

export const detectCharKhmer_usingEquality_orThrow = (cs: readonly Char[]): CharKhmerGroup => {
  const arrayRes = detectCharKhmer_arrayOfChars(cs)
  if (arrayRes) return arrayRes
  if (cs.length === 1) {
    const c = cs[0]
    if (!c) throw new Error('detectCharKhmer_usingEquality: Unexpected empty array after length check')
    const res = detectCharKhmer_oneChar(c!)
    if (res) return res
    throw new Error(`detectCharKhmer_usingEquality: Unknown one char Khmer sequence: ${JSON.stringify(cs)}`)
  }
  throw new Error(`detectCharKhmer_usingEquality: Unknown Khmer sequence: ${JSON.stringify(cs)}`)
}

const MATCHERS = [
  ...EXTRA_CONSONANTS.map(def => ({ type: 'extra_consonant' as const, v: def.letters })),
  ...VOWEL_COMBINATIONS.map(def => ({ type: 'vowel_combination' as const, v: def.letters })),
].sort((a, b) => b.v.length - a.v.length)

export const detectCharKhmer_usingStartsWith_orThrow = (cs: readonly Char[]): CharKhmerGroup => {
  if (cs.length === 0) throw new Error('detectCharKhmer_usingStartsWith: Input array is empty')
  for (const m of MATCHERS) {
    if (Array_startsWith(Char_eq, cs, m.v)) return m
  }
  const c = cs[0]
  if (!c) throw new Error('detectCharKhmer_usingStartsWith: Unexpected empty first char')
  const res = detectCharKhmer_oneChar(c!)
  if (res) return res
  throw new Error(`detectCharKhmer_usingStartsWith: Unknown start of sequence: ${JSON.stringify(cs)}`)
}
