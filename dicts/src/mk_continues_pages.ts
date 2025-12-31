#!/usr/bin/env npx tsx

import * as fs from "fs"
import * as path from "path"
import {
  TypedKhmerWord,
  strToKhmerWordOrThrow,
} from "@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word"
import {
  TypedRussianWord,
  strToRussianWordOrThrow,
} from "@gemini-ocr-automate-images-upload-chrome-extension/utils/russian-word"
import { assertIsDefinedAndReturn } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts"
import {
  NonEmptyString,
  nonEmptyString_afterTrim,
} from "@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string"
import { extractPageData } from "@js-utils/page"
import { NonEmptyArray } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array"
import { parseLine } from "./utils/parseLine"

// TEST: normal split -> dont join
//
// GIVEN
//   ### Page 1
//   *w1* content content content
//
//   ### Page 2
//   *w2* content
// OUTPUT
//   *w1* content content content
//
//   *w2* content
//
// TEST: next page is continuation of prev -> join
//
// GIVEN
//   ### Page 1
//   *w1* content content content
//
//   ### Page 2
//   content
// OUTPUT
//   *w1* content content content content

// TEST: next page is continuation of prev but in prev word is **content-** and in next its **content** -> join and words too
//
// GIVEN
//   ### Page 1
//   *w1* content content **content-**
//
//   ### Page 2
//   **content**
// OUTPUT
//   *w1* content content **contentcontent**

const processFile = <W>(inputPath: string, strToW: (s: string) => W): void => {
  const outputPath = inputPath.replace(".txt", "--continuous.txt")
  console.log(`Processing: ${path.basename(inputPath)}...`)

  const rawFileContent = fs.readFileSync(inputPath, "utf-8")
  const pages = extractPageData(rawFileContent)

  const processedEntries = pages.reduce<string[]>(
    (acc, [_, pageContent], pageIdx) => {
      const lines = pageContent
        .split(/\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((l) => nonEmptyString_afterTrim(l))

      lines.forEach((line, lineIdx) => {
        const parsed = parseLine(line, strToW)

        if (parsed.t === "new_word_line") {
          // Reconstruct the line: **word** + remainder
          // We use the word 'w' but wrap it back in markdown
          acc.push(`**${parsed.w}** ${parsed.content}`)
        } else {
          if (acc.length === 0) {
            acc.push(parsed.content)
            return
          }

          const lastIdx = acc.length - 1
          const lastEntry = assertIsDefinedAndReturn(acc[lastIdx])
          const isFirstLineOfNewPage = lineIdx === 0 && pageIdx > 0

          if (isFirstLineOfNewPage) {
            // Cross-page merging (hard join)
            if (lastEntry.endsWith("-**") && parsed.content.startsWith("**")) {
              // Handle the specific case: **word-** (page break) **word**
              acc[lastIdx] = lastEntry.slice(0, -3) + parsed.content.slice(2)
            } else {
              acc[lastIdx] = lastEntry + parsed.content
            }
          } else {
            // Intra-page merging (soft join)
            if (lastEntry.endsWith("-")) {
              acc[lastIdx] = lastEntry.slice(0, -1) + parsed.content
            } else {
              acc[lastIdx] = lastEntry + " " + parsed.content
            }
          }
        }
      })

      return acc
    },
    [],
  )

  fs.writeFileSync(outputPath, processedEntries.join("\n\n"), "utf-8")
  console.log(`✓ Created: ${path.basename(outputPath)}`)
}

// --- Execution ---

processFile(
  "/home/srghma/projects/khmer/Краткий русско-кхмерский словарь--content.txt",
  strToRussianWordOrThrow,
)
processFile(
  "/home/srghma/projects/khmer/Кхмерско-русский словарь-Горгониев--content.txt",
  strToKhmerWordOrThrow,
)
