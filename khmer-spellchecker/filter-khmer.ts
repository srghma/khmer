#!/usr/bin/env node

import * as fs from "fs"
import * as path from "path"
import { reorderText } from "khmer-normalize"
import { split } from "split-khmer"
import {
  strToKhmerWordOrThrow,
  strToKhmerWords,
} from "./src/utils/khmer-word"
import { descNumber, sortBy_immutable_cached } from "./src/utils/sort"

// var cwd = process.cwd()
const cwd: string = "/home/srghma/projects/khmer/khmer-spellchecker"

// --- CONFIGURATION ---
const ENABLE_NORMALIZE: boolean = false
const ENABLE_SPLIT: boolean = false
// ---------------------

// Regex to find ANY Khmer character
const khmerRegex: RegExp = /\p{Script=Khmer}/u
// Regex to split by anything that is NOT a Khmer character (for non-official dicts)
const nonKhmerSplitRegex: RegExp = /[^\p{Script=Khmer}]+/u

// Find all dictionary files
const files: string[] = Array.from(fs.readdirSync(cwd)).filter(
  (f: string) => /^dictionary\d*\.txt$/.test(f) || f === "dictionary-my.txt",
)

// Master set to hold all unique words from all files
const masterSet: Set<string> = new Set()

files.forEach((file: string) => {
  const p: string = path.join(cwd, file)
  const content: string = fs.readFileSync(p, "utf8")
  let cleanedWords: string[] = []

  if (file === "dictionary1.txt") {
    // === OFFICIAL DICTIONARY LOGIC ===
    // Do NOT normalize or split. Keep exact phrases.
    // Just remove lines that don't have Khmer, trim, and unique.
    cleanedWords = content
      .split(/\r?\n/)
      .map((l: string) => l.trim())
      .flatMap(strToKhmerWords) // Must contain at least one Khmer char
      .filter((l: string) => l.length > 1)
    // .filter((l: string) => khmerRegex.test(l)) // Must contain at least one Khmer char
  } else if (file === "dictionary-my.txt") {
    cleanedWords = content
      .split(/\r?\n/)
      .map((l: string) => l.trim())
      .flatMap(strToKhmerWords)
  } else {
    // === SCRAPED/OTHER DICTIONARIES LOGIC ===

    // 1. Initial Cleanup: Split by garbage (English, numbers, spaces)
    const rawChunks: string[] = content
      .split(nonKhmerSplitRegex)
      .map((w: string) => w.trim())
      .filter((w: string) => w.length > 0)
      .flatMap(strToKhmerWords)
      .filter((w: string) => w.length > 0)

    // 2. Process Chunks
    cleanedWords = rawChunks.flatMap((chunk: string) => {
      let processed: string = chunk

      // Apply Normalization (fix vowel/subscript order)
      if (ENABLE_NORMALIZE) {
        try {
          processed = reorderText(processed)
        } catch (e) {
          // If normalization fails, keep original
        }
      }

      // Apply Word Splitting (break "Sentence" into "Words")
      if (ENABLE_SPLIT) {
        try {
          // split returns an array of words
          return split(processed)
        } catch (e) {
          return [processed]
        }
      } else {
        return [processed]
      }
    })

    // 3. Deduplicate & Sort locally
    cleanedWords = [...new Set(cleanedWords)]
    cleanedWords = cleanedWords
      .filter((l: string) => l.length > 1)
      .filter((l: string) => khmerRegex.test(l)) // Must contain at least one Khmer char
      .flatMap(strToKhmerWords)
      .filter((w: string) => w.length > 0)

    cleanedWords = sortBy_immutable_cached(
      cleanedWords,
      (a) => Array.from(a).length,
      descNumber,
    )
  }

  // Write the cleaned, unique version back to the individual file
  fs.writeFileSync(p, cleanedWords.join("\n") + "\n", "utf8")

  // Add to master set
  cleanedWords.forEach((w: string) => masterSet.add(w))
})

// === COMBINE AND SORT ===

const sortedResult: string[] = sortBy_immutable_cached(
  Array.from(masterSet).map(strToKhmerWordOrThrow),
  (a) => Array.from(a).length,
  descNumber,
)

// Write to the main dictionary.txt
fs.writeFileSync(
  path.join(cwd, "dictionary.txt"),
  sortedResult.join("\n") + "\n",
  "utf8",
)

console.log("Processed " + files.length + " files.")
console.log("Combined unique Khmer entries: " + masterSet.size)
