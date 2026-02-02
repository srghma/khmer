import {
  nonEmptyString_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type KhmerWordsMap, yieldOnlyVerifiedKhmerWords } from '../../db/dict'

export type GraphemeIndex = Map<NonEmptyStringTrimmed, NonEmptyStringTrimmed[]>

export const buildGraphemeIndex = (wordsMap: KhmerWordsMap): { index: GraphemeIndex; count: number } => {
  const newIndex = new Map<NonEmptyStringTrimmed, NonEmptyStringTrimmed[]>()
  // Note: Intl.Segmenter creation is cheap, but can be moved out if strictly necessary.
  const segmenter = new Intl.Segmenter('km', { granularity: 'grapheme' })
  let count = 0

  // Use the generator to iterate only verified Khmer words
  for (const word of yieldOnlyVerifiedKhmerWords(wordsMap)) {
    count++
    const segments = segmenter.segment(word)
    const seenInWord = new Set<string>()

    for (const { segment } of segments) {
      if (seenInWord.has(segment)) continue
      seenInWord.add(segment)

      let list = newIndex.get(nonEmptyString_afterTrim(segment))

      if (!list) {
        list = []
        newIndex.set(nonEmptyString_afterTrim(segment), list)
      }
      list.push(word)
    }
  }

  // Sort lists by length for better UI presentation
  for (const list of newIndex.values()) {
    list.sort((a, b) => a.length - b.length)
  }

  return { index: newIndex, count }
}
