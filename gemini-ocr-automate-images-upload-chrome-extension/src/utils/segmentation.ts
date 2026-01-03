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
  const o: string[] = Array.from(nativeSegmenter.segment(str)).map(
    (s) => s.segment,
  )
  return o as TypedKhmerWord[]
}

// --- 2. Dictionary Approach ---

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
  // Use Array.from to split by codepoints (chars) safely, rather than grapheme segmenter for this specific requirement
  // to ensure alignment with the join function's character counting.
  const chars = Array.from(str)
  const result: TypedKhmerWord[] = []

  let i = 0
  while (i < chars.length) {
    let longestMatchString: string | null = null
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

// --- 3. Joined Approach (Union of Boundaries) ---

// --- Type Definitions ---

export enum Space {
  Segmenter,
  Dictionary,
  Both,
}

export type WordsOrSpaces = TypedKhmerWord | Space

export type InterspersedArray = WordsOrSpaces[]

// --- The Join Function ---

/**
 * Merges two token streams by calculating the Union of all Split Boundaries and
 * interspersing Enum Markers indicating which algorithm authorized the split.
 *
 * @param usingSegmenter - Output from the segmenter function.
 * @param usingDictionary - Output from the dictionary function.
 * @returns An array containing text segments interspersed with Space Enum markers.
 *
 * @description
 * This function calculates every index where *either* algorithm made a cut.
 * It slices the text into the smallest common atomic pieces.
 * Between these pieces, it inserts a marker denoting the type of boundary.
 *
 * **Marker Logic:**
 * - If the cut index exists in BOTH algorithms' boundaries -> `Space.Both`
 * - If the cut index exists ONLY in Segmenter's boundaries -> `Space.Segmenter`
 * - If the cut index exists ONLY in Dictionary's boundaries -> `Space.Dictionary`
 *
 * @example
 * // Case: Overlap / Disagreement
 * // Input: "អៅ" (No space, length 2)
 * // Segmenter: ["អៅ"] (Cuts at: 2)
 * // Dictionary: ["អ", "ៅ"] (Cuts at: 1, 2)
 * // Union Cuts: 1, 2.
 * // Result: ["អ", Space.Dictionary, "ៅ"]
 *
 * @example
 * // Case: Whitespace / Agreement
 * // Input: "អ ៅ" (Qa + Space + Au, length 3)
 * // Segmenter: ["អ", " ", "ៅ"] (Cuts at: 1, 2, 3)
 * // Dictionary: ["អ", " ", "ៅ"] (Cuts at: 1, 2, 3)
 * // Union Cuts: 1, 2, 3.
 * // Result: ["អ", Space.Both, " ", Space.Both, "ៅ"]
 */
export function khmerSentenceToWords_usingBoth_join(
  usingSegmenter: TypedKhmerWord[],
  usingDictionary: TypedKhmerWord[],
): InterspersedArray {
  // 1. Flatten to character array for safe slicing and length calculation
  const allChars = usingSegmenter.flatMap((s) => Array.from(s))
  const totalLength = allChars.length

  // 2. Map Boundaries (Cut Indices)
  const segCuts = new Set<number>()
  const dictCuts = new Set<number>()

  // Helper to populate cuts
  const calculateCuts = (tokens: string[], targetSet: Set<number>) => {
    let pos = 0
    tokens.forEach((token) => {
      pos += Array.from(token).length
      targetSet.add(pos)
    })
  }

  calculateCuts(usingSegmenter, segCuts)
  calculateCuts(usingDictionary, dictCuts)

  // 3. Create Sorted Union of Cuts
  // We combine both sets into a unique sorted array of indices
  const allCuts = Array.from(new Set([...segCuts, ...dictCuts])).sort(
    (a, b) => a - b,
  )

  // 4. Build Interspersed Result
  const result: InterspersedArray = []
  let start = 0

  for (const end of allCuts) {
    // A. Slice the text segment
    const textSegment = allChars.slice(start, end).join("")

    // Safety check: ignore empty slices
    if (textSegment.length > 0) {
      result.push(textSegment as TypedKhmerWord)
    }

    // B. Determine Marker (Only if this is NOT the end of the string)
    // We add separators *between* tokens, not after the final token.
    if (end < totalLength) {
      const isSegCut = segCuts.has(end)
      const isDictCut = dictCuts.has(end)

      if (isSegCut && isDictCut) {
        result.push(Space.Both)
      } else if (isSegCut) {
        result.push(Space.Segmenter)
      } else if (isDictCut) {
        result.push(Space.Dictionary)
      }
    }

    start = end
  }

  return result
}
