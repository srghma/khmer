import { Array_eq } from './array'
import { CharArray_mkFromString, Char_mkOrThrow, type Char, Char_eq } from './char'

export type Series = 'a' | 'o'

export type CharKhmerConsonant = Char & { __brandCharKhmerConsonant: 'CharKhmerConsonant' }
export const unsafe_char_toCharKhmerConsonant = (c: Char) => c as CharKhmerConsonant

export interface ConsonantDef {
  readonly letter: CharKhmerConsonant
  readonly trans: string
  readonly series: Series
  readonly ipa: string
}

export const CONSONANTS: ConsonantDef[] = (
  [
    { letter: 'ក', ipa: 'kɑː', trans: 'ка', series: 'a' },
    { letter: 'ខ', ipa: 'kʰɑː', trans: 'кха', series: 'a' },
    { letter: 'គ', ipa: 'kɔː', trans: 'ко', series: 'o' },
    { letter: 'ឃ', ipa: 'kʰɔː', trans: 'кхо', series: 'o' },
    { letter: 'ង', ipa: 'ŋɔː', trans: 'нго', series: 'o' },

    { letter: 'ច', ipa: 'cɑː', trans: 'тя', series: 'a' },
    { letter: 'ឆ', ipa: 'cʰɑː', trans: 'ча', series: 'a' },
    { letter: 'ជ', ipa: 'cɔː', trans: 'тё', series: 'o' },
    { letter: 'ឈ', ipa: 'cʰɔː', trans: 'чо', series: 'o' },
    { letter: 'ញ', ipa: 'ɲɔː', trans: 'нё', series: 'o' },

    { letter: 'ដ', ipa: 'ɗɑː', trans: '.да', series: 'a' },
    { letter: 'ឋ', ipa: 'tʰɑː', trans: '.тха', series: 'a' },
    { letter: 'ឌ', ipa: 'ɗɔː', trans: '.до', series: 'o' },
    { letter: 'ឍ', ipa: 'tʰɔː', trans: '.тхо', series: 'o' },
    { letter: 'ណ', ipa: 'nɑː', trans: '.на', series: 'a' },

    { letter: 'ត', ipa: 'tɑː', trans: 'та', series: 'a' },
    { letter: 'ថ', ipa: 'tʰɑː', trans: 'тха', series: 'a' },
    { letter: 'ទ', ipa: 'tɔː', trans: 'то', series: 'o' },
    { letter: 'ធ', ipa: 'tʰɔː', trans: 'тхо', series: 'o' },
    { letter: 'ន', ipa: 'nɔː', trans: 'но', series: 'o' },

    { letter: 'ប', ipa: 'ɓɑː', trans: 'ба', series: 'a' },
    { letter: 'ផ', ipa: 'pʰɑː', trans: 'пха', series: 'a' },
    { letter: 'ព', ipa: 'pɔː', trans: 'по', series: 'o' },
    { letter: 'ភ', ipa: 'pʰɔː', trans: 'пхо', series: 'o' },
    { letter: 'ម', ipa: 'mɔː', trans: 'мо', series: 'o' },

    { letter: 'យ', ipa: 'jɔː', trans: 'йо', series: 'o' },
    { letter: 'រ', ipa: 'rɔː', trans: 'ро', series: 'o' },
    { letter: 'ល', ipa: 'lɔː', trans: 'ло', series: 'o' },
    { letter: 'វ', ipa: 'ʋɔː', trans: 'во', series: 'o' },

    // Old letters: no IPA in the table (they were described)
    // If needed, I can add reconstructions.
    // For now skipping ḻ / ṣ retroflex ones.

    { letter: 'ស', ipa: 'sɑː', trans: 'са', series: 'a' },
    { letter: 'ហ', ipa: 'hɑː', trans: 'ха', series: 'a' },
    { letter: 'ឡ', ipa: 'lɑː', trans: 'ла', series: 'a' },
    // { letter: 'អ', ipa: 'ʔɑː', trans: 'а', series: 'a' },
  ] as const
).map(x => ({ ...x, letter: unsafe_char_toCharKhmerConsonant(Char_mkOrThrow(x.letter)) }))

