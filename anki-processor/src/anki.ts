export function assertNever(x: never): never {
  throw new Error('Unexpected object: ' + JSON.stringify(x))
}
// ==========================================
// 1. TYPE DEFINITIONS
// ==========================================

export type Char = string & { __brandChar: 'Char' }

export function Char_mkOrThrow(s: string): Char {
  // Use Array.from to handle surrogate pairs correctly
  const l = Array.from(s).length
  if (l !== 1) throw new Error(`Expected single character, got length ${l}: "${s}"`)
  return s as Char
}

export function Char_mkArray(s: string): readonly Char[] {
  return Array.from(s) as Char[]
}

// ==========================================
// 1. TYPE DEFINITIONS
// ==========================================

type Series = 'a' | 'o'

interface ConsonantDef {
  readonly letter: Char
  readonly trans: string
  readonly series: Series
  readonly ipa: string
}

interface ExtraConsonantDef {
  readonly letters: readonly Char[]
  readonly desc: string
  readonly trans: string
  readonly series: Series
  readonly ipa: string
}

interface VowelDef {
  readonly letter: Char
  readonly trans_a: string
  readonly trans_o: string
  readonly ipa_a: string
  readonly ipa_o: string
}

interface VowelCombinationDef {
  readonly letters: readonly Char[]
  readonly trans_a: string
  readonly trans_o: string
  readonly ipa_a: string
  readonly ipa_o: string
}

interface IndependentVowelDef {
  readonly letters: readonly Char[]
  readonly trans: string
  // readonly ungegn?: string
  readonly ipa: string
  readonly desc: string
}

interface DiacriticDef {
  readonly symbol: Char
  readonly name: string
  readonly desc: string
  readonly desc_en: string
}

// ==========================================
// 2. DATA DEFINITIONS
// ==========================================

const CONSONANTS: ConsonantDef[] = (
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
    { letter: 'អ', ipa: 'ʔɑː', trans: 'а', series: 'a' },
  ] as const
).map(x => ({ ...x, letter: Char_mkOrThrow(x.letter) }))

const EXTRA_CONSONANTS: ExtraConsonantDef[] = (
  [
    { letters: 'ហ្គ', desc: 'ха + ко', trans: 'га', series: 'a', ipa: 'ɡɑː' },
    { letters: 'ហ្គ៊', desc: 'ха + ко + трейсап', trans: 'го', series: 'o', ipa: 'ɡɔː' },
    { letters: 'ហ្ន', desc: 'ха + но', trans: 'на', series: 'a', ipa: 'nɑː' },
    { letters: 'ប៉', desc: 'ба + тмень-кандоль', trans: 'па', series: 'a', ipa: 'pɑː' },
    { letters: 'ហ្ម', desc: 'ха + мо', trans: 'ма', series: 'a', ipa: 'mɑː' },
    { letters: 'ហ្ល', desc: 'ха + ло', trans: 'ла', series: 'a', ipa: 'lɑː' },
    { letters: 'ហ្វ', desc: 'ха + во', trans: 'фа', series: 'a', ipa: 'fɑː' },
    { letters: 'ហ្វ៊', desc: 'ха + во + трейсап', trans: 'фо', series: 'o', ipa: 'fɔː' },
    { letters: 'ហ្ស', desc: 'ха + са', trans: 'жа, за', series: 'a', ipa: 'ʒɑː, zɑː' },
    {
      letters: 'ហ្ស៊',
      desc: 'ха + са + трейсап',
      trans: 'жо, зо',
      series: 'o',
      ipa: 'ʒɔː, zɔː',
    },
  ] as const
)
  .map(x => ({ ...x, letters: Char_mkArray(x.letters) }))
  .sort((a, b) => b.letters.length - a.letters.length)

const VOWELS: VowelDef[] = (
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
).map(x => ({ ...x, letter: Char_mkOrThrow(x.letter) }))

