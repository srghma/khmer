import {
  type NonEmptySet,
  Set_elementsMaybeUndefined_ifAllNonUndefined_toNonEmptySet_orUndefined,
} from './non-empty-set'
import { type NonEmptyStringTrimmed } from './non-empty-string-trimmed'

// text that contains only khmer letters and no other letters (not even space)

// Matches Cyrillic, vertical bars (stems), hyphens, and combining accents (u0300-u036f)
// **май**
const RussianWordDictionaryIndexElement_REGEX_simple = /^\p{Script=Cyrillic}+-?$/u

// **вагон-ресторан**
const RussianWordDictionaryIndexElement_REGEX_dephis = /^\p{Script=Cyrillic}+-\p{Script=Cyrillic}+$/u

// **в футбол**, **не совсем хорошо** (Allow spaces between Cyrillic words)
const RussianWordDictionaryIndexElement_REGEX_phrase = /^\p{Script=Cyrillic}+(?:[ -]\p{Script=Cyrillic}+)+$/u

export type TypedRussianWordDictionaryIndexElement = NonEmptyStringTrimmed & {
  readonly __uuidbrand: 'TypedRussianWordDictionaryIndexElement'
}

export const isRussianWordDictionaryIndexElement = (value: string): value is TypedRussianWordDictionaryIndexElement =>
  RussianWordDictionaryIndexElement_REGEX_simple.test(value) ||
  RussianWordDictionaryIndexElement_REGEX_phrase.test(value) ||
  RussianWordDictionaryIndexElement_REGEX_dephis.test(value)

export const strToRussianWordDictionaryIndexElementOrUndefined = (
  value: string,
): TypedRussianWordDictionaryIndexElement | undefined =>
  isRussianWordDictionaryIndexElement(value) ? value : undefined
export const strToRussianWordDictionaryIndexElementOrThrow = (
  value: string,
): TypedRussianWordDictionaryIndexElement => {
  const uuid = strToRussianWordDictionaryIndexElementOrUndefined(value)
  if (!uuid) throw new Error(`Invalid RussianWordDictionaryIndexElement format: '${value}'`)
  return uuid
}

// Map common Latin homoglyphs to Cyrillic
const normalizeHomoglyphs = (str: string): string => {
  return str
    .replace(/a/g, 'а')
    .replace(/A/g, 'А')
    .replace(/B/g, 'В')
    .replace(/c/g, 'с')
    .replace(/C/g, 'С')
    .replace(/e/g, 'е')
    .replace(/E/g, 'Е')
    .replace(/H/g, 'Н')
    .replace(/K/g, 'К')
    .replace(/M/g, 'М')
    .replace(/o/g, 'о')
    .replace(/O/g, 'О')
    .replace(/p/g, 'р')
    .replace(/P/g, 'Р')
    .replace(/T/g, 'Т')
    .replace(/x/g, 'х')
    .replace(/X/g, 'Х')
    .replace(/y/g, 'у')
}

// Expands "бросить(ся)" -> ["бросить", "броситься"]
// Expands "наверно[е]" -> ["наверно", "наверное"]
const expandOptionalSuffix = (str: string): string[] => {
  str =
    {
      'т.е.': 'то есть',
      'то есть (т.е.)': 'то есть',
    }[str] ?? str

  // Check for parenthesis: word(suffix)
  let match = str.match(/^(.+)\((.+)\)$/)
  if (match && match[1] && match[2]) {
    const base = match[1].trim()
    const suffix = match[2].trim()
    return [base, base + suffix]
  }

  // Check for brackets: word[suffix]
  match = str.match(/^(.+)\[(.+)\]$/)
  if (match && match[1] && match[2]) {
    const base = match[1].trim()
    const suffix = match[2].trim()
    return [base, base + suffix]
  }

  return [str]
}

// вам, вами -> ["вам", "вами"]
// сажá|ть -> ["сажать"]
// сошь|ю́, -ёшь, -ю́т -> [сошью, сошьёшь, сошьют]
// if ends with (ru) then make array e.g. повернуть(ся) -> повернуть, повернуться
// "КПСС (Коммунистическая партия Советского Союза)" - IMPOSSIBLE
export type TypedRussianWordDictionaryIndex = NonEmptySet<TypedRussianWordDictionaryIndexElement>
export const strToRussianWordDictionaryIndexOrUndefined = (
  value: string,
): TypedRussianWordDictionaryIndex | undefined => {
  if (!value) return undefined

  // 1. Normalize Homoglyphs (fix Latin chars)
  // 2. Decompose to NFD
  // 3. Remove specifically the ACUTE ACCENT (stress) \u0301.
  //    Avoid removing \u0306 (breve) which is needed for 'й'.
  // 4. Remove |
  // 5. Recompose to NFC (fixes 'й' and other joined characters)
  const preClean = value
    .normalize('NFD')
    .replace(/\u0301/g, '') // Remove only the stress mark
    .replace(/\|/g, '')
    .normalize('NFC')

  const cleanString = normalizeHomoglyphs(preClean)

  const array = cleanString
    .split(',') // Split comma-separated variants
    .map(s => s.trim())
    .flatMap(expandOptionalSuffix) // Expand word(suffix) -> [word, wordsuffix]
    .map(strToRussianWordDictionaryIndexElementOrUndefined)

  const elements = Set_elementsMaybeUndefined_ifAllNonUndefined_toNonEmptySet_orUndefined(new Set(array))

  if (elements === undefined)
    console.error(
      `Validation Failed: Raw="${value}" -> PreClean="${preClean}" -> Cleaned="${cleanString}" -> Expanded=${JSON.stringify(
        cleanString
          .split(',')
          .map(s => s.trim())
          .flatMap(expandOptionalSuffix),
      )}`,
    )

  return elements
}