export const allCharKhmerConsonants: ReadonlySet<CharKhmerConsonant> = new Set(CONSONANTS.map(c => c.letter))

export const isCharKhmerConsonant = (c: Char): c is CharKhmerConsonant =>
  allCharKhmerConsonants.has(c as CharKhmerConsonant)

////////////////////////////////////
export type CharKhmerExtraConsonant = (
  | readonly [Char, Char]
  | readonly [Char, Char, Char]
  | readonly [Char, Char, Char, Char]
) & {
  __brandKhmerExtraConsonant: 'CharKhmerExtraConsonant'
}
export const unsafe_char_toCharKhmerExtraConsonant = (c: readonly Char[]) => {
  if (c.length !== 2 && c.length !== 3 && c.length !== 4)
    throw new Error(`array should be 1 or 2 or 3, but c.length=${c.length}   ${c.join('  ')}`)
  return c as CharKhmerExtraConsonant
}

export interface ExtraConsonantDef {
  readonly letters: CharKhmerExtraConsonant
  readonly desc: string
  readonly trans: string
  readonly series: Series
  readonly ipa: string
}

export const EXTRA_CONSONANTS: ExtraConsonantDef[] = (
  [
    { letters: 'ហ្គ', desc: 'ха + ко', trans: 'га', series: 'a', ipa: 'ɡɑː' },
    {
      letters: 'ហ្គ៊',
      desc: 'ха + ко + трейсап',
      trans: 'го',
      series: 'o',
      ipa: 'ɡɔː',
    },
    { letters: 'ហ្ន', desc: 'ха + но', trans: 'на', series: 'a', ipa: 'nɑː' },
    {
      letters: 'ប៉',
      desc: 'ба + тмень-кандоль',
      trans: 'па',
      series: 'a',
      ipa: 'pɑː',
    },
    { letters: 'ហ្ម', desc: 'ха + мо', trans: 'ма', series: 'a', ipa: 'mɑː' },
    { letters: 'ហ្ល', desc: 'ха + ло', trans: 'ла', series: 'a', ipa: 'lɑː' },
    { letters: 'ហ្វ', desc: 'ха + во', trans: 'фа', series: 'a', ipa: 'fɑː' },
    {
      letters: 'ហ្វ៊',
      desc: 'ха + во + трейсап',
      trans: 'фо',
      series: 'o',
      ipa: 'fɔː',
    },
    {
      letters: 'ហ្ស',
      desc: 'ха + са',
      trans: 'жа, за',
      series: 'a',
      ipa: 'ʒɑː, zɑː',
    },
    {
      letters: 'ហ្ស៊',
      desc: 'ха + са + трейсап',
      trans: 'жо, зо',
      series: 'o',
      ipa: 'ʒɔː, zɔː',
    },
  ] as const
)
  .map(x => ({ ...x, letters: unsafe_char_toCharKhmerExtraConsonant(CharArray_mkFromString(x.letters)) }))
  .sort((a, b) => b.letters.length - a.letters.length)

export const allCharKhmerExtraConsonants: readonly CharKhmerExtraConsonant[] = EXTRA_CONSONANTS.map(x => x.letters)

export const isCharKhmerExtraConsonants = (cs: readonly Char[]): cs is CharKhmerExtraConsonant =>
  allCharKhmerExtraConsonants.some((combArray: CharKhmerExtraConsonant) => Array_eq(Char_eq, cs, combArray))

///////////////////////////////////////
export type CharKhmerVowel = Char & { __brandCharKhmerVowel: 'CharKhmerVowel' }
const unsafe_char_toCharKhmerVowel = (c: Char) => c as CharKhmerVowel

export interface VowelDef {
  readonly letter: CharKhmerVowel
  readonly trans_a: string
  readonly trans_o: string
  readonly ipa_a: string
  readonly ipa_o: string
}

