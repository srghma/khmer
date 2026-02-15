#!/usr/bin/env npx tsx

import * as fs from 'fs'
import * as path from 'path'
import {
  type TypedKhmerWordDictionaryIndexElement,
  strToKhmerWordDictionaryIndexOrUndefined,
} from './utils/khmer-word-dictionary-index'
import { colorizeKhmerHtml } from './utils/khmer-colorize-html'
import { type ValidNonNegativeInt } from './utils/toNumber'
import { const_EMPTY, extractPageData } from './utils/page'
import { strToKhmerWordOrThrow, type TypedKhmerWord } from './utils/khmer-word'
import {
  strToRussianWordDictionaryIndexElementOrUndefined,
  strToRussianWordDictionaryIndexOrUndefined,
  type TypedRussianWordDictionaryIndexElement,
} from './utils/russian-word-dictionary-index'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
  nonEmptyString_afterTrim,
} from './utils/non-empty-string-trimmed'
import { Array_assertNonEmptyArray, type NonEmptyArray } from './utils/non-empty-array'
import { Array_filterMap_undefined } from './utils/array'
import { type NonEmptySet } from './utils/non-empty-set'
import { validateMarkdownContent, type MarkdownValidationConfig } from './utils/validateMarkdownLine'

// --- Configuration ---

const SPELLCHECKER_DICT_PATH = '/home/srghma/projects/khmer/khmer-spellchecker/dictionary.txt'
const RU_KM_DICT_PATH = '/home/srghma/projects/khmer/Краткий русско-кхмерский словарь--content.txt'
const KM_RU_DICT_PATH = '/home/srghma/projects/khmer/Кхмерско-русский словарь-Горгониев--content.txt'

// --- Types ---

export type ParsedPageContentElement<T extends NonEmptyStringTrimmed> = {
  index: NonEmptySet<T>
  indexRaw: NonEmptyStringTrimmed
  content: NonEmptyStringTrimmed
}

export type ParsedPage<T extends NonEmptyStringTrimmed> = readonly [
  ValidNonNegativeInt,
  NonEmptyArray<ParsedPageContentElement<T>>,
]

export interface GroupedEntry<T> {
  readonly headword: T
  readonly allContent: ReadonlyArray<NonEmptyStringTrimmed>
  readonly pages: ReadonlySet<ValidNonNegativeInt>
}

// --- Helper Functions ---

