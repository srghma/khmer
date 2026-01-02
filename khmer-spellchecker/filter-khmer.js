#!/usr/bin/env node

var fs = require("fs")
var path = require("path")

var cwd = process.cwd()
var khmer = /\p{Script=Khmer}/u
var segmenter = new Intl.Segmenter("km", { granularity: "grapheme" })

var files = Array.from(fs.readdirSync(cwd)).filter((f) =>
  /^dictionary\d*\.txt$/.test(f) && f !== "dictionary1.txt",
)

var combined = files
  .map((file) => {
    var p = path.join(cwd, file)

    var filtered = fs
      .readFileSync(p, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => khmer.test(l))

    fs.writeFileSync(p, filtered.join("\n") + "\n", "utf8")
    return filtered
  })
  .reduce((set, lines) => lines.reduce((s, l) => (s.add(l), s), set), new Set())

fs.writeFileSync(
  path.join(cwd, "dictionary.txt"),
  Array.from(combined)
    .sort(
      (a, b) =>
        Array.from(segmenter.segment(b)).length -
        Array.from(segmenter.segment(a)).length,
    )
    .join("\n") + "\n",
  "utf8",
)

console.log("Processed " + files.length + " files.")
console.log("Combined unique Khmer entries: " + combined.size)
