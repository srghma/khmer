import * as splitKhmer from 'split-khmer'
import {
  nonEmptyArrayOfString_afterTrim,
  nonEmptyString_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed.js'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts.js'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array.js'
import { isKhmer } from 'is-khmer'

// Types
export interface AnkiCard {
  id: NonEmptyStringTrimmed
  // notetype: NonEmptyStringTrimmed;
  // deck: NonEmptyStringTrimmed;
  word: NonEmptyStringTrimmed
  words: NonEmptyArray<NonEmptyStringTrimmed>
  // wordrom: NonEmptyStringTrimmed;
  // worden: NonEmptyStringTrimmed;
  // sent: NonEmptyStringTrimmed;
  // sentrom: NonEmptyStringTrimmed;
  // senten: NonEmptyStringTrimmed;
  // pos: NonEmptyStringTrimmed;
  // ety: NonEmptyStringTrimmed;
  // pronunciation: NonEmptyStringTrimmed;
  // senses: NonEmptyStringTrimmed;
  // derivedTerms: NonEmptyStringTrimmed;
  // wordaudio: NonEmptyStringTrimmed;
  // sentaudio: NonEmptyStringTrimmed;
  // tags: NonEmptyStringTrimmed;
}

// ក្មេង ស្រី
// ឡ,(ឡ,ដុត,នំ)
const splitOnWords = (word: NonEmptyStringTrimmed): NonEmptyArray<NonEmptyStringTrimmed> => {
  // Regex explanation:
  // \s   -> matches spaces, tabs, newlines
  // ,    -> matches comma
  // ()   -> matches parentheses
  // .?!  -> matches standard punctuation
  // ;:"' -> matches quotes and separators
  // |/-  -> matches bars, slashes, hyphens
  // []{} -> matches brackets/braces
  const delimiters = /[\s,(){}\[\]<>"';:!?.|\\/-]+/

  // 1. Split the string by delimiters first to get "clean" chunks
  const rawChunks = word.split(delimiters)

  // 2. Filter out empty chunks (e.g. from "word1,,word2")
  // 3. Pass each chunk to splitKhmer to handle the Khmer-specific segmentation
  const splitWords = rawChunks.filter(chunk => chunk.trim().length > 0).flatMap(chunk => splitKhmer.split(chunk))

  // 4. Validate and trim final result
  return nonEmptyArrayOfString_afterTrim(splitWords)
}

// Parse TSV line to AnkiCard
export const parseLine = (line: NonEmptyStringTrimmed): AnkiCard => {
  const cols = line.split('\t')
  if (cols.length < 17) throw new Error('invalid')

  const word = nonEmptyString_afterTrim(assertIsDefinedAndReturn(cols[3]))
  const words = splitOnWords(word)
  if (!words.every(isKhmer)) throw new Error(`not khmer words ${words}`)

  return {
    id: nonEmptyString_afterTrim(assertIsDefinedAndReturn(cols[0])),
    // notetype: cols[1],
    // deck: cols[2],
    word,
    words,
    // wordrom: cols[4],
    // worden: cols[5],
    // sent: cols[6],
    // sentrom: cols[7],
    // senten: cols[8],
    // pos: cols[9],
    // ety: cols[10],
    // pronunciation: cols[11],
    // senses: cols[12],
    // derivedTerms: cols[13],
    // wordaudio: cols[14],
    // sentaudio: cols[15],
    // tags: cols[16],
  }
}
