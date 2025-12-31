#!/usr/bin/env node

var fs = require("fs")
var path = require("path")
var { reorderText } = require("khmer-normalize")
var { split } = require("split-khmer")

// var cwd = process.cwd()
var cwd = "/home/srghma/projects/khmer/khmer-spellchecker"

// --- CONFIGURATION ---
var ENABLE_NORMALIZE = false
var ENABLE_SPLIT = false
// ---------------------

// Regex to find ANY Khmer character
var khmerRegex = /\p{Script=Khmer}/u
// Regex to split by anything that is NOT a Khmer character (for non-official dicts)
var nonKhmerSplitRegex = /[^\p{Script=Khmer}]+/u

// Find all dictionary files
var files = Array.from(fs.readdirSync(cwd)).filter(
  (f) => /^dictionary\d*\.txt$/.test(f) || f === "dictionary-my.txt",
)

// Master set to hold all unique words from all files
var masterSet = new Set()

var sorterByL = (a, b) => {
  // Sort by length descending, using Array.from to count Code Points
  return Array.from(b).length - Array.from(a).length
}

files.forEach((file) => {
  var p = path.join(cwd, file)
  var content = fs.readFileSync(p, "utf8")
  var cleanedWords = []

  if (file === "dictionary1.txt") {
    // === OFFICIAL DICTIONARY LOGIC ===
    // Do NOT normalize or split. Keep exact phrases.
    // Just remove lines that don't have Khmer, trim, and unique.
    cleanedWords = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 1)
      .filter((l) => khmerRegex.test(l)) // Must contain at least one Khmer char
  } else if (file === "dictionary-my.txt") {
    cleanedWords = content.split(/\r?\n/).map((l) => l.trim())
  } else {
    // === SCRAPED/OTHER DICTIONARIES LOGIC ===

    // 1. Initial Cleanup: Split by garbage (English, numbers, spaces)
    var rawChunks = content
      .split(nonKhmerSplitRegex)
      .map((w) => w.trim())
      .filter((w) => w.length > 0)

    // 2. Process Chunks
    cleanedWords = rawChunks.flatMap((chunk) => {
      let processed = chunk

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
      .filter((l) => l.length > 1)
      .filter((l) => khmerRegex.test(l)) // Must contain at least one Khmer char
      .sort(sorterByL)
  }

  // Write the cleaned, unique version back to the individual file
  fs.writeFileSync(p, cleanedWords.join("\n") + "\n", "utf8")

  // Add to master set
  cleanedWords.forEach((w) => masterSet.add(w))
})

// === COMBINE AND SORT ===

var sortedResult = Array.from(masterSet).sort(sorterByL)

// Write to the main dictionary.txt
fs.writeFileSync(
  path.join(cwd, "dictionary.txt"),
  sortedResult.join("\n") + "\n",
  "utf8",
)

console.log("Processed " + files.length + " files.")
console.log("Combined unique Khmer entries: " + masterSet.size)
