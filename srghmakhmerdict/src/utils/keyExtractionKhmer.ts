import { CharArray_mkFromString } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import {
  type CharKhmerLunarDateSymbol,
  type CharKhmerNumber,
  type CharKhmerPunctuation,
  isCharKhmerLunarDateSymbol,
  isCharKhmerNumber,
  isCharKhmerPunctuation,
  unsafe_char_toCharKhmerNumber,
  unsafe_char_toCharKhmerPunctuation,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-consonants-vovels'
import {
  type CharKhmerGroup,
  type CharKhmerGroup_OneChar,
  detectCharKhmer_oneChar,
  detectCharKhmer_usingStartsWith_orThrow,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-consonants-vovels-groups'
import {
  Array_isNonEmptyArray,
  Array_toNonEmptyArray_orThrow,
  type NonEmptyArray,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'

export type FirstChar = CharKhmerGroup_OneChar

export type SecondChar = CharKhmerGroup | undefined

const isCoeng = (ch: string) => ch === '្'

const otherKnownKhmerWords: readonly NonEmptyStringTrimmed[] = [
  'គ៖',
  'ឝ',
  'ឞ',
  'ខៗ',
  '។ល។',
  'ឝ្រី',
  'ឨ',
  '឴', // 17B4 Khmer Vowel Inherent AQ
  '឵', // 17B5 Khmer Vowel Inherent AA
  '្', // 17D2 Khmer Sign Coeng (Subscript)
  '៓', // 17D3 Khmer Sign Bathamasat
  '៛', // 17DB Khmer Currency Symbol Riel
  'ៜ', // 17DC Khmer Sign Avakrahasanya
  '៝', // 17DD Khmer Sign Attham
  '៰', // 17F0 Khmer Symbol Lek Attak Son
  '៱', // 17F1 Khmer Symbol Lek Attak Muoy
  '៲', // 17F2 Khmer Symbol Lek Attak Pii
  '៳', // 17F3 Khmer Symbol Lek Attak Bei
  '៴', // 17F4 Khmer Symbol Lek Attak Buon
  '៵', // 17F5 Khmer Symbol Lek Attak Pram
  '៶', // 17F6 Khmer Symbol Lek Attak Pram-Muoy
  '៷', // 17F7 Khmer Symbol Lek Attak Pram-Pii
  '៸', // 17F8 Khmer Symbol Lek Attak Pram-Bei
  '៹', // 17F9 Khmer Symbol Lek Attak Pram-Buon
] as NonEmptyStringTrimmed[]

export type KhmerInfo =
  | { type: 'khmer_word'; firstChar: FirstChar; secondChar: SecondChar }
  | { type: 'khmer_number'; v: NonEmptyArray<CharKhmerNumber> }
  | { type: 'khmer_punctuation'; v: NonEmptyArray<CharKhmerPunctuation> }
  | { type: 'khmer_lunar_date'; v: CharKhmerLunarDateSymbol }
  | { type: 'khmer_other_known'; v: NonEmptyStringTrimmed }

export function extractKeysKhmer(word: NonEmptyStringTrimmed): KhmerInfo {
  const otherW = otherKnownKhmerWords.find(w => word === w)

  if (otherW) return { type: 'khmer_other_known', v: otherW }

  // Filter out Coeng (subscript sign) to get base characters
  const cleanWordString = word.replace(/[^\p{Script=Khmer}]/gu, '')

  if (!cleanWordString) throw new Error(`extractKeysKhmer: no Khmer characters found in:  ${word}`)

  const chars = CharArray_mkFromString(cleanWordString).filter(ch => !isCoeng(ch))

  if (!Array_isNonEmptyArray(chars)) {
    throw new Error(`extractKeysKhmer: empty word after filtering coengs:  ${word} ,  ${chars}`)
  }

  if (chars.every(isCharKhmerNumber)) {
    return {
      type: 'khmer_number',
      v: Array_toNonEmptyArray_orThrow(chars.map(unsafe_char_toCharKhmerNumber)),
    }
  }

  if (chars.every(isCharKhmerPunctuation)) {
    return {
      type: 'khmer_punctuation',
      v: Array_toNonEmptyArray_orThrow(chars.map(unsafe_char_toCharKhmerPunctuation)),
    }
  }

  const c1 = chars[0]

  if (!c1) throw new Error(`extractKeysKhmer: empty word after filtering coengs:  ${word}  ${chars}`)

  if (isCharKhmerLunarDateSymbol(c1)) {
    return {
      type: 'khmer_lunar_date',
      v: c1,
    }
  }

  const firstChar: FirstChar = (() => {
    const r = detectCharKhmer_oneChar(c1)

    if (r) return r
    throw new Error(`extractKeysKhmer: invalid first Khmer char:  ${c1}`)
  })()

  const tail = chars.slice(1)

  const secondChar: SecondChar = (() => {
    if (tail.length === 0) return undefined

    return detectCharKhmer_usingStartsWith_orThrow(tail)
  })()

  return { type: 'khmer_word', firstChar, secondChar }
}
