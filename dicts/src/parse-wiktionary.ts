#!/usr/bin/env bun

import * as fs from "fs"
import * as path from "path"
import sax from "sax"
import { colorizeKhmerHtml } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/colorize-html"
import { strToKhmerWordOrThrow } from "@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word"

const CONFIG = {
  // We read from STDIN to allow piping from bunzip2
  // Usage: bunzip2 -c enwiktionary.xml.bz2 | ./parse-wiktionary.ts
  outDir: "/home/srghma/projects/khmer-dicts/",
  spellcheckerDictFile:
    "/home/srghma/projects/khmer/khmer-spellchecker/dictionary.txt",
}

// --- Regex Parsers for Wikitext ---

// Extracts {{IPA|en|/tɛst/}}
const REGEX_IPA_EN = /\{\{IPA\|en\|([^}]+)\}\}/
// Extracts {{t+|km|ក|tr=kɑɑ}} or {{t|km|...}}
const REGEX_TRANS_KM = /\{\{t\+?\|km\|([^}|]+)(?:\|tr=([^}|]+))?.*?\}\}/g
// Detects start of sections
const REGEX_SECTION_LANG = /^==\s*([^=]+)\s*==$/
const REGEX_SECTION_POS = /^===\s*([^=]+)\s*===$/

// --- Types ---

interface EnToKmEntry {
  headword: string
  ipa?: string
  pos: string
  translations: { km: string; rom?: string }[]
}

interface KmToEnEntry {
  headword: string
  pos: string
  definitions: string[]
  ipaRaw?: string // Note: Wiktionary often uses {{km-IPA}} which requires Lua to render
}

// --- Helper: Load Dictionary for Colorization ---

const loadSpellcheckerDict = (filePath: string) => {
  if (!fs.existsSync(filePath)) throw new Error(`Dict not found: ${filePath}`)
  const content = fs.readFileSync(filePath, "utf-8")
  return new Set(
    content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map(strToKhmerWordOrThrow),
  )
}

// --- Logic ---

const processPageText = (
  title: string,
  text: string,
): { enKm?: EnToKmEntry; kmEn?: KmToEnEntry } => {
  const lines = text.split("\n")
  let currentLang = ""
  let currentPos = ""

  // Buffers
  let enIpa: string | undefined
  let enTranslations: { km: string; rom?: string }[] = []

  let kmDefs: string[] = []
  let kmIpaRaw: string | undefined

  // Flags to know if we found relevant data
  let foundEn = false
  let foundKm = false

  for (const line of lines) {
    const trimmed = line.trim()

    // 1. Detect Language Header (== English ==)
    const langMatch = trimmed.match(REGEX_SECTION_LANG)
    if (langMatch) {
      currentLang = langMatch[1]!.trim()
      continue
    }

    // 2. Detect POS Header (=== Noun ===)
    const posMatch = trimmed.match(REGEX_SECTION_POS)
    if (posMatch) {
      currentPos = posMatch[1]!.trim()
      continue
    }

    // --- Processing English Section (Source for En->Km) ---
    if (currentLang === "English") {
      foundEn = true

      // Grab IPA
      if (!enIpa) {
        const ipaMatch = trimmed.match(REGEX_IPA_EN)
        if (ipaMatch) enIpa = ipaMatch[1]
      }

      // Grab Translations
      // Wiktionary stores translations in {{trans-top}} ... {{trans-bottom}} blocks
      // We just scan lines for {{t+|km|...}}
      let transMatch
      while ((transMatch = REGEX_TRANS_KM.exec(trimmed)) !== null) {
        const kmWord = transMatch[1]
        const rom = transMatch[2]
        if (kmWord) {
          enTranslations.push({ km: kmWord, rom })
        }
      }
    }

    // --- Processing Khmer Section (Source for Km->En) ---
    if (currentLang === "Khmer") {
      foundKm = true

      // Grab Raw IPA Template (e.g. {{km-IPA}})
      if (trimmed.includes("{{km-IPA") || trimmed.includes("{{IPA|km")) {
        kmIpaRaw = trimmed
      }

      // Grab Definitions (lines starting with #)
      // Ignore lines starting with #: (examples) or #* (quotes)
      if (
        trimmed.startsWith("#") &&
        !trimmed.startsWith("#:") &&
        !trimmed.startsWith("#*")
      ) {
        // Clean wiki markup [[link|text]] -> text
        const cleanDef = trimmed
          .replace(/^#\s+/, "")
          .replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, "$1") // [[link|text]] -> text
          .replace(/\{\{[^}]+\}\}/g, "") // Remove other templates
          .trim()

        if (cleanDef) kmDefs.push(cleanDef)
      }
    }
  }

  const result: { enKm?: EnToKmEntry; kmEn?: KmToEnEntry } = {}

  if (foundEn && enTranslations.length > 0) {
    result.enKm = {
      headword: title,
      ipa: enIpa,
      pos: "Mixed", // Simplifying POS for bulk extraction
      translations: enTranslations,
    }
  }

  if (foundKm && kmDefs.length > 0) {
    result.kmEn = {
      headword: title,
      pos: "Mixed",
      definitions: kmDefs,
      ipaRaw: kmIpaRaw,
    }
  }

  return result
}

