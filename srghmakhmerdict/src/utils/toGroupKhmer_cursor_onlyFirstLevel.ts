import type {
  CharKhmerConsonant,
  CharKhmerDiacritic,
  CharKhmerIndependentVowel,
  CharKhmerVowel,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-consonants-vovels'
import type { ProcessDataOutputKhmer } from './toGroupKhmer'
import { Map_getFirstKey } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/map'
import { RES_NUMBERS, RES_PUNCTUATION, RES_LUNAR_DATES, RES_OTHERS_KNOWN } from './toGroupKhmer_cursor_full'

export type ProcessDataOutputKhmerCursor_OnlyFirstLevel =
  | { t: 'words_consonant'; firstChar: CharKhmerConsonant }
  | { t: 'words_vowel'; firstChar: CharKhmerVowel }
  | { t: 'words_independent_vowel'; firstChar: CharKhmerIndependentVowel }
  | { t: 'words_diacritic'; firstChar: CharKhmerDiacritic }
  | { t: 'numbers' }
  | { t: 'punctuation' }
  | { t: 'lunarDates' }
  | { t: 'others_known' }

export const processDataOutputKhmerCursor_mkDefaultFor_orUndefined = (
  p: ProcessDataOutputKhmer,
): ProcessDataOutputKhmerCursor_OnlyFirstLevel | undefined => {
  const c = Map_getFirstKey(p.words_consonant)

  if (c) return { t: 'words_consonant', firstChar: c }

  const i = Map_getFirstKey(p.words_independent_vowel)

  if (i) return { t: 'words_independent_vowel', firstChar: i }

  const v = Map_getFirstKey(p.words_vowel)

  if (v) return { t: 'words_vowel', firstChar: v }

  const d = Map_getFirstKey(p.words_diacritic)

  if (d) return { t: 'words_diacritic', firstChar: d }

  if (p.numbers) return RES_NUMBERS
  if (p.punctuation) return RES_PUNCTUATION
  if (p.lunarDates) return RES_LUNAR_DATES
  if (p.others_known) return RES_OTHERS_KNOWN

  return undefined
}

// export const processDataOutputKhmerCursor_mkDefaultFor_orThrow = (
//   p: ProcessDataOutputKhmer,
// ): ProcessDataOutputKhmerCursor_OnlyFirstLevel =>
//   assertIsDefinedAndReturn(
//     processDataOutputKhmerCursor_mkDefaultFor_orUndefined(p),
//     'In our db we expect at least one entry',
//   )

export const ProcessDataOutputKhmerCursor_OnlyFirstLevel_eq = (
  a: ProcessDataOutputKhmerCursor_OnlyFirstLevel,
  b: ProcessDataOutputKhmerCursor_OnlyFirstLevel,
): boolean => {
  if (a.t !== b.t) return false
  if ('firstChar' in a && 'firstChar' in b) return a.firstChar === b.firstChar

  return true
}
