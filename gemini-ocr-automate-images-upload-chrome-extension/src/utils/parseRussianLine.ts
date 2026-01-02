import { assertIsDefinedAndReturn } from "./asserts"
import { NonEmptyArray, Array_isNonEmptyArray } from "./non-empty-array"
import { NonEmptyStringTrimmed } from "./non-empty-string-trimmed"
import {
  TypedRussianMultiWord,
  strToRussianMultiWordOrUndefined,
} from "./russian-word"

// -- Types --

export type RussianHeadword = {
  readonly word: TypedRussianMultiWord
  readonly morphology: string | undefined // Text between word and grammar (e.g. ", -а")
  readonly grammar: string | undefined // Text inside *...* (e.g. "м", "несов.")
  readonly separator: "and" | "pair" | undefined // "and" (*и*), "pair" (;)
}

export type TypedRussianLine =
  | {
      readonly t: "reference"
      readonly index: TypedRussianMultiWord
      readonly to: TypedRussianMultiWord
    }
  | {
      readonly t: "definition"
      readonly headwords: NonEmptyArray<RussianHeadword>
      readonly content: string // The rest of the line (Translations, examples)
    }

// -- Helpers --

/**
 * Regex explanation:
 * ^\s*\*\*                  -> Start with bold
 * (?<word>[^*]+)            -> Capture the main word (stop at *)
 * \*\*                      -> End bold
 * (?<morph>[^*]*?)          -> Capture morphology (non-greedy, stop before next *)
 * (?:                                 -> Optional Grammar Block
 *   \*                      -> Start italic
 *   (?<gram>[^*]+)          -> Capture grammar
 *   \*                      -> End italic
 * )?
 * (?<sep>\s*(?:;|и)\s*)?    -> Optional separator (; or и)
 */
const HEADWORD_REGEX =
  /^\s*\*\*(?<word>[^*]+)\*\*(?<morph>[^*]*?)(?:\*(?<gram>[^*]+)\*)?(?<sep>\s*(?:;|и)\s*)?/

// Recursively consumes headwords from the start of the string
// until it hits something that isn't a Russian headword structure
const consumeHeadwords = (
  input: string,
  acc: ReadonlyArray<RussianHeadword> = [],
): {
  headwords: ReadonlyArray<RussianHeadword>
  rest: string
} => {
  const match = input.match(HEADWORD_REGEX)

  if (!match || !match.groups) {
    return { headwords: acc, rest: input.trim() }
  }

  const rawWord = match.groups["word"]
  const validWord = rawWord
    ? strToRussianMultiWordOrUndefined(rawWord)
    : undefined

  // If the bold text isn't a valid Russian word (e.g. it's Khmer "**ទូរថភ្លើង**"),
  // we treat this as the start of the content, not a headword.
  if (!validWord) {
    return { headwords: acc, rest: input.trim() }
  }

  const rawSep = match.groups["sep"]?.trim()
  const separator: RussianHeadword["separator"] =
    rawSep === "и" ? "and" : rawSep === ";" ? "pair" : undefined

  const newHeadword: RussianHeadword = {
    word: validWord,
    morphology: match.groups["morph"]?.trim() || undefined,
    grammar: match.groups["gram"]?.trim() || undefined,
    separator,
  }

  const nextInput = input.slice(match[0].length)
  const nextAcc = [...acc, newHeadword]

  // Look-ahead: If there was no separator, but the next non-space chars are NOT `**`,
  // we stop parsing headwords. This prevents consuming bold text inside examples.
  // Headwords are strictly at the start or linked by separators.
  if (!separator) {
    const isNextBold = /^\s*\*\*/.test(nextInput)
    // Edge case: Sometimes synonyms are just space separated?
    // Based on examples, they usually have separators or are just one entry.
    // If the next bit looks like a bold Russian word, we might continue,
    // but usually, without a separator, it's the Translation start.
    // Let's check if the next bold part is Russian.
    if (isNextBold) {
      // If next is bold Russian, we continue (e.g. rare case or implicit list).
      // If next is bold Khmer, the `validWord` check in next recursion will fail and return.
      return consumeHeadwords(nextInput, nextAcc)
    }
    return { headwords: nextAcc, rest: nextInput.trim() }
  }

  return consumeHeadwords(nextInput, nextAcc)
}

// -- Main Parser --

export const parseRussianLine = (
  line: NonEmptyStringTrimmed,
): TypedRussianLine => {
  // 1. Try Parse Reference: **word** *см.* **target**
  // Using a specific regex for the strict "See" structure
  const refMatch = line.match(
    /^\*\*(?<index>[^*]+)\*\*\s*\*см\.*\s*\*\*(?<to>[^*]+)\*\*$/,
  )

  if (refMatch && refMatch.groups) {
    const index = strToRussianMultiWordOrUndefined(
      assertIsDefinedAndReturn(refMatch.groups["index"]),
    )
    const to = strToRussianMultiWordOrUndefined(
      assertIsDefinedAndReturn(refMatch.groups["to"]),
    )

    if (index && to) {
      return {
        t: "reference",
        index,
        to,
      }
    }
  }

  // 2. Parse Definition
  const { headwords, rest } = consumeHeadwords(line)

  if (Array_isNonEmptyArray(headwords)) {
    return {
      t: "definition",
      headwords,
      content: rest,
    }
  }

  // Fallback if parsing fails to find any valid Russian headword structure
  // We treat the whole line as content, or throw if strictness is required.
  // Given the types, we must return a valid shape.
  throw new Error(`Failed to parse Russian line structure: ${line}`)
}
