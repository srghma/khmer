import { assertNever } from "./asserts"
import { TypedKhmerWord } from "./khmer-word"

const nativeSegmenter = new Intl.Segmenter("km", { granularity: "word" })

/**
'ផ្លូវកខ្វេងកខ្វាក់'
=>['ផ្លូវ', 'កខ្វេងក', 'ខ្វាក់']
'ផ្លូវ កខ្វេងកខ្វាក់' (impossible)
=>['ផ្លូវ', ' ', 'កខ្វេងក', 'ខ្វាក់']
'ផ្លូវ  កខ្វេងកខ្វាក់' (impossible)
=>['ផ្លូវ', '  ', 'កខ្វេងក', 'ខ្វាក់']
'ផ្លូវ  tst កខ្វេងកខ្វាក់' (impossible)
=>['ផ្លូវ', '  ', 'tst', ' ', 'កខ្វេងក', 'ខ្វាក់']
'ផ្លូវ  tstកខ្វេងកខ្វាក់' (impossible)
=>['ផ្លូវ', '  ', 'tstកខ្វេងក', 'ខ្វាក់']
*/
export function khmerSentenceToWords_usingSegmenter(
  str: TypedKhmerWord,
): TypedKhmerWord[] {
  return Array.from(nativeSegmenter.segment(str)).map(
    (s) => s.segment as TypedKhmerWord,
  )
}

// --- Dictionary Approach ---

/**
khmerSentenceToWords_usingDictionary('ផ្លូវកខ្វេងកខ្វាក់', new Set(khmerSentenceToWords_usingSegmenter('ផ្លូវកខ្វេងកខ្វាក់')))
(3) ['ផ្លូវ', 'កខ្វេងក', 'ខ្វាក់']
khmerSentenceToWords_usingDictionary('ផ្លូវ កខ្វេងកខ្វាក់', new Set(khmerSentenceToWords_usingSegmenter('ផ្លូវកខ្វេងកខ្វាក់'))) (impossible)
(4) ['ផ្លូវ', ' ', 'កខ្វេងក', 'ខ្វាក់']
khmerSentenceToWords_usingDictionary('ផ្លូវ  កខ្វេងកខ្វាក់', new Set(khmerSentenceToWords_usingSegmenter('ផ្លូវកខ្វេងកខ្វាក់'))) (impossible)
(5) ['ផ្លូវ', ' ', ' ', 'កខ្វេងក', 'ខ្វាក់']
khmerSentenceToWords_usingDictionary('ផ្លូវ  tst កខ្វេងកខ្វាក់', new Set(khmerSentenceToWords_usingSegmenter('ផ្លូវកខ្វេងកខ្វាក់'))) (impossible)
(9) ['ផ្លូវ', ' ', ' ', 't', 's', 't', ' ', 'កខ្វេងក', 'ខ្វាក់']
khmerSentenceToWords_usingDictionary('ផ្លូវ  tstកខ្វេងកខ្វាក់', new Set(khmerSentenceToWords_usingSegmenter('ផ្លូវកខ្វេងកខ្វាក់'))) (impossible)
(8) ['ផ្លូវ', ' ', ' ', 't', 's', 't', 'កខ្វេងក', 'ខ្វាក់']
 */
export function khmerSentenceToWords_usingDictionary(
  str: TypedKhmerWord,
  dict: Set<TypedKhmerWord>,
): TypedKhmerWord[] {
  const chars = Array.from(str)
  const result: TypedKhmerWord[] = []

  let i = 0
  while (i < chars.length) {
    let longestMatchString: string | undefined
    let longestMatchLen = 0 // Length in Chars, not string.length

    let currentString = ""

    // Forward matching
    for (let j = i; j < chars.length; j++) {
      currentString += chars[j]
      if (dict.has(currentString as TypedKhmerWord)) {
        longestMatchString = currentString
        longestMatchLen = j - i + 1
      }
    }

    if (longestMatchString) {
      result.push(longestMatchString as TypedKhmerWord)
      i += longestMatchLen
    } else {
      // Unknown: take 1 char
      result.push(chars[i]! as TypedKhmerWord)
      i++
    }
  }

  return result
}

// --- Joined Approach ---

export enum Color {
  Segmenter,
  Dictionary,
  Both,
}

export type WordWithColor = {
  w: TypedKhmerWord
  color: Color
}

/**
 * Merges two token streams by calculating the Union of all Split Boundaries.
 * Returns an array of objects containing the atomic word segment and the
 * 'Color' of the boundary that *follows* that word.
 */
export function khmerSentenceToWords_usingBoth_join(
  usingSegmenter: TypedKhmerWord[],
  usingDictionary: TypedKhmerWord[],
): WordWithColor[] {
  // 1. Validation: Proof that both arrays reconstruct the exact same string
  const strSeg = usingSegmenter.join("")
  const strDict = usingDictionary.join("")

  if (strSeg !== strDict) {
    throw new Error(
      `khmerSentenceToWords_usingBoth_join: Mismatching inputs. Segmenter: "${strSeg}", Dictionary: "${strDict}"`,
    )
  }

  // 2. Functional Helpers
  const toCumulativeIndices = (tokens: TypedKhmerWord[]): Set<number> => {
    let acc = 0
    return new Set(
      tokens.map((t) => {
        acc += Array.from(t).length
        return acc
      }),
    )
  }

  // 3. Calculate Cuts
  const segCuts = toCumulativeIndices(usingSegmenter)
  const dictCuts = toCumulativeIndices(usingDictionary)

  // 4. Create Union of Cuts (Sorted)
  const allCuts = Array.from(new Set([...segCuts, ...dictCuts])).sort(
    (a, b) => a - b,
  )

  // 5. Transform (Map over cuts to produce segments)
  const allChars = Array.from(strSeg)

  // Use a reducing scan logic wrapped in map by maintaining state in closure
  // (Pure functional would use scan/reduce, but map with closure is cleaner TS for this specific array transform)
  let start = 0

  return allCuts.map((end): WordWithColor => {
    // 5a. Slice the atomic segment
    const w = allChars.slice(start, end).join("") as TypedKhmerWord

    // 5b. Determine Color of the cut at 'end'
    const isSeg = segCuts.has(end)
    const isDict = dictCuts.has(end)

    const color = ((): Color => {
      switch (true) {
        case isSeg && isDict:
          return Color.Both
        case isSeg:
          return Color.Segmenter
        case isDict:
          return Color.Dictionary
        default:
          throw new Error("Impossible state: Cut exists in neither set")
      }
    })()

    // Update start for next iteration
    start = end

    return { w, color }
  })
}