const VOWEL_COMBINATIONS: VowelCombinationDef[] = (
  [
    { letters: ['ុ', 'ំ'], trans_a: 'ом', trans_o: 'ум', ipa_a: 'om', ipa_o: 'um' },
    { letters: ['ំ'], trans_a: 'ам', trans_o: 'ум', ipa_a: 'ɑm', ipa_o: 'um' },
    { letters: ['ា', 'ំ'], trans_a: 'ам', trans_o: 'оам', ipa_a: 'am', ipa_o: 'ŏəm' },
    { letters: ['ះ'], trans_a: 'ах', trans_o: 'эах', ipa_a: 'ah', ipa_o: 'ĕəh' },
    { letters: ['ិ', 'ះ'], trans_a: 'ех', trans_o: 'их', ipa_a: 'eh', ipa_o: 'ih' },
    { letters: ['ុ', 'ះ'], trans_a: 'ох', trans_o: 'ух', ipa_a: 'oh', ipa_o: 'uh' },
    { letters: ['េ', 'ះ'], trans_a: 'эх', trans_o: 'их', ipa_a: 'eh', ipa_o: 'ih' },
    { letters: ['ោ', 'ះ'], trans_a: 'аох', trans_o: 'уох', ipa_a: 'ɑh', ipa_o: 'ŭəh' },
  ] as const
)
  .map(x => ({ ...x, letters: x.letters.map(Char_mkOrThrow) }))
  .sort((a, b) => b.letters.length - a.letters.length)

const INDEPENDENT_VOWELS: IndependentVowelDef[] = (
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
).map(x => ({ ...x, letters: Char_mkArray(x.letters) }))

const DIACRITICS: DiacriticDef[] = (
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
).map(x => ({ ...x, symbol: Char_mkOrThrow(x.symbol) }))

// ==========================================
// 3. LOGIC & PARSING HELPERS
// ==========================================

export type ArrayMatchOutput<T> =
  | { readonly t: 'matched' }
  | { readonly t: 'not_matched'; readonly otherSentencePart: readonly T[] }

// Array_match([9,9], [1,9,9,9,4,5,6,7,8]) => [ { t: 'not_matched', otherSentencePart: [1] }, {t: 'matched' }, { t: 'not_matched', otherSentencePart: [9,4,5,6,7,8] } ]
// Array_match([9,9], [1,9,9,9,4,5,6,7,8,9,9]) => [ { t: 'not_matched', otherSentencePart: [1] }, {t: 'matched' }, { t: 'not_matched', otherSentencePart: [9,4,5,6,7,8] }, {t: 'matched' } ]
export function Array_match<T extends string | number>(
  word: readonly T[],
  sentence: readonly T[],
): ArrayMatchOutput<T>[] {
  const result: ArrayMatchOutput<T>[] = []
  let buffer: T[] = []
  let i = 0

  // Safety check: if word is empty, we can't really "match" it inside a sentence meaningfully
  // without creating infinite empty matches.
  if (word.length === 0) return [{ t: 'not_matched', otherSentencePart: sentence }]

  while (i < sentence.length) {
    // Check if the sequence starting at i matches 'word'
    let isMatch = true
    for (let j = 0; j < word.length; j++) {
      if (i + j >= sentence.length || sentence[i + j] !== word[j]) {
        isMatch = false
        break
      }
    }

    if (isMatch) {
      // 1. Flush any non-matched buffer
      if (buffer.length > 0) {
        result.push({ t: 'not_matched', otherSentencePart: [...buffer] })
        buffer = []
      }
      // 2. Add the matched token
      result.push({ t: 'matched' })
      // 3. Advance index
      i += word.length
    } else {
      // No match, accumulate current char
      const c = sentence[i]
      if (!c) throw new Error('no index')
      buffer.push(c)
      i++
    }
  }

  // Flush remaining buffer
  if (buffer.length > 0) {
    result.push({ t: 'not_matched', otherSentencePart: buffer })
  }

  return result
}

// ==========================================
// 2. HELPERS
// ==========================================

export type ArrayMatchManyOutput<T> =
  | { readonly t: 'matched'; readonly word: readonly T[] }
  | { readonly t: 'not_matched'; readonly otherSentencePart: readonly T[] }