export const markdownToHtml = (markdown: string): string =>
  markdown
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\*([^*]+)\*/g, '<i>$1</i>')
    .replace(/`([^`]+)`/g, '<span class="ipa">$1</span>')
    .replace(/\$\\diamond\$/g, '◊')
    .replace(/<>/g, '◊')
    .replace(/\n/g, '<br>')
    .replace(/(<br>){3,}/g, '<br><br>')

// --- 1. Extraction Logic ---

function extractHeadwordAndContent<T extends NonEmptyStringTrimmed>(
  line: NonEmptyStringTrimmed,
  validator: (s: NonEmptyStringTrimmed) => NonEmptySet<T> | undefined,
  contextInfo: string,
): ParsedPageContentElement<T> {
  const match = line.match(/^\*\*([^*]+)\*\*(.*)$/)

  if (!match) {
    throw new Error(`[${contextInfo}] Line does not start with **Headword**: "${line.substring(0, 20)}..."`)
  }

  const rawHeadword_ = match[1]?.trim()
  const rawContent = match[2]?.replace(/^,/, '')?.trim()

  if (!rawHeadword_) throw new Error(`[${contextInfo}] Empty headword extracted.`)
  if (!rawContent) throw new Error(`[${contextInfo}] Empty content extracted.`)

  const rawHeadword = nonEmptyString_afterTrim(rawHeadword_)
  const validatedHeadword = validator(rawHeadword)

  if (!validatedHeadword)
    throw new Error(
      // console.error(
      `[${contextInfo}] Headword "${rawHeadword}" failed validation.`,
    )

  const finalContent = String_toNonEmptyString_orUndefined_afterTrim(rawContent)

  if (!finalContent) throw new Error(`[${contextInfo}] Resulting content is empty.`)

  // const finalContent_ = strToRussianWordDictionaryIndexElementOrUndefined(finalContent)
  //
  // if (!finalContent_) throw new Error(`[${contextInfo}] not RussianWordDictionaryIndex ${finalContent}.`)

  return {
    index: validatedHeadword,
    indexRaw: rawHeadword,
    content: finalContent,
  }
}

// --- 2. File Parsing ---

export function parseDictionaryFile<T extends NonEmptyStringTrimmed>(
  filePath: string,
  validator: (s: NonEmptyStringTrimmed) => NonEmptySet<T> | undefined,
  validationConfig: MarkdownValidationConfig = {
    checkBold: true,
    checkBackticks: true,
    checkItalics: true,
    checkBrackets: true,
    // checkParens: true,
  },
): NonEmptyArray<ParsedPage<T>> {
  const fileName = path.basename(filePath)
  console.log(`\n--- Parsing: ${fileName} ---`)

  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`)

  const content = fs.readFileSync(filePath, 'utf-8')
  const rawPages = extractPageData(content)
  console.log(`    Found ${rawPages.length} raw pages.`)

  const nonEmptyPages = rawPages.filter((p): p is [ValidNonNegativeInt, NonEmptyStringTrimmed] => p[1] !== const_EMPTY)

  // --- NEW: Validation Step ---
  validateMarkdownContent(nonEmptyPages, validationConfig)

  const parsedPages: ParsedPage<T>[] = nonEmptyPages.map(([pageNum, pageContent]) => {
    const rawLines = Array_filterMap_undefined(
      pageContent.split('\n').map(l => l.trim()),
      String_toNonEmptyString_orUndefined_afterTrim,
    )

    const entries = rawLines.map(line => extractHeadwordAndContent(line, validator, `Page ${pageNum}`))

    Array_assertNonEmptyArray(entries)
    return [pageNum, entries] as const
  })

  if (parsedPages.length === 0) {
    throw new Error('No valid pages found after parsing.')
  }

  Array_assertNonEmptyArray(parsedPages)
  console.log(`    Successfully parsed ${parsedPages.length} pages containing entries.`)

  return parsedPages
}

// --- 3. Refactored Functional Steps ---

export function validateUniqueHeadwords<T extends NonEmptyStringTrimmed>(
  parsedPages: NonEmptyArray<ParsedPage<T>>,
): void {
  console.log('    Validating headword uniqueness...')
  const seen = new Set<T>()

  parsedPages.forEach(([pageNum, entries]) => {
    entries.forEach(({ index: headwordSet }) => {
      headwordSet.forEach(singleHeadword => {
        if (seen.has(singleHeadword)) {
          console.error(
            // throw new Error(
            `Duplicate headword found: "${singleHeadword}" on page ${pageNum}`,
          )
        }
        seen.add(singleHeadword)
      })
    })
  })
  console.log('    ✅ All headwords are unique.')
}

/**
 * 3a. Group entries by headword
 * Transforms the Page structure into a unique list of Headwords with aggregated content.
 */
export function mkGrouped<T extends NonEmptyStringTrimmed>(
  parsedPages: NonEmptyArray<ParsedPage<T>>,
): GroupedEntry<T>[] {
  console.log('    Grouping entries...')

  // We use a Map locally for efficient aggregation, but the function is pure from the outside.
  const groupedMap = new Map<
    T,
    {
      headword: T
      allContent: NonEmptyStringTrimmed[]
      pages: Set<ValidNonNegativeInt>
    }
  >()

  validateUniqueHeadwords(parsedPages)

  parsedPages.forEach(([pageNum, entries]) => {
    entries.forEach(({ index: headwordList, content }) => {
      headwordList.forEach(singleHeadword => {
        const existing = groupedMap.get(singleHeadword) ?? {
          headword: singleHeadword,
          allContent: [],
          pages: new Set(),
        }
        existing.allContent.push(content)
        existing.pages.add(pageNum)
        groupedMap.set(singleHeadword, existing)
      })
    })
  })

  const result = Array.from(groupedMap.values())
  console.log(`    Unique headwords: ${result.length}`)
  return result
}

