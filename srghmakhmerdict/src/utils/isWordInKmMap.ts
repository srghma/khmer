import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import {
  VOWELS,
  DIACRITICS,
  VOWEL_COMBINATIONS,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-consonants-vovels'
import type { KhmerWordsMap } from '../db/dict'
import type { Char } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char'

const chars: (Char | undefined)[] = [
  ...DIACRITICS.map(x => x.symbol),
  ...VOWELS.map(x => (x.letter === 'អ' ? undefined : x.letter)),
  ...VOWEL_COMBINATIONS.flatMap(x => x.letters),
]

const khmerDiactricOrVovelChars: Set<Char> = new Set(chars.filter((x): x is Char => !!x))

// same as has, but is safe to not generate ugly words
export function isWordInKmMap(word: TypedContainsKhmer, km_map: KhmerWordsMap): boolean {
  const isKhmerDiactricOrVovelChar = (khmerDiactricOrVovelChars as Set<string>).has(word as string)

  if (isKhmerDiactricOrVovelChar) return false

  return km_map.has(word)
}
