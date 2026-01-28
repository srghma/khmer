import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'

import type {
  CharKhmerConsonant,
  CharKhmerDiacritic,
  CharKhmerIndependentVowel,
  CharKhmerVowel,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-consonants-vovels'
import type {
  CharKhmerExtraConsonant_Hashed,
  CharKhmerVowelCombination_Hashed,
  AlphabetGroupKhmer,
  ProcessDataOutputKhmer,
} from './toGroupKhmer'
import { Map_getFirstKey, Map_getFirstEntry } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/map'

export type ProcessDataOutputKhmerCursorSub_FirstAndSecondLevel =
  | { t: 'consonant'; v: CharKhmerConsonant }
  | { t: 'vowel'; v: CharKhmerVowel }
  | { t: 'independent_vowel'; v: CharKhmerIndependentVowel }
  | { t: 'diacritic'; v: CharKhmerDiacritic }
  | { t: 'extraConsonant'; v: CharKhmerExtraConsonant_Hashed }
  | { t: 'vowelCombination'; v: CharKhmerVowelCombination_Hashed }
  | { t: 'noSecondChar' }

export type ProcessDataOutputKhmerCursor_FirstAndSecondLevel =
  | {
      t: 'words_consonant'
      firstChar: CharKhmerConsonant
      secondChar: ProcessDataOutputKhmerCursorSub_FirstAndSecondLevel
    }
  | { t: 'words_vowel'; firstChar: CharKhmerVowel; secondChar: ProcessDataOutputKhmerCursorSub_FirstAndSecondLevel }
  | {
      t: 'words_independent_vowel'
      firstChar: CharKhmerIndependentVowel
      secondChar: ProcessDataOutputKhmerCursorSub_FirstAndSecondLevel
    }
  | {
      t: 'words_diacritic'
      firstChar: CharKhmerDiacritic
      secondChar: ProcessDataOutputKhmerCursorSub_FirstAndSecondLevel
    }
  | { t: 'numbers' }
  | { t: 'punctuation' }
  | { t: 'lunarDates' }
  | { t: 'others_known' }

// Memoized 0-arity constructors
export const SUB_NO_SECOND_CHAR: ProcessDataOutputKhmerCursorSub_FirstAndSecondLevel = { t: 'noSecondChar' }

export const RES_NUMBERS: ProcessDataOutputKhmerCursor_FirstAndSecondLevel = { t: 'numbers' }
export const RES_PUNCTUATION: ProcessDataOutputKhmerCursor_FirstAndSecondLevel = { t: 'punctuation' }
export const RES_LUNAR_DATES: ProcessDataOutputKhmerCursor_FirstAndSecondLevel = { t: 'lunarDates' }
export const RES_OTHERS_KNOWN: ProcessDataOutputKhmerCursor_FirstAndSecondLevel = { t: 'others_known' }

const getCursorSubFromGroup = (
  g: AlphabetGroupKhmer,
): ProcessDataOutputKhmerCursorSub_FirstAndSecondLevel | undefined => {
  const c = Map_getFirstKey(g.subGroups_consonant)

  if (c) return { t: 'consonant', v: c }

  const i = Map_getFirstKey(g.subGroups_independent_vowel)

  if (i) return { t: 'independent_vowel', v: i }

  const v = Map_getFirstKey(g.subGroups_vowel)

  if (v) return { t: 'vowel', v: v }

  const d = Map_getFirstKey(g.subGroups_diacritic)

  if (d) return { t: 'diacritic', v: d }

  const e = Map_getFirstKey(g.subGroups_extraConsonant)

  if (e) return { t: 'extraConsonant', v: e }

  const vc = Map_getFirstKey(g.subGroups_vowelCombination)

  if (vc) return { t: 'vowelCombination', v: vc }

  if (g.subGroups_noSecondChar) return SUB_NO_SECOND_CHAR

  return undefined
}

export const processDataOutputKhmerCursor_mkDefaultFor_orUndefined = (
  p: ProcessDataOutputKhmer,
): ProcessDataOutputKhmerCursor_FirstAndSecondLevel | undefined => {
  const c = Map_getFirstEntry(p.words_consonant)

  if (c) {
    const sub = getCursorSubFromGroup(c[1])

    if (sub) return { t: 'words_consonant', firstChar: c[0], secondChar: sub }
  }

  const i = Map_getFirstEntry(p.words_independent_vowel)

  if (i) {
    const sub = getCursorSubFromGroup(i[1])

    if (sub) return { t: 'words_independent_vowel', firstChar: i[0], secondChar: sub }
  }

  const v = Map_getFirstEntry(p.words_vowel)

  if (v) {
    const sub = getCursorSubFromGroup(v[1])

    if (sub) return { t: 'words_vowel', firstChar: v[0], secondChar: sub }
  }

  const d = Map_getFirstEntry(p.words_diacritic)

  if (d) {
    const sub = getCursorSubFromGroup(d[1])

    if (sub) return { t: 'words_diacritic', firstChar: d[0], secondChar: sub }
  }

  if (p.numbers) return RES_NUMBERS
  if (p.punctuation) return RES_PUNCTUATION
  if (p.lunarDates) return RES_LUNAR_DATES
  if (p.others_known) return RES_OTHERS_KNOWN

  return undefined
}

export const processDataOutputKhmerCursor_mkDefaultFor_orThrow = (
  p: ProcessDataOutputKhmer,
): ProcessDataOutputKhmerCursor_FirstAndSecondLevel =>
  assertIsDefinedAndReturn(
    processDataOutputKhmerCursor_mkDefaultFor_orUndefined(p),
    'In our db we expect at least one entry',
  )