export const VOWELS: VowelDef[] = (
  [
    { letter: 'អ', trans_a: 'а', trans_o: 'о', ipa_a: 'ɑː', ipa_o: 'ɔː' },
    { letter: 'ា', trans_a: 'а', trans_o: 'еа', ipa_a: 'aː', ipa_o: 'iːə' },
    { letter: 'ិ', trans_a: 'е', trans_o: 'и', ipa_a: 'ə, e', ipa_o: 'ɨ, i' },
    { letter: 'ី', trans_a: 'эй', trans_o: 'и', ipa_a: 'əj', ipa_o: 'iː' },
    { letter: 'ឹ', trans_a: 'э', trans_o: 'ы', ipa_a: 'ə', ipa_o: 'ɨ' },
    { letter: 'ឺ', trans_a: 'э', trans_o: 'ы', ipa_a: 'əɨ', ipa_o: 'ɨː' },
    { letter: 'ុ', trans_a: 'о', trans_o: 'у', ipa_a: 'o', ipa_o: 'u' },
    { letter: 'ូ', trans_a: 'оу', trans_o: 'у', ipa_a: 'ou', ipa_o: 'uː' },
    { letter: 'ួ', trans_a: 'уо', trans_o: 'уо', ipa_a: 'uə', ipa_o: 'uə' },
    { letter: 'ើ', trans_a: 'аэ', trans_o: 'э', ipa_a: 'aə', ipa_o: 'əː' },
    { letter: 'ឿ', trans_a: 'ыа', trans_o: 'ыа', ipa_a: 'ɨə', ipa_o: 'ɨə' },
    { letter: 'ៀ', trans_a: 'ие', trans_o: 'ие', ipa_a: 'iə', ipa_o: 'iə' },
    { letter: 'េ', trans_a: 'е', trans_o: 'е', ipa_a: 'ei', ipa_o: 'eː' },
    { letter: 'ែ', trans_a: 'ае', trans_o: 'э', ipa_a: 'ae', ipa_o: 'ɛː' },
    { letter: 'ៃ', trans_a: 'ай', trans_o: 'ей', ipa_a: 'aj', ipa_o: 'ɨj' },
    { letter: 'ោ', trans_a: 'ао', trans_o: 'оу', ipa_a: 'ao', ipa_o: 'oː' },
    { letter: 'ៅ', trans_a: 'ау', trans_o: 'эу', ipa_a: 'aw', ipa_o: 'ɨw' },
  ] as const
).map(x => ({ ...x, letter: unsafe_char_toCharKhmerVowel(Char_mkOrThrow(x.letter)) }))

export const allCharKhmerVowels: ReadonlySet<CharKhmerVowel> = new Set(VOWELS.map(v => v.letter))
export const isCharKhmerVowel = (c: Char): c is CharKhmerVowel => allCharKhmerVowels.has(c as CharKhmerVowel)

///////////////////////////////////////

export type CharKhmerVowelCombination = (readonly [Char] | readonly [Char, Char]) & {
  __brandCharKhmerVowelCombination: 'CharKhmerVowelCombination'
}

export const unsafe_char_toCharKhmerVowelCombination = (c: readonly Char[]) => {
  if (c.length !== 1 && c.length !== 2)
    throw new Error(`array should be 1 or 2, but c.length=${c.length}   ${c.join('  ')}`)
  return c as CharKhmerVowelCombination
}

export interface VowelCombinationDef {
  readonly letters: CharKhmerVowelCombination
  readonly trans_a: string
  readonly trans_o: string
  readonly ipa_a: string
  readonly ipa_o: string
}

