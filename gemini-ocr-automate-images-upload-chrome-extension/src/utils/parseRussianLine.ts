import {
  buildLexer,
  expectEOF,
  expectSingleResult,
  type Parser,
  seq,
  alt,
  opt,
  rep_sc,
  tok,
  apply,
} from 'typescript-parsec'

// ============================================================================
// LEXER
// ============================================================================

export enum TokenKind {
  // Formatting markers
  DoubleStar, // **
  Star, // *
  Space, // One or more spaces (not tabs)

  // Words
  RussianWord, // Cyrillic word
  KhmerWord, // Khmer word

  // Punctuation
  Comma, // ,
  Semicolon, // ;
  Dot, // .
  Pipe, // |
  Diamond, // ◇

  // Numbers
  RomanNumeral, // I, II, III, IV, V, etc
  ArabicNumber, // 1, 2, 3, etc

  // Morphology
  Dash, // - (for endings like -ая)

  // Other
  Other, // Catch-all for anything else (letters, digits, etc)
}

export const lexer = buildLexer([
  // Formatting (order matters - ** before *)
  [true, /\*\*/, TokenKind.DoubleStar],
  [true, /\*/, TokenKind.Star],

  // Space (only spaces, not tabs or newlines)
  [true, / +/, TokenKind.Space],

  // Words using Unicode script properties
  [true, /[\p{Script=Cyrillic}\u0300-\u036f]+/u, TokenKind.RussianWord],
  [true, /\p{Script=Khmer}+/u, TokenKind.KhmerWord],

  // Punctuation
  [true, /,/, TokenKind.Comma],
  [true, /;/, TokenKind.Semicolon],
  [true, /\./, TokenKind.Dot],
  [true, /\|/, TokenKind.Pipe],
  [true, /◇/, TokenKind.Diamond],
  [true, /-/, TokenKind.Dash],

  // Numbers (Roman before Arabic to catch I, V, X, etc.)
  [true, /[IVXLCDM]+/, TokenKind.RomanNumeral],
  [true, /\d+/, TokenKind.ArabicNumber],
])

// ============================================================================
// PARSER TYPES
// ============================================================================

export type RussianWordBold = {
  type: 'RussianWordBold'
  word: string
  wordAfterPipe: string | undefined
}

export type KhmerWordBold = {
  type: 'KhmerWordBold'
  word: string
}

export type UslSocr = {
  type: 'UslSocr'
  abbrev: string // e.g., "см.", "сов.", "и"
}

export type Sex = {
  type: 'Sex'
  gender: 'ж' | 'м' | 'с'
}

export type PartOfSpeech = {
  type: 'PartOfSpeech'
  pos: string // e.g., "союз", "гл.", "нареч."
}

export type GrammarInfo = {
  type: 'GrammarInfo'
  content: string // Generic italic content
}

export type Okonchanie = {
  type: 'Okonchanie'
  ending: string // e.g., "ая", "ые"
}

export type RomanNumber = {
  type: 'RomanNumber'
  value: string
}

export type NumberDot = {
  type: 'NumberDot'
  value: number
}

export type ParsedToken =
  | RussianWordBold
  | KhmerWordBold
  | UslSocr
  | Sex
  | PartOfSpeech
  | GrammarInfo
  | Okonchanie
  | RomanNumber
  | NumberDot
  | { type: 'Comma' }
  | { type: 'Semicolon' }
  | { type: 'Diamond' }
  | { type: 'RussianWord'; word: string }
  | { type: 'KhmerWord'; word: string }
  | { type: 'Space' }

// ============================================================================
// ABBREVIATION LISTS
// ============================================================================

