#!/usr/bin/env node

var fs = require("fs")
var path = require("path")

var cwd = process.cwd()

// Regex to find ANY Khmer character
var khmerRegex = /\p{Script=Khmer}/u
// Regex to split by anything that is NOT a Khmer character (for non-official dicts)
var nonKhmerSplitRegex = /[^\p{Script=Khmer}]+/u

// Find all dictionary files
var files = Array.from(fs.readdirSync(cwd)).filter((f) =>
  /^dictionary\d*\.txt$/.test(f),
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
    // Do NOT split by non-Khmer (preserve phrases/spaces if official).
    // Just remove lines that don't have Khmer, trim, and unique.
    cleanedWords = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .filter((l) => khmerRegex.test(l)) // Must contain at least one Khmer char
  } else {
    // === SCRAPED/OTHER DICTIONARIES LOGIC ===
    // Split by anything that is NOT Khmer.
    // This removes English, spaces, punctuation, numbers, etc.
    cleanedWords = content
      .split(nonKhmerSplitRegex)
      .map((w) => w.trim())
      .filter((w) => w.length > 0)
    cleanedWords = [...new Set(cleanedWords)]
    cleanedWords = cleanedWords.sort(sorterByL)
  }

  // Write the cleaned, unique version back to the individual file
  // (Optional: You can sort these locally too if you want, currently just listing them)
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