export const VOWEL_COMBINATIONS: VowelCombinationDef[] = (
  [
    {
      letters: ['ុ', 'ំ'],
      trans_a: 'ом',
      trans_o: 'ум',
      ipa_a: 'om',
      ipa_o: 'um',
    },
    { letters: ['ំ'], trans_a: 'ам', trans_o: 'ум', ipa_a: 'ɑm', ipa_o: 'um' },
    {
      letters: ['ា', 'ំ'],
      trans_a: 'ам',
      trans_o: 'оам',
      ipa_a: 'am',
      ipa_o: 'ŏəm',
    },
    {
      letters: ['ះ'],
      trans_a: 'ах',
      trans_o: 'эах',
      ipa_a: 'ah',
      ipa_o: 'ĕəh',
    },
    {
      letters: ['ិ', 'ះ'],
      trans_a: 'ех',
      trans_o: 'их',
      ipa_a: 'eh',
      ipa_o: 'ih',
    },
    {
      letters: ['ុ', 'ះ'],
      trans_a: 'ох',
      trans_o: 'ух',
      ipa_a: 'oh',
      ipa_o: 'uh',
    },
    {
      letters: ['េ', 'ះ'],
      trans_a: 'эх',
      trans_o: 'их',
      ipa_a: 'eh',
      ipa_o: 'ih',
    },
    {
      letters: ['ោ', 'ះ'],
      trans_a: 'аох',
      trans_o: 'уох',
      ipa_a: 'ɑh',
      ipa_o: 'ŭəh',
    },
  ] as const
)
  .map(x => ({
    ...x,
    letters: unsafe_char_toCharKhmerVowelCombination(x.letters.map(Char_mkOrThrow)),
  }))
  .sort((a, b) => b.letters.length - a.letters.length)

export const allCharKhmerVowelCombinations: readonly CharKhmerVowelCombination[] = VOWEL_COMBINATIONS.map(
  ec => ec.letters,
)

export const isCharKhmerVowelCombination = (cs: readonly Char[]): cs is CharKhmerVowelCombination =>
  allCharKhmerVowelCombinations.some((combArray: CharKhmerVowelCombination) => Array_eq(Char_eq, cs, combArray))

///////////////////////////////////////

export type CharKhmerIndependentVowel = Char & {
  __brandCharKhmerIndependentVowel: 'CharKhmerIndependentVowel'
}

export const unsafe_char_toCharKhmerIndependentVowel = (c: Char) => {
  if (c.length !== 1) throw new Error(`array should be 1 or 2 , but c.length=${c.length}   ${c}`)
  return c as CharKhmerIndependentVowel
}

export interface IndependentVowelDef {
  readonly letters: CharKhmerIndependentVowel
  readonly trans: string
  // readonly ungegn?: string
  readonly ipa: string
  readonly desc: string
}

export const INDEPENDENT_VOWELS: IndependentVowelDef[] = (
  [
    {
      letters: 'ឣ',
      trans: 'а',
      ipa: 'ʔɑʔ',
      desc: 'Independent â',
    },
    {
      letters: 'ឤ',
      trans: 'а',
      ipa: 'ʔa',
      desc: 'Independent a',
    },
    {
      letters: 'ឥ',
      trans: 'э, и',
      ipa: 'ʔə, ʔɨ, ʔəj',
      desc: 'Independent e',
    },
    {
      letters: 'ឦ',
      trans: 'эй',
      ipa: 'ʔəj',
      desc: 'Independent ei',
    },
    {
      letters: 'ឧ',
      trans: 'о, у, ао',
      ipa: 'ʔo, ʔu, ʔao',
      desc: 'Independent o',
    },
    {
      letters: 'ឩ',
      trans: 'оу, у',
      ipa: 'ʔou, ʔuː',
      desc: 'Independent u',
    },
    {
      letters: 'ឪ',
      trans: 'ау',
      ipa: 'ʔəw',
      desc: 'Independent au',
    },
    {
      letters: 'ឫ',
      trans: 'ры',
      ipa: 'rɨ',
      desc: 'Independent roe',
    },
    {
      letters: 'ឬ',
      trans: 'ры',
      ipa: 'rɨː',
      desc: 'Independent rueu',
    },
    {
      letters: 'ឭ',
      trans: 'лы',
      ipa: 'lɨ',
      desc: 'Independent loe',
    },
    {
      letters: 'ឮ',
      trans: 'лы',
      ipa: 'lɨː',
      desc: 'Independent lueu',
    },
    {
      letters: 'ឯ',
      trans: 'аэ, э',
      ipa: 'ʔae, ʔɛː, ʔeː',
      desc: 'Independent ae',
    },
    {
      letters: 'ឰ',
      trans: 'ай',
      ipa: 'ʔaj',
      desc: 'Independent ai',
    },
    {
      letters: 'ឱ',
      trans: 'ао',
      ipa: 'ʔao',
      desc: 'Independent ao',
    },
    {
      letters: 'ឲ',
      trans: 'ао',
      ipa: 'ʔao',
      desc: 'Independent ao (variant)',
    },
    {
      letters: 'ឳ',
      trans: 'ау',
      ipa: 'ʔaw',
      desc: 'Independent au (obsolete/variant)',
    },
  ] as const
).map(x => ({ ...x, letters: unsafe_char_toCharKhmerIndependentVowel(Char_mkOrThrow(x.letters)) }))

