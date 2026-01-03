// A generic result representing a span of text
export interface Token {
  text: string
  start: number // Absolute start index in the source string
  end: number // Absolute end index in the source string
  isKnown: boolean
}

// Configuration for the analyzer
const wordSegmenter = new Intl.Segmenter("km", { granularity: "word" })
const graphemeSegmenter = new Intl.Segmenter("km", { granularity: "grapheme" })

/**
 * Pure function to process text.
 * Returns a flat list of tokens with their known/unknown status.
 */
export function analyzeKhmerText(
  fullText: string,
  knownWords: Set<string>,
): Token[] {
  const tokens: Token[] = []

  // 1. Identify Blocks of Khmer Text to avoid processing English/Code
  const khmerBlockRegex = /[\p{Script=Khmer}]+/gu
  let blockMatch

  while ((blockMatch = khmerBlockRegex.exec(fullText))) {
    const blockText = blockMatch[0]
    const blockStart = blockMatch.index

    // 2. Segment by Word (Modern approach)
    const wordSegments = wordSegmenter.segment(blockText)

    for (const segmentData of wordSegments) {
      const { segment, index, isWordLike } = segmentData
      if (!isWordLike) continue

      const absStart = blockStart + index

      // 3. Check Dictionary
      if (knownWords.has(segment)) {
        // CASE A: Perfect Match
        tokens.push({
          text: segment,
          start: absStart,
          end: absStart + segment.length,
          isKnown: true,
        })
      } else {
        // CASE B: Fallback - Apply Greedy Algo inside this specific segment
        const subTokens = greedyMatch(segment, knownWords, absStart)
        tokens.push(...subTokens)
      }
    }
  }

  return tokens
}

/**
 * The "Old Algo": Greedy matching based on Graphemes.
 * Used only when the strict word segmenter finds an unknown block.
 */
function greedyMatch(
  text: string,
  knownWords: Set<string>,
  absoluteOffset: number,
): Token[] {
  const tokens: Token[] = []
  const graphemes = [...graphemeSegmenter.segment(text)] // Array of {segment, index}

  let i = 0
  while (i < graphemes.length) {
    let longestMatchEnd = -1
    let currentString = ""

    // Try to build the longest possible known word starting from i
    for (let j = i; j < graphemes.length; j++) {
      currentString += graphemes[j]!.segment
      if (knownWords.has(currentString)) {
        longestMatchEnd = j
      }
    }

    if (longestMatchEnd !== -1) {
      // Found a sub-word
      const startGrapheme = graphemes[i]!
      const endGrapheme = graphemes[longestMatchEnd]!

      // Calculate lengths relative to the text chunk
      const startRel = startGrapheme.index
      const endRel = endGrapheme.index + endGrapheme.segment.length

      tokens.push({
        text: text.substring(startRel, endRel),
        start: absoluteOffset + startRel,
        end: absoluteOffset + endRel,
        isKnown: true,
      })

      i = longestMatchEnd + 1
    } else {
      // No word found starting here -> Mark single grapheme as Unknown
      const g = graphemes[i]!
      tokens.push({
        text: g.segment,
        start: absoluteOffset + g.index,
        end: absoluteOffset + g.index + g.segment.length,
        isKnown: false,
      })
      i++
    }
  }

  return tokens
}
