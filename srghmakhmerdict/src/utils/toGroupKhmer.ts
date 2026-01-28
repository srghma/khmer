import {
  detectCharKhmer_oneChar,
  detectCharKhmer_usingEquality_orThrow,
  type CharKhmerGroup,
  type CharKhmerGroup_ArrayOfChars,
  type CharKhmerGroup_OneChar,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-consonants-vovels-groups'
import {
  Array_toNonEmptyArray_orThrow,
  Array_toNonEmptyArray_orUndefined,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type KhmerInfo } from './keyExtractionKhmer'
import {
  assertIsDefinedAndReturn,
  assertNever,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import {
  Char_isChar,
  CharArray_mkFromString,
  type Char,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char'
import type {
  CharKhmerConsonant,
  CharKhmerDiacritic,
  CharKhmerExtraConsonant,
  CharKhmerIndependentVowel,
  CharKhmerVowel,
  CharKhmerVowelCombination,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-consonants-vovels'

/////////////
// Hashing Utilities
/////////////
/////////////
export type CharKhmerExtraConsonant_Hashed = NonEmptyStringTrimmed & {
  __brandCharKhmerExtraConsonant_Hashed: 'CharKhmerExtraConsonant_Hashed'
}
export const charKhmerExtraConsonant_hash = (c: CharKhmerExtraConsonant) => c.join('') as CharKhmerExtraConsonant_Hashed
export const charKhmerExtraConsonant_unhash = (c: CharKhmerExtraConsonant_Hashed) =>
  CharArray_mkFromString(c) as CharKhmerExtraConsonant
/////////////
export type CharKhmerVowelCombination_Hashed = NonEmptyStringTrimmed & {
  __brandCharKhmerVowelCombination_Hashed: 'CharKhmerVowelCombination_Hashed'
}
export const charKhmerVowelCombination_hash = (c: CharKhmerVowelCombination) =>
  c.join('') as CharKhmerVowelCombination_Hashed
export const charKhmerVowelCombination_unhash = (c: CharKhmerVowelCombination_Hashed) =>
  CharArray_mkFromString(c) as CharKhmerVowelCombination
/////////////
export type CharKhmerGroup_OneChar_Hashed =
  | CharKhmerConsonant
  | CharKhmerVowel
  | CharKhmerIndependentVowel
  | CharKhmerDiacritic
export const charKhmerGroup_OneChar_hash = (c: CharKhmerGroup_OneChar) => c.v
export const charKhmerGroup_OneChar_unhash = (c: CharKhmerGroup_OneChar_Hashed) =>
  assertIsDefinedAndReturn(detectCharKhmer_oneChar(c))
/////////////
export type CharKhmerGroup_ArrayOfChars_Hashed = CharKhmerExtraConsonant_Hashed | CharKhmerVowelCombination_Hashed
export const charKhmerGroup_ArrayOfChars_hash = (
  c: CharKhmerGroup_ArrayOfChars,
): CharKhmerGroup_ArrayOfChars_Hashed => {
  switch (c.type) {
    case 'extra_consonant':
      return charKhmerExtraConsonant_hash(c.v)
    case 'vowel_combination':
      return charKhmerVowelCombination_hash(c.v)
    default:
      return assertNever(c)
  }
}
export const charKhmerGroup_ArrayOfChars_unhash = (c: CharKhmerGroup_ArrayOfChars_Hashed) => {
  const chars = CharArray_mkFromString(c)
  const g = detectCharKhmer_usingEquality_orThrow(chars)

  if (g.type === 'extra_consonant' || g.type === 'vowel_combination') return g
  throw new Error(`Expected ArrayOfChars but got ${g.type} for chars ${c}`)
}
/////////////
export type CharKhmerGroup_Hashed = CharKhmerGroup_OneChar_Hashed | CharKhmerGroup_ArrayOfChars_Hashed

export const charKhmerGroup_hash = (c: CharKhmerGroup): CharKhmerGroup_Hashed => {
  switch (c.type) {
    case 'consonant':
    case 'vowel':
    case 'independent_vowel':
    case 'diacritic':
      return charKhmerGroup_OneChar_hash(c)
    case 'extra_consonant':
    case 'vowel_combination':
      return charKhmerGroup_ArrayOfChars_hash(c)
    default:
      return assertNever(c)
  }
}

export const charKhmerGroup_unhash = (c: CharKhmerGroup_Hashed): CharKhmerGroup => {
  if (Char_isChar(c)) return charKhmerGroup_OneChar_unhash(c)

  return detectCharKhmer_usingEquality_orThrow(CharArray_mkFromString(c))
}
/////////////

/////////////
// Flat Interfaces
/////////////

export interface AlphabetGroupKhmer {
  readonly subGroups_consonant: Map<CharKhmerConsonant, NonEmptyArray<NonEmptyStringTrimmed>>
  readonly subGroups_vowel: Map<CharKhmerVowel, NonEmptyArray<NonEmptyStringTrimmed>>
  readonly subGroups_independent_vowel: Map<CharKhmerIndependentVowel, NonEmptyArray<NonEmptyStringTrimmed>>
  readonly subGroups_diacritic: Map<CharKhmerDiacritic, NonEmptyArray<NonEmptyStringTrimmed>>

  readonly subGroups_extraConsonant: Map<CharKhmerExtraConsonant_Hashed, NonEmptyArray<NonEmptyStringTrimmed>>
  readonly subGroups_vowelCombination: Map<CharKhmerVowelCombination_Hashed, NonEmptyArray<NonEmptyStringTrimmed>>

  // Q: maybe better subGroups_noSecondCharPresent? bc its only one word and it is equal to Key of map if present at all
  // A: no, bc can be "123 letter 123"
  readonly subGroups_noSecondChar?: NonEmptyArray<NonEmptyStringTrimmed>
}

export interface ProcessDataOutputKhmer {
  readonly words_consonant: Map<CharKhmerConsonant, AlphabetGroupKhmer>
  readonly words_vowel: Map<CharKhmerVowel, AlphabetGroupKhmer>
  readonly words_independent_vowel: Map<CharKhmerIndependentVowel, AlphabetGroupKhmer>
  readonly words_diacritic: Map<CharKhmerDiacritic, AlphabetGroupKhmer>

  readonly numbers?: NonEmptyArray<NonEmptyStringTrimmed>
  readonly punctuation?: NonEmptyArray<NonEmptyStringTrimmed>
  readonly lunarDates?: NonEmptyArray<NonEmptyStringTrimmed>
  readonly others_known?: NonEmptyArray<NonEmptyStringTrimmed>
}

/////////////
// Functional Implementation
/////////////

type Accumulator = {
  readonly sub_consonant: Map<CharKhmerConsonant, NonEmptyStringTrimmed[]>
  readonly sub_vowel: Map<CharKhmerVowel, NonEmptyStringTrimmed[]>
  readonly sub_indep: Map<CharKhmerIndependentVowel, NonEmptyStringTrimmed[]>
  readonly sub_diacritic: Map<CharKhmerDiacritic, NonEmptyStringTrimmed[]>
  readonly sub_extra: Map<CharKhmerExtraConsonant_Hashed, NonEmptyStringTrimmed[]>
  readonly sub_vowelCombo: Map<CharKhmerVowelCombination_Hashed, NonEmptyStringTrimmed[]>
  readonly noSecond: NonEmptyStringTrimmed[]
}

const mkAccumulator = (): Accumulator => ({
  sub_consonant: new Map(),
  sub_vowel: new Map(),
  sub_indep: new Map(),
  sub_diacritic: new Map(),
  sub_extra: new Map(),
  sub_vowelCombo: new Map(),
  noSecond: [],
})

const addToMap = <K, V>(map: Map<K, V[]>, k: K, v: V) => {
  const arr = map.get(k)

  if (arr) arr.push(v)
  else map.set(k, [v])
}

const addWordToAccumulator = (
  acc: Accumulator,
  secondChar: CharKhmerGroup | undefined,
  word: NonEmptyStringTrimmed,
): void => {
  if (!secondChar) {
    acc.noSecond.push(word)

    return
  }
  switch (secondChar.type) {
    case 'consonant':
      addToMap(acc.sub_consonant, secondChar.v, word)
      break
    case 'vowel':
      addToMap(acc.sub_vowel, secondChar.v, word)
      break
    case 'independent_vowel':
      addToMap(acc.sub_indep, secondChar.v, word)
      break
    case 'diacritic':
      addToMap(acc.sub_diacritic, secondChar.v, word)
      break
    case 'extra_consonant':
      addToMap(acc.sub_extra, charKhmerExtraConsonant_hash(secondChar.v), word)
      break
    case 'vowel_combination':
      addToMap(acc.sub_vowelCombo, charKhmerVowelCombination_hash(secondChar.v), word)
      break
    default:
      assertNever(secondChar)
  }
}

/**
 * transformAccumulatorMap converts the mutable arrays in the accumulator Maps
 * into immutable NonEmptyArrays, while sorting keys to ensure Map iteration order is alphabetical.
 */
const transformAccumulatorMap = <K extends Char | NonEmptyStringTrimmed>(
  input: Map<K, NonEmptyStringTrimmed[]>,
): Map<K, NonEmptyArray<NonEmptyStringTrimmed>> => {
  const out = new Map<K, NonEmptyArray<NonEmptyStringTrimmed>>()
  const sortedKeys = Array.from(input.keys()).sort((a, b) => a.localeCompare(b))

  for (const k of sortedKeys) {
    out.set(k, Array_toNonEmptyArray_orThrow(assertIsDefinedAndReturn(input.get(k))))
  }

  return out
}

const accumulatorToGroup = (acc: Accumulator): AlphabetGroupKhmer => ({
  subGroups_consonant: transformAccumulatorMap(acc.sub_consonant),
  subGroups_vowel: transformAccumulatorMap(acc.sub_vowel),
  subGroups_independent_vowel: transformAccumulatorMap(acc.sub_indep),
  subGroups_diacritic: transformAccumulatorMap(acc.sub_diacritic),
  subGroups_extraConsonant: transformAccumulatorMap(acc.sub_extra),
  subGroups_vowelCombination: transformAccumulatorMap(acc.sub_vowelCombo),
  subGroups_noSecondChar: Array_toNonEmptyArray_orUndefined(acc.noSecond),
})

const finalizeGroups = <L extends Char>(map: Map<L, Accumulator>): Map<L, AlphabetGroupKhmer> => {
  const out = new Map<L, AlphabetGroupKhmer>()
  const sortedKeys = Array.from(map.keys()).sort((a, b) => a.localeCompare(b))

  for (const k of sortedKeys) {
    out.set(k, accumulatorToGroup(map.get(k)!))
  }

  return out
}

export function processDataKhmer(data: Iterable<readonly [NonEmptyStringTrimmed, KhmerInfo]>): ProcessDataOutputKhmer {
  // 1. Accumulate
  const acc_consonant = new Map<CharKhmerConsonant, Accumulator>()
  const acc_vowel = new Map<CharKhmerVowel, Accumulator>()
  const acc_indep = new Map<CharKhmerIndependentVowel, Accumulator>()
  const acc_diacritic = new Map<CharKhmerDiacritic, Accumulator>()

  const numbers: NonEmptyStringTrimmed[] = []
  const punctuation: NonEmptyStringTrimmed[] = []
  const lunarDates: NonEmptyStringTrimmed[] = []
  const others_known: NonEmptyStringTrimmed[] = []

  const getOrCreateAcc = <L extends Char>(map: Map<L, Accumulator>, key: L): Accumulator => {
    const existing = map.get(key)

    if (existing) return existing
    const created = mkAccumulator()

    map.set(key, created)

    return created
  }

  for (const [word, result] of data) {
    switch (result.type) {
      case 'khmer_number':
        numbers.push(word)
        break
      case 'khmer_punctuation':
        punctuation.push(word)
        break
      case 'khmer_lunar_date':
        lunarDates.push(word)
        break
      case 'khmer_other_known':
        others_known.push(word)
        break
      case 'khmer_word': {
        const { firstChar, secondChar } = result

        switch (firstChar.type) {
          case 'consonant':
            addWordToAccumulator(getOrCreateAcc(acc_consonant, firstChar.v), secondChar, word)
            break
          case 'vowel':
            addWordToAccumulator(getOrCreateAcc(acc_vowel, firstChar.v), secondChar, word)
            break
          case 'independent_vowel':
            addWordToAccumulator(getOrCreateAcc(acc_indep, firstChar.v), secondChar, word)
            break
          case 'diacritic':
            addWordToAccumulator(getOrCreateAcc(acc_diacritic, firstChar.v), secondChar, word)
            break
          default:
            assertNever(firstChar)
        }
        break
      }
      default:
        assertNever(result)
    }
  }

  // 2. Finalize
  return {
    words_consonant: finalizeGroups(acc_consonant),
    words_vowel: finalizeGroups(acc_vowel),
    words_independent_vowel: finalizeGroups(acc_indep),
    words_diacritic: finalizeGroups(acc_diacritic),
    numbers: Array_toNonEmptyArray_orUndefined(numbers),
    punctuation: Array_toNonEmptyArray_orUndefined(punctuation),
    lunarDates: Array_toNonEmptyArray_orUndefined(lunarDates),
    others_known: Array_toNonEmptyArray_orUndefined(others_known),
  }
}
