import {
  assertIsDefined,
  assertIsDefinedAndReturn,
} from "@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts"
import { Array_partition } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/array"
import {
  isKhmerWord,
  strToKhmerWordOrThrow,
  TypedKhmerWord,
} from "@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word"
import fs from "node:fs/promises"
import { strToKhmerWordDictionaryIndexElementOrThrow, TypedKhmerWordDictionaryIndexElement } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word-dictionary-index"

// Types
interface HeadwordData {
  word: TypedKhmerWordDictionaryIndexElement
  variants: TypedKhmerWord[]
  nounForms: TypedKhmerWord[]
  pronunciations: string[]
}

interface Definition {
  text: string
  order: number
}

interface PartOfSpeech {
  type: string
  definitions: Definition[]
}

interface DictionaryEntry {
  headword: HeadwordData
  partsOfSpeech: PartOfSpeech[]
  rawHtml: string
}

export function dictionaryEntry_onlyTypedKhmerWord(
  e: DictionaryEntry,
): (TypedKhmerWord | TypedKhmerWordDictionaryIndexElement)[] {
  const { word, variants, nounForms } = e.headword
  return [word, ...variants, ...nounForms]
}

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; line?: number }

// Headword parser
const parseHeadword = (headwordStr: string): ParseResult<HeadwordData> => {
  const [word_, ...nonWords] = headwordStr
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean)

  const word = strToKhmerWordDictionaryIndexElementOrThrow(
    assertIsDefinedAndReturn(word_),
  )

  const [nounForms_, nonWordsAndNounForms] = Array_partition(
    nonWords,
    (p) => p.startsWith("ការ") || p.startsWith("ភាព"),
  )
  const nounForms = nounForms_.map(strToKhmerWordOrThrow)

  const [khmerWords_, nonKhmerWords] = Array_partition(
    nonWordsAndNounForms,
    isKhmerWord,
  )
  const khmerWords = khmerWords_.map(strToKhmerWordOrThrow)

  return {
    success: true,
    data: {
      word,
      variants: khmerWords,
      nounForms: nounForms.map(strToKhmerWordOrThrow),
      pronunciations: nonKhmerWords,
    },
  }
}

// HTML parser
const parseHtmlDefinitions = (html: string): ParseResult<PartOfSpeech[]> => {
  const partsOfSpeech: PartOfSpeech[] = []

  // Split by <br> to separate different parts of speech
  const sections = html.split("<br>").filter(Boolean)

  let currentPos: PartOfSpeech | null = null

  for (const section of sections) {
    const trimmed = section.trim()

    // Check for part of speech marker
    const posMatch = trimmed.match(/<i>(.*?)<\/i>/)
    if (posMatch) {
      const posType = assertIsDefinedAndReturn(posMatch[1])

      // If this is a new part of speech, save the previous one
      if (currentPos && currentPos.definitions.length > 0) {
        partsOfSpeech.push(currentPos)
      }

      currentPos = {
        type: posType,
        definitions: [],
      }
      continue
    }

    // Check for ordered list
    const olMatch = trimmed.match(/<ol>(.*?)<\/ol>/s)
    if (olMatch && currentPos) {
      const listContent = assertIsDefinedAndReturn(olMatch[1])
      const liMatches = listContent.matchAll(/<li>(.*?)<\/li>/g)

      let order = 1
      for (const liMatch of liMatches) {
        currentPos.definitions.push({
          text: assertIsDefinedAndReturn(liMatch[1]).trim(),
          order: order++,
        })
      }
    }
  }

  // Don't forget the last part of speech
  if (currentPos && currentPos.definitions.length > 0) {
    partsOfSpeech.push(currentPos)
  }

  return {
    success: true,
    data: partsOfSpeech,
  }
}

// Main TSV line parser
const parseTsvLine = (
  line: string,
  lineNumber: number,
): ParseResult<DictionaryEntry> => {
  const parts = line.split("\t")

  if (parts.length !== 2) {
    return {
      success: false,
      error: `Expected exactly 2 tab-separated items, got ${parts.length}`,
      line: lineNumber,
    }
  }

  const [headwordStr, htmlStr] = parts
  assertIsDefined(headwordStr)
  assertIsDefined(htmlStr)

  // Parse headword
  const headwordResult = parseHeadword(headwordStr)
  if (!headwordResult.success) {
    return {
      success: false,
      error: `Headword parse error: ${headwordResult.error}`,
      line: lineNumber,
    }
  }

  // Parse HTML definitions
  const htmlResult = parseHtmlDefinitions(htmlStr)
  if (!htmlResult.success) {
    return {
      success: false,
      error: `HTML parse error: ${htmlResult.error}`,
      line: lineNumber,
    }
  }

  return {
    success: true,
    data: {
      headword: headwordResult.data,
      partsOfSpeech: htmlResult.data,
      rawHtml: htmlStr,
    },
  }
}

// Main TSV parser
const parseTsvFile = (tsvContent: string): ParseResult<DictionaryEntry[]> =>
  (() => {
    const lines = tsvContent.split("\n").filter((line) => line.trim())
    const entries: DictionaryEntry[] = []
    const errors: string[] = []

    lines.forEach((line, index) => {
      const result = parseTsvLine(line, index + 1)

      if (result.success) {
        entries.push(result.data)
      } else {
        errors.push(`Line ${result.line}: ${result.error}`)
      }
    })

    if (errors.length > 0) {
      return {
        success: false,
        error: `Failed to parse ${errors.length} line(s):\n${errors.join("\n")}`,
      }
    }

    return {
      success: true,
      data: entries,
    }
  })()

export const processTsvFile = async (): Promise<DictionaryEntry[]> => {
  const filePath =
    "/home/srghma/projects/khmer-dicts/Khmer-English Wiktionary dictionary.tsv"
  const content = await fs.readFile(filePath, "utf8")
  const result = parseTsvFile(content)
  if (result.success) {
    return result.data
  } else {
    console.error(result.error)
    throw new Error(`Parse error ${filePath}`)
  }
}

const printTsvFile = async (data: DictionaryEntry[]): Promise<void> => {
  console.log(`Parsed ${data.length} entries`)
  data.slice(0, 15).forEach((entry) => {
    console.log(`\nWord: ${entry.headword.word}`)
    console.log(`Pronunciation: ${entry.headword.pronunciations}`)

    entry.partsOfSpeech.forEach((pos) => {
      console.log(`  ${pos.type}:`)
      pos.definitions.forEach((def) => {
        console.log(`    ${def.order}. ${def.text}`)
      })
    })
  })

  await exportToJson(
    data,
    "/home/srghma/projects/khmer-dicts/Khmer-English_Wiktionary.json",
  )
}

const exportToJson = async (
  entries: DictionaryEntry[],
  outputPath: string,
): Promise<void> => {
  const json = JSON.stringify(
    entries, // entries.map((x) => x.headword),
    null,
    2,
  )
  await fs.writeFile(outputPath, json, "utf8")
  console.log(`JSON exported to ${outputPath}`)
}

const main = async () => {
  try {
    await processTsvFile()
  } catch (err) {
    console.error("Fatal error:", err)
    process.exitCode = 1
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
