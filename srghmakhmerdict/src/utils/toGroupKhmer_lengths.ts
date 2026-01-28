import type {
  CharKhmerConsonant,
  CharKhmerDiacritic,
  CharKhmerIndependentVowel,
  CharKhmerVowel,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-consonants-vovels'
import type {
  AlphabetGroupKhmer,
  CharKhmerExtraConsonant_Hashed,
  CharKhmerVowelCombination_Hashed,
  ProcessDataOutputKhmer,
} from './toGroupKhmer'
import { Map_mapValues } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/map'

export interface AlphabetGroupKhmer_Lengths {
  readonly subGroups_consonant: Map<CharKhmerConsonant, number>
  readonly subGroups_vowel: Map<CharKhmerVowel, number>
  readonly subGroups_independent_vowel: Map<CharKhmerIndependentVowel, number>
  readonly subGroups_diacritic: Map<CharKhmerDiacritic, number>

  readonly subGroups_extraConsonant: Map<CharKhmerExtraConsonant_Hashed, number>
  readonly subGroups_vowelCombination: Map<CharKhmerVowelCombination_Hashed, number>

  readonly subGroups_noSecondChar: number
}

export interface ProcessDataOutputKhmer_Lengths {
  readonly words_consonant: Map<CharKhmerConsonant, AlphabetGroupKhmer_Lengths>
  readonly words_vowel: Map<CharKhmerVowel, AlphabetGroupKhmer_Lengths>
  readonly words_independent_vowel: Map<CharKhmerIndependentVowel, AlphabetGroupKhmer_Lengths>
  readonly words_diacritic: Map<CharKhmerDiacritic, AlphabetGroupKhmer_Lengths>

  readonly numbers: number
  readonly punctuation: number
  readonly lunarDates: number
  readonly others_known: number
}

const mkAlphabetGroupLengths = (g: AlphabetGroupKhmer): AlphabetGroupKhmer_Lengths => ({
  subGroups_consonant: Map_mapValues(g.subGroups_consonant, (_k, v) => v.length),
  subGroups_vowel: Map_mapValues(g.subGroups_vowel, (_k, v) => v.length),
  subGroups_independent_vowel: Map_mapValues(g.subGroups_independent_vowel, (_k, v) => v.length),
  subGroups_diacritic: Map_mapValues(g.subGroups_diacritic, (_k, v) => v.length),

  subGroups_extraConsonant: Map_mapValues(g.subGroups_extraConsonant, (_k, v) => v.length),
  subGroups_vowelCombination: Map_mapValues(g.subGroups_vowelCombination, (_k, v) => v.length),

  subGroups_noSecondChar: g.subGroups_noSecondChar?.length ?? 0,
})

const mkWordGroupLengths = <K>(m: Map<K, AlphabetGroupKhmer>): Map<K, AlphabetGroupKhmer_Lengths> =>
  Map_mapValues(m, (_k, v) => mkAlphabetGroupLengths(v))

export function makeShortInfoAboutLengths(p: ProcessDataOutputKhmer): ProcessDataOutputKhmer_Lengths {
  return {
    words_consonant: mkWordGroupLengths(p.words_consonant),
    words_vowel: mkWordGroupLengths(p.words_vowel),
    words_independent_vowel: mkWordGroupLengths(p.words_independent_vowel),
    words_diacritic: mkWordGroupLengths(p.words_diacritic),

    numbers: p.numbers?.length ?? 0,
    punctuation: p.punctuation?.length ?? 0,
    lunarDates: p.lunarDates?.length ?? 0,
    others_known: p.others_known?.length ?? 0,
  }
}
