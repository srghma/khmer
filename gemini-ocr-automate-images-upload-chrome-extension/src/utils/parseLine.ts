import { NonEmptyString, nonEmptyString_afterTrim } from "./non-empty-string"

export type TypedRussianLine<W> = { word: W; content: NonEmptyString }

// --- Logic ---

export const parseLine = <W>(
  line: NonEmptyString,
  strToW: (s: NonEmptyString) => W,
): TypedLine<W> => {
  const match = line.match(/^\*\*([^*]+)\*\*(.*)/s)
  if (match && match[1] && match[2]) {
    const w = strToW(nonEmptyString_afterTrim(match[1]))
    const content = nonEmptyString_afterTrim(match[2])
    return { t: "new_word_line", w, content }
  }
  return { t: "continuation", content: line }
}