export function Array_matchMany<T extends string | number>(
  words: readonly (readonly T[])[],
  sentence: readonly T[],
): ArrayMatchManyOutput<T>[] {
  // 1. Initialize with the entire sentence as a single unmatched segment
  const initialSegments: ArrayMatchManyOutput<T>[] = [{ t: 'not_matched', otherSentencePart: sentence }]

  // 2. Reduce over the list of words.
  //    For each word, we scan the current list of segments.
  //    If a segment is already 'matched', we leave it alone.
  //    If it is 'not_matched', we run Array_match on it to see if we can split it further.
  return words.reduce<ArrayMatchManyOutput<T>[]>((currentSegments, word) => {
    // Safety check for empty words to prevent infinite splitting
    if (word.length === 0) return currentSegments

    return currentSegments.flatMap(segment => {
      // A. If already matched, keep it
      if (segment.t === 'matched') {
        return [segment]
      }

      // B. If not matched, try to match the current 'word' against this segment
      const matchResults = Array_match(word, segment.otherSentencePart)

      // C. Transform the results:
      //    Array_match returns { t: 'matched' } (without data).
      //    We enrich this with the actual 'word' we are currently processing.
      return matchResults.map((res): ArrayMatchManyOutput<T> => {
        if (res.t === 'matched') {
          return { t: 'matched', word: word }
        } else {
          return {
            t: 'not_matched',
            otherSentencePart: res.otherSentencePart,
          }
        }
      })
    })
  }, initialSegments)
}

// ==========================================
// 3. LOGIC
// ==========================================

export type TokenType =
  | 'CONSONANT'
  | 'EXTRA_CONSONANT'
  | 'VOWEL'
  | 'VOWEL_COMBINATION'
  | 'INDEPENDENT_VOWEL'
  | 'DIACRITIC'
  | 'SPACE'
  | 'UNKNOWN'

export type Token = { t: TokenType; v: readonly Char[] }

// Internal intermediate state to track what has been tokenized and what is still raw text
type Segment = Token | { t: 'PENDING'; v: readonly Char[] }

// ['ស', '្', 'រ', '្', 'ត', 'ី'] =>
// first detect EXTRA_CONSONANTS (several consecutive chars)
// then VOWEL_COMBINATIONS (several consecutive chars)
// then CONSONANTS
// then VOWELS
export const tokenize = (text: readonly Char[]): readonly Token[] => {
  // 1. Initial State: The whole text is one PENDING segment
  let segments: Segment[] = [{ t: 'PENDING', v: text }]

  // 2. Helper to apply a dictionary to all PENDING segments
  const applyLayer = (patterns: readonly (readonly Char[])[], tokenType: TokenType) => {
    // We replace the current 'segments' list with a new list where
    // PENDING segments have been processed by Array_matchMany
    segments = segments.flatMap(seg => {
      // If already a finalized Token, keep it as is
      if (seg.t !== 'PENDING') {
        return [seg]
      }

      // If PENDING, try to match against the current patterns
      const matchResults = Array_matchMany(patterns, seg.v)

      // Map the match results back to Segments
      return matchResults.map((res): Segment => {
        if (res.t === 'matched') {
          // Found a match! Convert to specific Token type
          // We have to cast tokenType to 'any' or verify strict union matching,
          // but logically we know tokenType matches the Token union structure.
          return { t: tokenType, v: res.word } as const
        } else {
          // Still not matched, keep as PENDING for the next layer
          return { t: 'PENDING', v: res.otherSentencePart }
        }
      })
    })
  }

  // 1. Extra Consonants (Complex clusters involving diacritics)
  applyLayer(
    EXTRA_CONSONANTS.map(x => x.letters),
    'EXTRA_CONSONANT',
  )

  // 2. Independent Vowels
  applyLayer(
    INDEPENDENT_VOWELS.map(x => x.letters),
    'INDEPENDENT_VOWEL',
  )

  // 3. Vowel Combinations
  applyLayer(
    VOWEL_COMBINATIONS.map(x => x.letters),
    'VOWEL_COMBINATION',
  )

  // 4. Standard Consonants
  applyLayer(
    CONSONANTS.map(x => [x.letter]),
    'CONSONANT',
  )

  // 5. Standard Vowels
  applyLayer(
    VOWELS.map(x => [x.letter]),
    'VOWEL',
  )

  // 6. Diacritics
  applyLayer(
    DIACRITICS.map(x => [x.symbol]),
    'DIACRITIC',
  )

  return segments.flatMap((seg): Token[] => {
    // Already finalized tokens pass through
    if (seg.t !== 'PENDING') return [seg]

    // Process the remaining raw characters
    const results: Token[] = []
    for (const char of seg.v) {
      if (char === ' ') {
        results.push({ t: 'SPACE', v: [char] })
      } else {
        // Fallback for symbols, numbers, or characters not in our definitions
        results.push({ t: 'UNKNOWN', v: [char] })
      }
    }
    return results
  })
}