export const charKhmerIndependentVowelSet: ReadonlySet<CharKhmerIndependentVowel> = new Set(
  INDEPENDENT_VOWELS.flatMap(iv => iv.letters),
)

export const isCharKhmerIndependentVowel = (c: Char): c is CharKhmerIndependentVowel =>
  charKhmerIndependentVowelSet.has(c as CharKhmerIndependentVowel)

///////////////////////////////////////

export type CharKhmerDiacritic = Char & { __brandCharKhmerDiacritic: 'CharKhmerDiacritic' }
export const unsafe_char_toCharKhmerDiacritic = (c: Char) => c as CharKhmerDiacritic

export interface DiacriticDef {
  readonly symbol: CharKhmerDiacritic
  readonly name: string
  readonly desc: string
  readonly desc_en: string
}

export const DIACRITICS: DiacriticDef[] = (
  [
    {
      symbol: 'ំ',
      name: 'និគ្គហិត (nĭkkôhĕt)',
      desc: 'Назализует гласный (niggahīta), добавляет [m]; сокращает долгие гласные.',
      desc_en:
        'The Pali niggahīta, related to the anusvara. A small circle written over a consonant or a following dependent vowel, it nasalizes the inherent or dependent vowel, with the addition of [m]; long vowels are also shortened.',
    },
    {
      symbol: 'ះ',
      name: 'រះមុខ (reăhmŭkh)',
      desc: 'Добавляет придыхание /h/ (visarga) к гласному.',
      desc_en:
        'Related to the visarga. A pair of small circles written after a consonant or a following dependent vowel, it modifies and adds final aspiration /h/ to the inherent or dependent vowel.',
    },
    {
      symbol: 'ៈ',
      name: 'យុគលពិន្ទុ (yŭkoălpĭntŭ)',
      desc: 'Добавляет глоттализацию; указывает на то, что за согласным следует краткий гласный и гортанная смычка.',
      desc_en:
        'A "pair of dots", a fairly recently introduced diacritic, written after a consonant to indicate that it is to be followed by a short vowel and a glottal stop.',
    },
    {
      symbol: '៉',
      name: 'មូសិកទន្ត (musĕkâtônd)',
      desc: '«Мышиные зубы». Преобразует согласные группы «o» (ង ញ ម យ រ វ) в группу «a». С буквой ប преобразует её в /p/.',
      desc_en:
        'Two short vertical lines, written above a consonant, used to convert some o-series consonants (ង ញ ម យ រ វ) to a-series. It is also used with ប (bâ) to convert it to a p sound.',
    },
    {
      symbol: '៊',
      name: 'ត្រីស័ព្ទ (treisăpt)',
      desc: 'Преобразует согласные группы «a» (ស ហ ប អ) в группу «o».',
      desc_en:
        'A wavy line, written above a consonant, used to convert some a-series consonants (ស ហ ប អ) to o-series.',
    },
    {
      symbol: 'ុ',
      name: 'ក្បៀសក្រោម (kbiĕs kraôm)',
      desc: 'Используется вместо treisăpt/musĕkâtônd, если они пересекаются с надписным знаком гласной (например, в ម៉ុ).',
      desc_en:
        'Also known as បុកជើង (bŏk cheung, "collision foot"); a vertical line written under a consonant, used in place of the diacritics treisăpt and musĕkâtônd when they would be impeded by superscript vowels.',
    },
    {
      symbol: '់',
      name: 'បន្តក់ (bânták)',
      desc: 'Сокращает гласный звук в слоге (изменяет качество звука).',
      desc_en:
        'A small vertical line written over the last consonant of a syllable, indicating shortening (and corresponding change in quality) of certain vowels.',
    },
    {
      symbol: '៌',
      name: 'របាទ (rôbat) / រេផៈ (réphă)',
      desc: 'Обозначает звук «r» в словах из санскрита (Repha). В современном языке буква под ним (и сам знак) обычно не произносится.',
      desc_en:
        'This superscript diacritic occurs in Sanskrit loanwords and corresponds to the Devanagari diacritic repha. It originally represented an r sound. Now, in most cases, the consonant above which it appears, and the diacritic itself, are unpronounced.',
    },
    {
      symbol: '៍',
      name: 'ទណ្ឌឃាដ (tôndôkhéad)',
      desc: 'Ставится над конечной согласной, чтобы указать, что она не произносится (немая буква).',
      desc_en:
        'Written over a final consonant to indicate that it is unpronounced. (Such unpronounced letters are still romanized in the UNGEGN system.)',
    },
    {
      symbol: '៎',
      name: 'កាកបាទ (kakâbat)',
      desc: '«Воронья лапка». Указывает на повышение интонации при восклицании (часто на частицах).',
      desc_en:
        'Also known as a "crow\'s foot", used in writing to indicate the rising intonation of an exclamation or interjection; often placed on particles.',
    },
    {
      symbol: '័',
      name: 'សំយោគសញ្ញា (sâmyoŭk sânhnhéa)',
      desc: 'Обозначает краткий гласный в словах из санскрита и пали.',
      desc_en:
        'Used in some Sanskrit and Pali loanwords (although alternative spellings usually exist); it is written above a consonant to indicate that the syllable contains a particular short vowel.',
    },
    {
      symbol: '៏',
      name: 'អស្តា (âsda)',
      desc: '«Цифра 8». Указывает, что согласный без гласного знака произносится с присущим гласным, а не как конечный.',
      desc_en:
        'Used in a few words to show that a consonant with no dependent vowel is to be pronounced with its inherent vowel, rather than as a final consonant.',
    },
    {
      symbol: '៑',
      name: 'វិរាម (vĭréam)',
      desc: 'Вирама (устаревший). Отменяет присущий гласный.',
      desc_en:
        "A mostly obsolete diacritic, corresponding to the virāma, which suppresses a consonant's inherent vowel.",
    },
    {
      symbol: '្',
      name: 'ជើង (cheung)',
      desc: 'Знак (Coeng) для создания подписных согласных (в Юникоде вводится перед согласной, чтобы сделать её подписной).',
      desc_en: 'The sign (coeng) used to indicate that the following consonant is a subscript (dependent) consonant.',
    },
  ] as const
).map(x => ({ ...x, symbol: unsafe_char_toCharKhmerDiacritic(Char_mkOrThrow(x.symbol)) }))