const USL_SOCR_SET = new Set([
  'см.',
  'и',
  'сов.',
  'несов.',
  'адм.-терр.',
  'безл.',
  'буд.',
  'вводн. сл.',
  'в знач.',
  'вин.',
  'воен.',
  'вопр.',
  'в разн. знач.',
  'геогр.',
  'гл.',
  'грам.',
  'дат.',
  'др.',
  'ед.',
  'знач.',
  'иск.',
  'и т.д.',
  'и т.п.',
  'кв.',
  'крат. ф.',
  'к-рый',
  'кто-л.',
  '-л.',
  'л.',
  'лит.',
  'мат.',
  'мед.',
  'мест.',
  'мн.',
  'мор.',
  'муз.',
  'накл.',
  'напр.',
  'нареч.',
  'наст.',
  'неоп.',
  'нескл.',
  'отрицат.',
  'перен.',
  'повел.',
  'погов.',
  'полит.',
  'полн. ф.',
  'посл.',
  'превосх. ст.',
  'предл.',
  'предлог',
  'прил.',
  'прош.',
  'разг.',
  'рел.',
  'род.',
  'сказ.',
  'сокр.',
  'союз',
  'спорт.',
  'сравн. ст.',
  'сущ.',
  'твор.',
  'театр.',
  'тж.',
  'тк.',
  'указ.',
  'ул.',
  'употр.',
  'усил.',
  'утверд.',
  'ф.',
  'физ.',
  'филос.',
  'частица',
  'числ.',
  'что-л.',
  'юр.',
])

const POS_SET = new Set(['союз', 'гл.', 'нареч.', 'прил.', 'сущ.', 'мест.', 'числ.', 'предлог', 'частица'])

// ============================================================================
// PARSER RULES
// ============================================================================

// Helper: optional spaces
const optSpace = opt(tok(TokenKind.Space))
const reqSpace = tok(TokenKind.Space)

// Russian word in bold: ** word [| word] **
const russianWordBold: Parser<TokenKind, RussianWordBold> = apply(
  seq(
    tok(TokenKind.DoubleStar),
    tok(TokenKind.RussianWord),
    opt(seq(tok(TokenKind.Pipe), tok(TokenKind.RussianWord))),
    tok(TokenKind.DoubleStar),
  ),
  ([_, word, pipeAndWord, __]) => ({
    type: 'RussianWordBold',
    word: word.text,
    wordAfterPipe: pipeAndWord?.[1].text,
  }),
)

// Khmer word in bold: ** word **
const khmerWordBold: Parser<TokenKind, KhmerWordBold> = apply(
  seq(tok(TokenKind.DoubleStar), tok(TokenKind.KhmerWord), tok(TokenKind.DoubleStar)),
  ([_, word, __]) => ({
    type: 'KhmerWordBold',
    word: word.text,
  }),
)

// Content between * and * (could be multiple tokens)
// Returns the text content between the stars
const italicContent: Parser<TokenKind, string> = apply(
  seq(
    tok(TokenKind.Star),
    rep_sc(
      alt(
        tok(TokenKind.RussianWord),
        tok(TokenKind.Space),
        tok(TokenKind.Dot),
        tok(TokenKind.Dash),
        tok(TokenKind.Comma),
        tok(TokenKind.Other),
      ),
    ),
    tok(TokenKind.Star),
  ),
  ([_, content, __]) => content.map(t => t.text).join(''),
)

// Check if italic content is a gender marker
const sexMarker: Parser<TokenKind, Sex> = apply(italicContent, content => {
  if (content === 'ж' || content === 'м' || content === 'с') {
    return { type: 'Sex', gender: content }
  }
  throw new Error(`Not a sex marker: ${content}`)
})

// Check if italic content is an abbreviation
const uslSocr: Parser<TokenKind, UslSocr> = apply(italicContent, content => {
  if (USL_SOCR_SET.has(content)) {
    return { type: 'UslSocr', abbrev: content }
  }
  throw new Error(`Not a known abbreviation: ${content}`)
})

// Check if italic content is a part of speech
const partOfSpeech: Parser<TokenKind, PartOfSpeech> = apply(italicContent, content => {
  if (POS_SET.has(content)) {
    return { type: 'PartOfSpeech', pos: content }
  }
  throw new Error(`Not a known POS: ${content}`)
})

// Generic italic content (catch-all)
const grammarInfo: Parser<TokenKind, GrammarInfo> = apply(italicContent, content => ({
  type: 'GrammarInfo',
  content,
}))