// ==========================================
// 4. TTS FUNCTIONALITY
// ==========================================

/**
 * Speaks the given text using the Web Speech API
 */
const speakText = async (text: string, api: AnkiDroidJS | undefined): Promise<void> => {
  const lang = 'km-KH'
  const rate = 0.8

  // 1️⃣ Try AnkiDroid TTS
  if (api && typeof api.ankiTtsSpeak === 'function') {
    try {
      await api.ankiTtsSetLanguage(lang)
      await api.ankiTtsSetSpeechRate(rate)
      await api.ankiTtsSpeak(text, 0) // 0 is QUEUE_FLUSH (queue dropped), 1 is QUEUE_ADD (waited)
      return // successful → stop here
    } catch (err) {
      console.warn('AnkiDroid TTS failed, falling back:', err)
    }
  }

  // 2️⃣ Fallback: Web Speech API
  if (!('speechSynthesis' in window)) {
    console.warn('No available TTS (AnkiDroid + WebSpeech both unavailable)')
    return
  }

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = rate
  window.speechSynthesis.speak(utterance)
}

const addTTSHandlers_whole = (elementId: string, api: AnkiDroidJS | undefined): void => {
  const element = document.getElementById(elementId)
  if (!element) return

  // Add TTS to main word/sentence element
  element.style.cursor = 'pointer'
  element.addEventListener('click', e => {
    e.preventDefault()
    const text = element.innerText.trim()
    if (text) speakText(text, api)
  })
}

/**
 * Adds click handlers to enable TTS on elements
 */
const addTTSHandlers = (elementId: string, elementToClick: string, api: AnkiDroidJS | undefined): void => {
  const element = document.getElementById(elementId)
  if (!element) return

  // Add TTS to individual token boxes (letters/components)
  const tokenBoxes = element.querySelectorAll(elementToClick)
  tokenBoxes.forEach(box => {
    ;(box as HTMLElement).style.cursor = 'pointer'
    box.addEventListener('click', e => {
      e.stopPropagation()
      const text = box.textContent?.trim()
      if (text) speakText(text, api)
    })
  })
}

// ==========================================
// 5. RENDERERS
// ==========================================

export type EnrichedToken = Token & { readonly series: Series }

export const enrichWithSeries = (tokens: readonly Token[]): readonly EnrichedToken[] => {
  return tokens.reduce<{
    currentSeries: Series
    tokens: readonly EnrichedToken[]
  }>(
    (acc, token) => {
      let newSeries = acc.currentSeries

      if (token.t === 'CONSONANT') {
        const def = CONSONANTS.find(c => c.letter === token.v[0])
        if (def) newSeries = def.series
      } else if (token.t === 'EXTRA_CONSONANT') {
        const def = EXTRA_CONSONANTS.find(
          ec => ec.letters.length === token.v.length && ec.letters.every((l, i) => l === token.v[i]),
        )
        if (def) newSeries = def.series
      }
      // Independent vowels and diacritics generally don't change the "current consonant series" state
      // for subsequent vowels in a simple linear scan, though diacritics like treisăpt do.
      // However, extra consonants (complex clusters) which include treisăpt are already handled.
      // Standalone diacritics are rare in valid modern text unless modifying a specific base.
      // We pass the currentSeries through.

      return {
        currentSeries: newSeries,
        tokens: [...acc.tokens, { ...token, series: newSeries }],
      }
    },
    { currentSeries: 'a', tokens: [] },
  ).tokens
}