export const charKhmerDiacriticSet: ReadonlySet<CharKhmerDiacritic> = new Set(DIACRITICS.map(d => d.symbol))

export const isCharKhmerDiacritic = (c: Char): c is CharKhmerDiacritic =>
  charKhmerDiacriticSet.has(c as CharKhmerDiacritic)

//////////////////////

export type CharKhmerNumber = Char & { __brandCharKhmerNumber: 'CharKhmerNumber' }
export const unsafe_char_toCharKhmerNumber = (c: Char) => c as CharKhmerNumber

export interface NumberDef {
  readonly digit: CharKhmerNumber
  readonly value: number
}

export const NUMBERS: NumberDef[] = (
  [
    { digit: '០', value: 0 },
    { digit: '១', value: 1 },
    { digit: '២', value: 2 },
    { digit: '៣', value: 3 },
    { digit: '៤', value: 4 },
    { digit: '៥', value: 5 },
    { digit: '៦', value: 6 },
    { digit: '៧', value: 7 },
    { digit: '៨', value: 8 },
    { digit: '៩', value: 9 },
  ] as const
).map(x => ({ ...x, digit: unsafe_char_toCharKhmerNumber(Char_mkOrThrow(x.digit)) }))

export const charKhmerNumberSet: ReadonlySet<CharKhmerNumber> = new Set(NUMBERS.map(x => x.digit))