function writeStarDictFile<T extends NonEmptyStringTrimmed>(
  grouped: GroupedEntry<T>[],
  outputPath: string,
  khmerDict: Set<TypedKhmerWord>,
): void {
  console.log(`    Generating content for: ${path.basename(outputPath)}`)

  const tabLines = grouped.map(g => {
    // Headword
    const colorizedHeadword = colorizeKhmerHtml(g.headword, khmerDict)
    const duplicateLabel = g.allContent.length > 1 ? ' <span class="duplicate">(duplicate)</span>' : ''

    // Definitions
    const defs = g.allContent.map((c, i) => {
      let html = markdownToHtml(c)
      html = colorizeKhmerHtml(html, khmerDict)

      const index = g.allContent.length > 1 ? `<span class="sense-index">${i + 1}.</span> ` : ''

      return `<dd>${index}${html}</dd>`
    })

    // Dictionary HTML
    const finalHtml = `<dl>
<dt>${colorizedHeadword}${duplicateLabel}</dt>
${defs.join('\n')}
</dl>`

    return `${g.headword}\t${finalHtml.replace(/\n/g, '<br>')}`
  })

  tabLines.sort((a, b) => a.localeCompare(b))

  fs.writeFileSync(outputPath, tabLines.join('\n'), 'utf-8')
  console.log(`    Written to ${outputPath}`)
}

// --- Main Execution ---

async function main() {
  console.log('========================================')
  console.log('STARTING DICTIONARY BUILD')
  console.log('========================================')

  // 1. Load Reference Dict
  console.log(`Loading Spellchecker reference from: ${SPELLCHECKER_DICT_PATH}`)
  if (!fs.existsSync(SPELLCHECKER_DICT_PATH)) throw new Error(`Dictionary file not found: ${SPELLCHECKER_DICT_PATH}`)

  const dictContent = fs.readFileSync(SPELLCHECKER_DICT_PATH, 'utf-8')
  const validKhmerWords: Set<TypedKhmerWord> = new Set(
    dictContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(strToKhmerWordOrThrow),
  )
  console.log(`Loaded ${validKhmerWords.size} valid Khmer words.`)

  // ---------------------------------------------------------
  // 2. Process Russian -> Khmer
  // ---------------------------------------------------------
  {
    const grouped = mkGrouped(
      parseDictionaryFile<TypedRussianWordDictionaryIndexElement>(
        RU_KM_DICT_PATH,
        strToRussianWordDictionaryIndexOrUndefined,
      ),
    )

    // No validation for Russian -> Khmer headwords (Russian words) against Khmer dict
    writeStarDictFile(grouped, RU_KM_DICT_PATH.replace(/\.txt$/, '.tab'), validKhmerWords)
  }

  // ---------------------------------------------------------
  // 3. Process Khmer -> Russian
  // ---------------------------------------------------------
  {
    const grouped = mkGrouped(
      parseDictionaryFile<TypedKhmerWordDictionaryIndexElement>(
        KM_RU_DICT_PATH,
        strToKhmerWordDictionaryIndexOrUndefined,
      ),
    )

    writeStarDictFile(grouped, KM_RU_DICT_PATH.replace(/\.txt$/, '.tab'), validKhmerWords)
  }

  console.log('\n========================================')
  console.log('DONE')
  console.log('========================================')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

// rm -f "/home/srghma/projects/khmer-dicts/Краткий русско-кхмерский словарь--content.slob"
// rm -f "/home/srghma/projects/khmer-dicts/Кхмерско-русский словарь-Горгониев--content.slob"
// pyglossary '/home/srghma/projects/khmer/Краткий русско-кхмерский словарь--content.tab' '/home/srghma/projects/khmer-dicts/Краткий русско-кхмерский словарь--content.slob' --read-format=Tabfile --write-format=Aard2Slob
// pyglossary '/home/srghma/projects/khmer/Кхмерско-русский словарь-Горгониев--content.tab' '/home/srghma/projects/khmer-dicts/Кхмерско-русский словарь-Горгониев--content.slob' --read-format=Tabfile --write-format=Aard2Slob