const truncate = (str: string, n: number): string => {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

export const renderTransliteration = (enrichedTokens: readonly EnrichedToken[]): string => {
  return enrichedTokens
    .map(token => {
      const text = token.v.join('')

      switch (token.t) {
        case 'CONSONANT': {
          const def = CONSONANTS.find(c => c.letter === token.v[0])
          if (!def) return ''

          const className = def.series === 'a' ? 'cons-a' : 'cons-o'
          return `
      <div class="token-box">
        <div class="token-char ${className}">${text}</div>
        <div class="token-trans">${def.trans}</div>
        <div class="token-ipa">/${def.ipa}/</div>
      </div>`
        }

        case 'EXTRA_CONSONANT': {
          const def = EXTRA_CONSONANTS.find(
            ec => ec.letters.length === token.v.length && ec.letters.every((l, i) => l === token.v[i]),
          )
          if (!def) return ''

          return `
      <div class="token-box">
        <div class="token-char cons-extra"><i>${text}</i></div>
        <div class="token-trans">${def.trans}</div>
        <div class="token-ipa">/${def.ipa}/</div>
      </div>`
        }

        case 'VOWEL': {
          const def = VOWELS.find(v => v.letter === token.v[0])
          if (!def) return ''

          const isASeries = token.series === 'a'
          const aClass = isASeries ? 'trans-active' : 'trans-inactive'
          const oClass = isASeries ? 'trans-inactive' : 'trans-active'

          return `
      <div class="token-box">
        <div class="token-char vowel">${text}</div>
        <div class="token-trans">
          <span class="trans-option ${aClass}">${def.trans_a}</span><span class="trans-separator">/</span><span class="trans-option ${oClass}">${def.trans_o}</span>
        </div>
        <div class="token-ipa">
          <span class="trans-option ${aClass}">/${def.ipa_a}/</span><span class="trans-separator"> </span><span class="trans-option ${oClass}">/${def.ipa_o}/</span>
        </div>
      </div>`
        }

        case 'VOWEL_COMBINATION': {
          const def = VOWEL_COMBINATIONS.find(
            vc => vc.letters.length === token.v.length && vc.letters.every((l, i) => l === token.v[i]),
          )
          if (!def) return ''

          const isASeries = token.series === 'a'
          const aClass = isASeries ? 'trans-active' : 'trans-inactive'
          const oClass = isASeries ? 'trans-inactive' : 'trans-active'

          return `
      <div class="token-box">
        <div class="token-char vowel">${text}</div>
        <div class="token-trans">
          <span class="trans-option ${aClass}">${def.trans_a}</span><span class="trans-separator">/</span><span class="trans-option ${oClass}">${def.trans_o}</span>
        </div>
        <div class="token-ipa">
          <span class="trans-option ${aClass}">/${def.ipa_a}/</span><span class="trans-separator"> </span><span class="trans-option ${oClass}">/${def.ipa_o}/</span>
        </div>
      </div>`
        }

        case 'INDEPENDENT_VOWEL': {
          const def = INDEPENDENT_VOWELS.find(
            iv => iv.letters.length === token.v.length && iv.letters.every((l, i) => l === token.v[i]),
          )
          if (!def) return ''

          return `
      <div class="token-box">
        <div class="token-char independent-vowel">${text}</div>
        <div class="token-trans">${def.trans}</div>
        <div class="token-ipa">/${def.ipa}/</div>
      </div>`
        }

        case 'DIACRITIC': {
          const def = DIACRITICS.find(d => d.symbol === token.v[0])
          if (!def) return ''

          // Truncate logic: First 12 chars, ellipsis if longer
          const shortDesc = truncate(def.desc_en, 12)

          return `
      <div class="token-box diacritic-box">
        <div class="token-char diacritic">◌${text}</div>
        <div class="token-trans" style="font-size: 0.7em;">${shortDesc}</div>
        <div class="token-ipa"> </div> <!-- Empty row for alignment, or put '-' -->

        <!-- The custom tooltip element -->
        <div class="custom-tooltip">${def.desc_en}</div>
      </div>`
        }

        case 'SPACE':
          return `</br>`

        case 'UNKNOWN':
          return `
      <div class="token-box">
        <div class="token-char unknown">${text}</div>
        <div class="token-trans">—</div>
        <div class="token-ipa"></div>
      </div>`
        default:
          assertNever(token.t)
      }
    })
    .join('')
}

// ==========================================
// 6. MAIN EXECUTION FOR ANKI
// ==========================================

function initAnkiDroidApi(): AnkiDroidJS | undefined {
  if (typeof AnkiDroidJS !== 'undefined') {
    try {
      const jsApiContract = {
        version: '0.0.3',
        developer: 'srghma@gmail.com', // <-- REQUIRED
      }
      return new AnkiDroidJS(jsApiContract)
    } catch (err) {
      console.warn('Failed to initialize AnkiDroid API:', err)
    }
  } else {
    console.log('AnkiDroidJS not present — using browser fallback.')
  }
}

const renderSingleKhmerText = (
  textElementId: string,
  graphemesElementId: string,
  transliterationElementId: string,
  api: AnkiDroidJS | undefined,
): void => {
  const textEl = document.getElementById(textElementId)
  if (!textEl) return

  const text = textEl.innerText.trim()
  if (!text) return

  const chars = Char_mkArray(text)

  // 1. Render grapheme clusters
  ;(() => {
    const graphemesEl = document.getElementById(graphemesElementId)
    if (!graphemesEl) return

    try {
      const segmenter = new Intl.Segmenter('km', { granularity: 'grapheme' })
      const graphemes = [...segmenter.segment(text)]
        .map(x => (x.segment === ' ' ? '-' : `<span class="one-grapheme-with-audio">${x.segment}</span>`))
        .join(' ')
      graphemesEl.innerHTML = graphemes
    } catch (e) {
      graphemesEl.innerText = '(Grapheme segmentation not supported)'
    }
  })()

  // 2. Tokenize and enrich
  const tokens = tokenize(chars)
  const enrichedTokens = enrichWithSeries(tokens)

  // 3. Render transliteration
  ;(() => {
    const transEl = document.getElementById(transliterationElementId)
    if (!transEl) return
    transEl.innerHTML = renderTransliteration(enrichedTokens)
  })()

  // 4. Add TTS handlers after rendering
  addTTSHandlers_whole(textElementId, api)
  addTTSHandlers(graphemesElementId, '.one-grapheme-with-audio', api)
  addTTSHandlers(transliterationElementId, '.token-char', api)

  // 5. Add Tooltip handlers for mobile support
  addTooltipHandlers(transliterationElementId)
}

const handleHiddenButAppearsOnClick = (): void => {
  const className = 'hidden-but-appears-on-click'
  const elements = document.querySelectorAll(`.${className}`)
  if (!elements.length) return
  elements.forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault()
      e.stopPropagation()
      el.classList.remove(className)
    })
  })
}