export const isCharKhmerNumber = (c: Char): c is CharKhmerNumber => charKhmerNumberSet.has(c as CharKhmerNumber)

//////////////////////

export type CharKhmerPunctuation = Char & { __brandCharKhmerPunctuation: 'CharKhmerPunctuation' }
export const unsafe_char_toCharKhmerPunctuation = (c: Char) => c as CharKhmerPunctuation

export interface PunctuationDef {
  readonly symbol: CharKhmerPunctuation
  readonly name: string
  readonly desc: string
}

export const PUNCTUATIONS: PunctuationDef[] = (
  [
    {
      symbol: '។',
      name: 'ខណ្ឌ (khând)',
      desc: 'Used as a period (the sign resembles an eighth rest in music writing). However, consecutive sentences on the same theme are often separated only by spaces.',
    },
    {
      symbol: '៘',
      name: 'ល៉ៈ (lăk)',
      desc: 'Equivalent to etc.',
    },
    {
      symbol: 'ៗ',
      name: 'លេខទោ (lékh toŭ)',
      desc: 'Duplication sign (similar in form to the Khmer numeral for 2). It indicates that the preceding word or phrase is to be repeated (duplicated), a common feature in Khmer syntax.',
    },
    {
      symbol: '៕',
      name: 'បរិយោសាន (bârĭyoŭsan)',
      desc: 'A period used to end an entire text or a chapter.',
    },
    {
      symbol: '៚',
      name: 'គោមូត្រ (koŭmutr)',
      desc: 'A period used at the end of poetic or religious texts.',
    },
    {
      symbol: '៙',
      name: 'ភ្នែកមាន់ (phnêk moăn)',
      desc: 'A symbol (said to represent the elephant trunk of Ganesha) used at the start of poetic or religious texts.',
    },
    {
      symbol: '៖',
      name: 'ចំណុចពីរគូស (châmnŏch pir kus)',
      desc: 'Used similarly to a colon. (The middle line distinguishes this sign from a diacritic.)',
    },
  ] as const
).map(x => ({ ...x, symbol: unsafe_char_toCharKhmerPunctuation(Char_mkOrThrow(x.symbol)) }))

export const charKhmerPunctuationSet: ReadonlySet<CharKhmerPunctuation> = new Set(PUNCTUATIONS.map(p => p.symbol))

export const isCharKhmerPunctuation = (c: Char): c is CharKhmerPunctuation =>
  charKhmerPunctuationSet.has(c as CharKhmerPunctuation)

//////////////////////

export type CharKhmerLunarDateSymbol = Char & { __brandCharKhmerSymbol: 'CharKhmerSymbol' }
export const unsafe_char_toCharKhmerLunarDateSymbol = (c: Char) => c as CharKhmerLunarDateSymbol

export interface LunarDateSymbolDef {
  readonly symbol: CharKhmerLunarDateSymbol
  readonly name: string
  readonly desc: string
}