// Try to parse italic content as specific types, fallback to generic
const italicToken: Parser<TokenKind, UslSocr | Sex | PartOfSpeech | GrammarInfo> = alt(
  sexMarker,
  uslSocr,
  partOfSpeech,
  grammarInfo,
)

// Okonchanie: - followed by Russian word
const okonchanie: Parser<TokenKind, Okonchanie> = apply(
  seq(tok(TokenKind.Dash), tok(TokenKind.RussianWord)),
  ([_, word]) => ({
    type: 'Okonchanie',
    ending: word.text,
  }),
)

// Roman numeral
const romanNumber: Parser<TokenKind, RomanNumber> = apply(tok(TokenKind.RomanNumeral), token => ({
  type: 'RomanNumber',
  value: token.text,
}))

// Number with dot: 1.
const numberDot: Parser<TokenKind, NumberDot> = apply(
  seq(tok(TokenKind.ArabicNumber), tok(TokenKind.Dot)),
  ([num, _]) => ({
    type: 'NumberDot',
    value: parseInt(num.text, 10),
  }),
)

// Plain Russian word
const plainRussianWord: Parser<TokenKind, { type: 'RussianWord'; word: string }> = apply(
  tok(TokenKind.RussianWord),
  token => ({
    type: 'RussianWord',
    word: token.text,
  }),
)

// Plain Khmer word
const plainKhmerWord: Parser<TokenKind, { type: 'KhmerWord'; word: string }> = apply(
  tok(TokenKind.KhmerWord),
  token => ({
    type: 'KhmerWord',
    word: token.text,
  }),
)

// Simple tokens
const comma: Parser<TokenKind, { type: 'Comma' }> = apply(tok(TokenKind.Comma), () => ({ type: 'Comma' }))

const semicolon: Parser<TokenKind, { type: 'Semicolon' }> = apply(tok(TokenKind.Semicolon), () => ({
  type: 'Semicolon',
}))

const diamond: Parser<TokenKind, { type: 'Diamond' }> = apply(tok(TokenKind.Diamond), () => ({ type: 'Diamond' }))

const space: Parser<TokenKind, { type: 'Space' }> = apply(tok(TokenKind.Space), () => ({ type: 'Space' }))

// Main token parser - tries all alternatives
export const token: Parser<TokenKind, ParsedToken> = alt(
  russianWordBold,
  khmerWordBold,
  italicToken,
  okonchanie,
  romanNumber,
  numberDot,
  plainRussianWord,
  plainKhmerWord,
  comma,
  semicolon,
  diamond,
  space,
)

// Parse a complete line as a sequence of tokens
export const line: Parser<TokenKind, ParsedToken[]> = rep_sc(token)

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function parseLine(input: string): ParsedToken[] {
  const result = expectSingleResult(expectEOF(line.parse(lexer.parse(input))))
  return result
}

export function displayTokens(tokens: ParsedToken[]): void {
  tokens.forEach((token, i) => {
    let display = ''
    switch (token.type) {
      case 'RussianWordBold':
        display = `RussianWordBold: "${token.word}" (wordAfterPipe: ${token.wordAfterPipe})`
        break
      case 'KhmerWordBold':
        display = `KhmerWordBold: "${token.word}"`
        break
      case 'UslSocr':
        display = `UslSocr: "${token.abbrev}"`
        break
      case 'Sex':
        display = `Sex: ${token.gender}`
        break
      case 'PartOfSpeech':
        display = `PartOfSpeech: "${token.pos}"`
        break
      case 'GrammarInfo':
        display = `GrammarInfo: "${token.content}"`
        break
      case 'Okonchanie':
        display = `Okonchanie: -${token.ending}`
        break
      case 'RomanNumber':
        display = `RomanNumber: ${token.value}`
        break
      case 'NumberDot':
        display = `NumberDot: ${token.value}.`
        break
      case 'RussianWord':
        display = `RussianWord: "${token.word}"`
        break
      case 'KhmerWord':
        display = `KhmerWord: "${token.word}"`
        break
      case 'Comma':
      case 'Semicolon':
      case 'Diamond':
      case 'Space':
        display = token.type
        break
    }
    console.log(`[${i}] ${display}`)
  })
}