const addTooltipHandlers = (elementId: string): void => {
  const element = document.getElementById(elementId)
  if (!element) return

  // Select all boxes we marked as diacritics
  const diacriticBoxes = element.querySelectorAll('.diacritic-box')

  diacriticBoxes.forEach(box => {
    box.addEventListener('click', e => {
      // 1. Stop the click from bubbling (so it doesn't trigger word TTS if nested)
      e.stopPropagation()

      // 2. Close all other open tooltips first (optional, cleaner UX)
      diacriticBoxes.forEach(b => {
        if (b !== box) b.classList.remove('tooltip-active')
      })

      // 3. Toggle this one
      box.classList.toggle('tooltip-active')
    })
  })

  // 4. Close tooltips if clicking anywhere else on the screen
  document.addEventListener('click', () => {
    diacriticBoxes.forEach(b => b.classList.remove('tooltip-active'))
  })
}

export const renderKhmerAnalysis = (): void => {
  if (typeof document === 'undefined') return

  const api = initAnkiDroidApi()

  // Render main word
  renderSingleKhmerText('word', 'word-graphemes', 'word-split-ru', api)

  // Render example sentence (if present)
  renderSingleKhmerText('example-sent', 'example-sent-graphemes', 'example-sent-split-ru', api)

  handleHiddenButAppearsOnClick()
}

// ==========================================
// EXAMPLE USAGE (for testing)
// ==========================================

// Test with word: កម្ពុជា (Cambodia)
// const testText = "កម្ពុជា";
// const testChars = Array.from(testText);
// const testTokens = tokenize(testChars);
// const testEnriched = enrichWithSeries(testTokens);
// console.log('Tokens:', testTokens);
// console.log('Enriched:', testEnriched);
// console.log('HTML Split:', renderCharacterSplit(testEnriched));
// console.log('HTML Trans:', renderTransliteration(testEnriched));

// For Anki: Execute when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderKhmerAnalysis)
  } else {
    renderKhmerAnalysis()
  }
}
