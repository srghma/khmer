import {
  CONSONANTS,
  EXTRA_CONSONANTS,
  INDEPENDENT_VOWELS,
  VOWELS,
  DIACRITICS,
  VOWEL_COMBINATIONS,
  type ConsonantDef,
  type ExtraConsonantDef,
  type IndependentVowelDef,
  type VowelDef,
  type DiacriticDef,
  type VowelCombinationDef,
  type NumberDef,
  type PunctuationDef,
  type LunarDateSymbolDef,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-consonants-vovels'

import type { ProcessDataOutputKhmerCursor_OnlyFirstLevel } from './toGroupKhmer_cursor_onlyFirstLevel'
import type { ProcessDataOutputKhmerCursor_FirstAndSecondLevel } from './toGroupKhmer_cursor_full'
import { charKhmerExtraConsonant_unhash, charKhmerVowelCombination_unhash } from './toGroupKhmer'
import { Array_eq } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/array'
import { Char_eq } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char'

// --- Lookup Maps/Functions ---

const findConsonant = (char: string) => CONSONANTS.find(c => c.letter === char)
const findVowel = (char: string) => VOWELS.find(c => c.letter === char)
const findIndependent = (char: string) => INDEPENDENT_VOWELS.find(c => c.letters === char)
const findDiacritic = (char: string) => DIACRITICS.find(c => c.symbol === char)
// const findNumber = (char: string) => NUMBERS.find(c => c.digit === char)
// const findPunctuation = (char: string) => PUNCTUATIONS.find(c => c.symbol === char)
// const findLunar = (char: string) => KHMER_LUNAR_DATE_SYMBOLS.find(c => c.symbol === char)

const findExtraConsonant = (hashed: any) => {
  const chars = charKhmerExtraConsonant_unhash(hashed)

  return EXTRA_CONSONANTS.find(c => Array_eq(Char_eq, c.letters, chars))
}

const findVowelCombination = (hashed: any) => {
  const chars = charKhmerVowelCombination_unhash(hashed)

  return VOWEL_COMBINATIONS.find(c => Array_eq(Char_eq, c.letters, chars))
}

// --- Union Type for UI ---

export type KhmerCharDefinition =
  | { type: 'consonant'; def: ConsonantDef }
  | { type: 'vowel'; def: VowelDef }
  | { type: 'independent_vowel'; def: IndependentVowelDef }
  | { type: 'diacritic'; def: DiacriticDef }
  | { type: 'extra_consonant'; def: ExtraConsonantDef }
  | { type: 'vowel_combination'; def: VowelCombinationDef }
  | { type: 'number'; def: NumberDef }
  | { type: 'punctuation'; def: PunctuationDef }
  | { type: 'lunar'; def: LunarDateSymbolDef }
  | { type: 'special_group'; label: string }
  | { type: 'unknown'; label: string }

// --- Retrieval Functions ---

export const getDefinitionFromL1 = (cursor: ProcessDataOutputKhmerCursor_OnlyFirstLevel): KhmerCharDefinition => {
  switch (cursor.t) {
    case 'words_consonant': {
      const def = findConsonant(cursor.firstChar)

      return def ? { type: 'consonant', def } : { type: 'unknown', label: cursor.firstChar }
    }
    case 'words_independent_vowel': {
      const def = findIndependent(cursor.firstChar)

      return def ? { type: 'independent_vowel', def } : { type: 'unknown', label: cursor.firstChar }
    }
    case 'words_vowel': {
      const def = findVowel(cursor.firstChar)

      return def ? { type: 'vowel', def } : { type: 'unknown', label: cursor.firstChar }
    }
    case 'words_diacritic': {
      const def = findDiacritic(cursor.firstChar)

      return def ? { type: 'diacritic', def } : { type: 'unknown', label: cursor.firstChar }
    }
    case 'numbers':
      return { type: 'special_group', label: 'Numbers (លេខ)' }
    case 'punctuation':
      return { type: 'special_group', label: 'Punctuation (សញ្ញា)' }
    case 'lunarDates':
      return { type: 'special_group', label: 'Lunar Dates' }
    case 'others_known':
      return { type: 'special_group', label: 'Others' }
  }
}

export const getDefinitionFromL2 = (cursor: ProcessDataOutputKhmerCursor_FirstAndSecondLevel): KhmerCharDefinition => {
  if (
    cursor.t === 'numbers' ||
    cursor.t === 'punctuation' ||
    cursor.t === 'lunarDates' ||
    cursor.t === 'others_known'
  ) {
    // Should not happen for L2 navigation usually, but safe fallback
    return { type: 'special_group', label: cursor.t }
  }

  const sub = cursor.secondChar

  switch (sub.t) {
    case 'noSecondChar':
      return { type: 'special_group', label: 'No Subscript (∅)' }
    case 'consonant': {
      const def = findConsonant(sub.v)

      return def ? { type: 'consonant', def } : { type: 'unknown', label: sub.v }
    }
    case 'vowel': {
      const def = findVowel(sub.v)

      return def ? { type: 'vowel', def } : { type: 'unknown', label: sub.v }
    }
    case 'independent_vowel': {
      const def = findIndependent(sub.v)

      return def ? { type: 'independent_vowel', def } : { type: 'unknown', label: sub.v }
    }
    case 'diacritic': {
      const def = findDiacritic(sub.v)

      return def ? { type: 'diacritic', def } : { type: 'unknown', label: sub.v }
    }
    case 'extraConsonant': {
      const def = findExtraConsonant(sub.v)

      return def ? { type: 'extra_consonant', def } : { type: 'unknown', label: sub.v }
    }
    case 'vowelCombination': {
      const def = findVowelCombination(sub.v)

      return def ? { type: 'vowel_combination', def } : { type: 'unknown', label: sub.v }
    }
  }
}