async function main() {
  const spellCheckDict = loadSpellcheckerDict(CONFIG.spellcheckerDictFile)

  const enKmStream = fs.createWriteStream(
    path.join(CONFIG.outDir, "En-Km-Wiktionary.tab"),
  )
  const kmEnStream = fs.createWriteStream(
    path.join(CONFIG.outDir, "Km-En-Wiktionary.tab"),
  )

  const saxStream = sax.createStream(true, { trim: true }) // Strict mode

  let currentTag: string | null = null
  let currentTitle: string | null = null
  let currentText = ""
  let pageCounter = 0

  saxStream.on("opentag", (node) => {
    currentTag = node.name
    if (currentTag === "page") {
      currentTitle = null
      currentText = ""
    }
  })

  saxStream.on("text", (text) => {
    if (currentTag === "title") {
      currentTitle = text
    } else if (currentTag === "text") {
      currentText += text
    }
  })

  saxStream.on("closetag", (tagName) => {
    if (tagName === "page") {
      pageCounter++
      if (pageCounter % 10000 === 0)
        console.log(`Processed ${pageCounter} pages...`)

      if (currentTitle && currentText) {
        // Skip meta pages (Template:, Category:, etc.)
        if (currentTitle.includes(":")) return

        const { enKm, kmEn } = processPageText(currentTitle, currentText)

        if (enKm) {
          // Format En-Km: Headword \t <html>
          const ipaHtml = enKm.ipa
            ? `<span style="color:#888">[${enKm.ipa}]</span>`
            : ""

          const transHtml = enKm.translations
            .map((t) => {
              const colorized = colorizeKhmerHtml(t.km, spellCheckDict)
              const romHtml = t.rom ? ` <i>(${t.rom})</i>` : ""
              return `<li>${colorized}${romHtml}</li>`
            })
            .join("")

          const html = `${ipaHtml}<ul>${transHtml}</ul>`
          enKmStream.write(`${enKm.headword}\t${html.replace(/\n/g, "")}\n`)
        }

        if (kmEn) {
          // Format Km-En: Headword \t <html>
          const defsHtml = kmEn.definitions
            .map((d, i) => `<div><b>${i + 1}.</b> ${d}</div>`)
            .join("")
          // Note: kmIpaRaw is usually just {{km-IPA}}, not useful to display without processing
          const html = defsHtml

          // Clean newline in headword just in case
          const cleanHead = kmEn.headword.replace(/[\r\n]+/g, " ")
          kmEnStream.write(`${cleanHead}\t${html.replace(/\n/g, "")}\n`)
        }
      }
    }
    currentTag = null
  })

  saxStream.on("error", (e) => {
    console.error("XML Error:", e)
    // resume?
  })

  saxStream.on("end", () => {
    console.log("Parsing complete.")
    enKmStream.end()
    kmEnStream.end()
  })

  // Pipe STDIN to parser
  console.log("Reading from Stdin...")
  process.stdin.pipe(saxStream)
}

main().catch(console.error)