export const KHMER_LUNAR_DATE_SYMBOLS: LunarDateSymbolDef[] = (
  [
    { symbol: '᧠', name: 'Pathamasat', desc: 'Khmer Symbol Pathamasat' },
    { symbol: '᧡', name: 'Muoy Koet', desc: 'Khmer Symbol Muoy Koet' },
    { symbol: '᧢', name: 'Pii Koet', desc: 'Khmer Symbol Pii Koet' },
    { symbol: '᧣', name: 'Bei Koet', desc: 'Khmer Symbol Bei Koet' },
    { symbol: '᧤', name: 'Buon Koet', desc: 'Khmer Symbol Buon Koet' },
    { symbol: '᧥', name: 'Pram Koet', desc: 'Khmer Symbol Pram Koet' },
    { symbol: '᧦', name: 'Pram-Muoy Koet', desc: 'Khmer Symbol Pram-Muoy Koet' },
    { symbol: '᧧', name: 'Pram-Pii Koet', desc: 'Khmer Symbol Pram-Pii Koet' },
    { symbol: '᧨', name: 'Pram-Bei Koet', desc: 'Khmer Symbol Pram-Bei Koet' },
    { symbol: '᧩', name: 'Pram-Buon Koet', desc: 'Khmer Symbol Pram-Buon Koet' },
    { symbol: '᧪', name: 'Dap Koet', desc: 'Khmer Symbol Dap Koet' },
    { symbol: '᧫', name: 'Dap-Muoy Koet', desc: 'Khmer Symbol Dap-Muoy Koet' },
    { symbol: '᧬', name: 'Dap-Pii Koet', desc: 'Khmer Symbol Dap-Pii Koet' },
    { symbol: '᧭', name: 'Dap-Bei Koet', desc: 'Khmer Symbol Dap-Bei Koet' },
    { symbol: '᧮', name: 'Dap-Buon Koet', desc: 'Khmer Symbol Dap-Buon Koet' },
    { symbol: '᧯', name: 'Dap-Pram Koet', desc: 'Khmer Symbol Dap-Pram Koet' },
    { symbol: '᧰', name: 'Tuteyasat', desc: 'Khmer Symbol Tuteyasat' },
    { symbol: '᧱', name: 'Muoy Roc', desc: 'Khmer Symbol Muoy Roc' },
    { symbol: '᧲', name: 'Pii Roc', desc: 'Khmer Symbol Pii Roc' },
    { symbol: '᧳', name: 'Bei Roc', desc: 'Khmer Symbol Bei Roc' },
    { symbol: '᧴', name: 'Buon Roc', desc: 'Khmer Symbol Buon Roc' },
    { symbol: '᧵', name: 'Pram Roc', desc: 'Khmer Symbol Pram Roc' },
    { symbol: '᧶', name: 'Pram-Muoy Roc', desc: 'Khmer Symbol Pram-Muoy Roc' },
    { symbol: '᧷', name: 'Pram-Pii Roc', desc: 'Khmer Symbol Pram-Pii Roc' },
    { symbol: '᧸', name: 'Pram-Bei Roc', desc: 'Khmer Symbol Pram-Bei Roc' },
    { symbol: '᧹', name: 'Pram-Buon Roc', desc: 'Khmer Symbol Pram-Buon Roc' },
    { symbol: '᧺', name: 'Dap Roc', desc: 'Khmer Symbol Dap Roc' },
    { symbol: '᧻', name: 'Dap-Muoy Roc', desc: 'Khmer Symbol Dap-Muoy Roc' },
    { symbol: '᧼', name: 'Dap-Pii Roc', desc: 'Khmer Symbol Dap-Pii Roc' },
    { symbol: '᧽', name: 'Dap-Bei Roc', desc: 'Khmer Symbol Dap-Bei Roc' },
    { symbol: '᧾', name: 'Dap-Buon Roc', desc: 'Khmer Symbol Dap-Buon Roc' },
    { symbol: '᧿', name: 'Dap-Pram Roc', desc: 'Khmer Symbol Dap-Pram Roc' },
  ] as const
).map(x => ({ ...x, symbol: unsafe_char_toCharKhmerLunarDateSymbol(Char_mkOrThrow(x.symbol)) }))

export const allCharKhmerLunarDateSymbolSet: ReadonlySet<CharKhmerLunarDateSymbol> = new Set(
  KHMER_LUNAR_DATE_SYMBOLS.map(x => x.symbol),
)

export const isCharKhmerLunarDateSymbol = (c: Char): c is CharKhmerLunarDateSymbol =>
  allCharKhmerLunarDateSymbolSet.has(c as CharKhmerLunarDateSymbol)
