import {
  NonEmptyString,
  nonEmptyString_afterTrim,
} from "@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string"

// Extract Khmer word from bold markdown
export type ParseLineResult<W> =
  | { t: "new_word_line"; w: W; content: NonEmptyString }
  | { t: "continuation"; content: NonEmptyString }

// --- Logic ---

export const parseLine = <W>(
  line: NonEmptyString,
  strToW: (s: NonEmptyString) => W,
): ParseLineResult<W> => {
  const match = line.match(/^\*\*([^*]+)\*\*(.*)/s)
  if (match && match[1] && match[2]) {
    const w = strToW(nonEmptyString_afterTrim(match[1]))
    const content = nonEmptyString_afterTrim(match[2])
    return { t: "new_word_line", w, content }
  }
  return { t: "continuation", content: line }
}
